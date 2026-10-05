package com.example.codeexecution.modules.submission;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoTemplate;

import com.example.codeexecution.modules.submission.dtos.RunRequest;
import com.example.codeexecution.modules.submission.entities.CustomTestCaseInput;
import com.example.codeexecution.modules.submission.entities.Language;
import com.example.codeexecution.modules.submission.entities.Submission;
import com.example.codeexecution.modules.submission.entities.SubmissionStatus;
import com.example.codeexecution.modules.submission.entities.SubmissionType;

import tools.jackson.databind.json.JsonMapper;

/**
 * Guards the new custom-testcase contract on {@code RunRequest}:
 *
 * <ul>
 *   <li>{@code customTestcases[]} entries carry BOTH {@code customInput} and
 *       {@code expectedOutput};</li>
 *   <li>a legacy bare-string entry still deserializes (input only);</li>
 *   <li>the entries survive a round trip through the {@code submissions}
 *       Mongo document, which is what the worker reads back.</li>
 * </ul>
 */
@SpringBootTest
class CustomTestcaseContractTest {

    @Autowired
    private MongoTemplate mongoTemplate;

    private static RunRequest parse(String json) {
        return JsonMapper.builder().build().readValue(json, RunRequest.class);
    }

    @Test
    void customTestcasesCarryInputAndExpectedOutput() {
        RunRequest request = parse("""
                {
                  "code": "print(5)",
                  "language": "python",
                  "customTestcases": [
                    { "customInput": "2\\n3", "expectedOutput": "5" },
                    { "customInput": "9", "expectedOutput": "" }
                  ]
                }
                """);

        assertEquals(2, request.getCustomTestcases().size());
        assertEquals("2\n3", request.getCustomTestcases().get(0).customInput());
        assertEquals("5", request.getCustomTestcases().get(0).expectedOutput());
        assertTrue(request.getCustomTestcases().get(0).hasExpectedOutput());
        assertEquals("9", request.getCustomTestcases().get(1).customInput());
        // A blank expected output means "run only", exactly like none at all.
        assertFalse(request.getCustomTestcases().get(1).hasExpectedOutput());
    }

    @Test
    void aCustomCaseWithoutExpectedOutputIsAcceptedAndStaysUngraded() {
        RunRequest request = parse("""
                {
                  "code": "print(5)",
                  "language": "python",
                  "customTestcases": [{ "customInput": "2\\n3" }]
                }
                """);

        assertEquals(1, request.getCustomTestcases().size());
        assertEquals("2\n3", request.getCustomTestcases().get(0).customInput());
        assertNull(request.getCustomTestcases().get(0).expectedOutput());
        assertFalse(request.getCustomTestcases().get(0).hasExpectedOutput());
    }

    @Test
    void legacyStringEntriesAreStillAccepted() {
        RunRequest request = parse("""
                {
                  "code": "print(5)",
                  "language": "python",
                  "customTestcases": ["2\\n3"]
                }
                """);

        assertEquals(1, request.getCustomTestcases().size());
        assertEquals("2\n3", request.getCustomTestcases().get(0).customInput());
        assertNull(request.getCustomTestcases().get(0).expectedOutput());
    }

    @Test
    void customTestcasesRoundTripThroughTheSubmissionDocument() {
        Submission submission = Submission.builder()
                .id("sub-1")
                .userId("user-1")
                .problemId("problem-1")
                .code("print(5)")
                .language(Language.python)
                .type(SubmissionType.EXAMPLE_EVAL)
                .status(SubmissionStatus.QUEUED)
                .customTestcases(List.of(
                        new CustomTestCaseInput("2\n3", "5"),
                        new CustomTestCaseInput("9", null)))
                .createdAt(Instant.now())
                .build();

        Document document = new Document();
        this.mongoTemplate.getConverter().write(submission, document);
        Submission read = this.mongoTemplate.getConverter().read(
                Submission.class, document);

        List<CustomTestCaseInput> cases =
                read.getCustomTestcases() == null ? List.of() : read.getCustomTestcases();
        assertEquals(2, cases.size());
        assertEquals("2\n3", cases.get(0).input());
        assertEquals("5", cases.get(0).expectedOutput());
        assertTrue(cases.get(0).hasExpectedOutput());
        assertEquals("9", cases.get(1).input());
        assertNull(cases.get(1).expectedOutput());
        assertFalse(cases.get(1).hasExpectedOutput());

        // The stored entries are documents, not the legacy list of raw
        // strings, so an old row can never be mistaken for a graded case.
        List<Document> stored = document.getList("customTestcases", Document.class);
        assertEquals(2, stored.size());
        assertEquals("2\n3", stored.get(0).getString("input"));
        assertEquals("5", stored.get(0).getString("expectedOutput"));
        assertTrue(stored.get(1).containsKey("input"));
    }

    @Test
    void submissionDocumentKeepsItsExistingShape() {
        Submission submission = Submission.builder()
                .id("sub-2")
                .userId("user-1")
                .problemId("problem-1")
                .code("print(1)")
                .language(Language.python)
                .type(SubmissionType.FULL_SUBMISSION)
                .status(SubmissionStatus.COMPLETED)
                .customTestcases(new ArrayList<>())
                .createdAt(Instant.now())
                .build();

        Document document = new Document();
        this.mongoTemplate.getConverter().write(submission, document);

        List<String> requiredKeys = List.of(
                "userId", "problemId", "code", "language", "type", "status", "createdAt");
        assertTrue(document.keySet().containsAll(requiredKeys),
                () -> "Missing keys: " + document.keySet());
        assertEquals("FULL_SUBMISSION", document.getString("type"));
        assertEquals("COMPLETED", document.getString("status"));
    }
}