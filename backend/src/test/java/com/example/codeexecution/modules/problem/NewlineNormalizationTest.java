package com.example.codeexecution.modules.problem;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

/**
 * Tests for newline normalization logic used by the seeder.
 */
class NewlineNormalizationTest {

    private static final Pattern ESCAPED_NEWLINE = Pattern.compile("\\\\n");
    private static final Pattern ESCAPED_CRLF = Pattern.compile("\\\\r\\\\n");

    static String normalize(String value) {
        if (value == null) return null;
        String normalized = ESCAPED_CRLF.matcher(value).replaceAll("\n");
        normalized = ESCAPED_NEWLINE.matcher(normalized).replaceAll("\n");
        return normalized.replace("\r\n", "\n").replace('\r', '\n');
    }

    @Test
    void convertsCRLFToLF() {
        assertEquals("a\nb", normalize("a\r\nb"));
    }

    @Test
    void convertsCRToLF() {
        assertEquals("a\nb", normalize("a\rb"));
    }

    @Test
    void convertsEscapedNewlines() {
        assertEquals("a\nb", normalize("a\\nb"));
    }

    @Test
    void convertsEscapedCRLF() {
        assertEquals("a\nb", normalize("a\\r\\nb"));
    }

    @Test
    void preservesValidNewlines() {
        assertEquals("a\nb\n", normalize("a\nb\n"));
    }

    @Test
    void handlesNull() {
        assertEquals(null, normalize(null));
    }
}
