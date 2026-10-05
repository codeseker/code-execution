package com.example.codeexecution.modules.submission.dtos;

import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ValueDeserializer;

/**
 * Accepts both wire shapes of one custom test case, so a rolling upgrade
 * never breaks a client:
 *
 * <pre>
 *   { "customInput": "2\n3", "expectedOutput": "5" }   // current
 *   "2\n3"                                            // legacy, input only
 * </pre>
 *
 * A missing or blank {@code expectedOutput} simply means "run it and show the
 * actual output", which is exactly how a null field is treated downstream.
 *
 * <p>Spring Boot 4 converts HTTP bodies with Jackson 3 ({@code tools.jackson}),
 * so this extends {@code tools.jackson.databind.ValueDeserializer} rather than
 * the Jackson 2 class used by the Redis queue and WebSocket payloads.
 */
public class CustomTestCaseDeserializer extends ValueDeserializer<CustomTestCaseRequest> {

    @Override
    public CustomTestCaseRequest deserialize(JsonParser parser, DeserializationContext context) {
        JsonNode node = parser.readValueAsTree();

        if (node == null || node.isNull()) {
            return CustomTestCaseRequest.of(null, null);
        }
        // Legacy shape: the whole entry is the stdin string.
        if (node.isString() || node.isNumber() || node.isBoolean()) {
            return CustomTestCaseRequest.of(node.asString(), null);
        }
        if (!node.isObject()) {
            return CustomTestCaseRequest.of(null, null);
        }

        String input = textOrNull(node, "customInput");
        if (input == null) {
            // Tolerate the alternative spelling a client might use.
            input = textOrNull(node, "input");
        }
        return CustomTestCaseRequest.of(input, textOrNull(node, "expectedOutput"));
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asString();
    }
}