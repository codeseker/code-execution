package com.example.codeexecution.modules.problem.services;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.codeexecution.common.exceptions.BadRequestException;

/**
 * Stores testcase files on the local filesystem under
 * {@code app.storage.problems-dir}/{problemId}/{uuid}.in|.out and returns
 * the stored paths for the TestCase document.
 *
 * The storage root is fixed, so a crafted problemId can never escape it
 * (every path is normalized and checked against the root).
 */
@Service
public class TestCaseStorageService {

    private static final Logger log = LoggerFactory.getLogger(TestCaseStorageService.class);

    private final Path storageRoot;

    public TestCaseStorageService(
            @Value("${app.storage.problems-dir:./storage/problems}") String storageDir) {
        this.storageRoot = Paths.get(storageDir).toAbsolutePath().normalize();
    }

    /**
     * Persists one input/output pair and returns both stored paths.
     *
     * @throws BadRequestException if either file is missing or empty
     * @throws IllegalStateException on filesystem errors
     */
    public StoredFiles save(String problemId, MultipartFile input, MultipartFile output) {
        if (input == null || input.isEmpty()) {
            throw new BadRequestException("Input testcase file is required");
        }
        if (output == null || output.isEmpty()) {
            throw new BadRequestException("Output testcase file is required");
        }

        try {
            String inputContent = new String(input.getBytes(), StandardCharsets.UTF_8);
            String outputContent = new String(output.getBytes(), StandardCharsets.UTF_8);
            return save(problemId, inputContent, outputContent);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read testcase files", exception);
        }
    }

    /**
     * Persists an input/output pair given as text. Used by the problem seeder,
     * which authors its test cases in code rather than uploading them; the
     * multipart overload above delegates here so both paths share the same
     * directory resolution and file naming.
     */
    public StoredFiles save(String problemId, String inputContent, String outputContent) {
        if (inputContent == null || inputContent.isBlank()) {
            throw new BadRequestException("Input testcase content is required");
        }
        if (outputContent == null || outputContent.isBlank()) {
            throw new BadRequestException("Output testcase content is required");
        }

        String directoryName = sanitize(problemId);
        Path directory = this.storageRoot.resolve(directoryName).normalize();
        if (!directory.startsWith(this.storageRoot)) {
            throw new BadRequestException("Invalid problem id");
        }

        String baseName = UUID.randomUUID().toString();
        Path inputPath = directory.resolve(baseName + ".in");
        Path outputPath = directory.resolve(baseName + ".out");

        try {
            Files.createDirectories(directory);
            Files.writeString(inputPath, inputContent, StandardCharsets.UTF_8);
            Files.writeString(outputPath, outputContent, StandardCharsets.UTF_8);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to store testcase files", exception);
        }

        return new StoredFiles(inputPath.toString(), outputPath.toString());
    }

    /**
     * Best-effort removal of both files; missing files are not an error
     * (they may already have been cleaned up manually).
     */
    public void delete(String inputFilePath, String outputFilePath) {
        deleteQuietly(inputFilePath);
        deleteQuietly(outputFilePath);
    }

    private void deleteQuietly(String path) {
        if (path == null || path.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(path));
        } catch (IOException exception) {
            log.warn("Could not delete testcase file {}: {}", path, exception.getMessage());
        }
    }

    /** Keeps only characters that are safe in a directory name. */
    private static String sanitize(String value) {
        if (value == null || !value.matches("[A-Za-z0-9_-]{1,64}")) {
            throw new BadRequestException("Invalid problem id");
        }
        return value;
    }

    /** Both stored file locations of one testcase. */
    public record StoredFiles(String inputFilePath, String outputFilePath) {
    }
}
