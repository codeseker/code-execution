package com.example.codeexecution.modules.submission.services;

/**
 * Judge output comparison.
 *
 * Trailing whitespace (spaces/tabs) on each line and trailing blank lines
 * are ignored; everything else - including case - must match exactly.
 * CRLF is normalised so Windows-authored expectations compare fairly.
 */
public final class OutputComparator {

    private OutputComparator() {
    }

    public static boolean matches(String expected, String actual) {
        return normalize(expected).equals(normalize(actual));
    }

    static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String unified = value.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = unified.split("\n", -1);

        StringBuilder builder = new StringBuilder();
        for (String line : lines) {
            builder.append(stripTrailing(line)).append('\n');
        }

        // Drop trailing blank lines entirely.
        String normalized = builder.toString();
        int end = normalized.length();
        while (end > 0 && normalized.charAt(end - 1) == '\n') {
            end--;
        }
        return normalized.substring(0, end);
    }

    private static String stripTrailing(String line) {
        int end = line.length();
        while (end > 0) {
            char c = line.charAt(end - 1);
            if (c != ' ' && c != '\t') {
                break;
            }
            end--;
        }
        return line.substring(0, end);
    }
}
