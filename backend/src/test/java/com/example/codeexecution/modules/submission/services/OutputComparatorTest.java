package com.example.codeexecution.modules.submission.services;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

/**
 * The WRONG_ANSWER / ACCEPTED decision rests on this normalisation:
 * trailing whitespace and trailing blank lines are ignored, everything
 * else (including case) must match exactly.
 */
class OutputComparatorTest {

    @Test
    void acceptsExactMatch() {
        assertTrue(OutputComparator.matches("1 2\n3 4", "1 2\n3 4"));
    }

    @Test
    void ignoresTrailingSpacesPerLine() {
        assertTrue(OutputComparator.matches("1 2\n3 4", "1 2  \n3 4\t"));
    }

    @Test
    void ignoresTrailingNewlines() {
        assertTrue(OutputComparator.matches("42", "42\n\n\n"));
    }

    @Test
    void normalisesCrlf() {
        assertTrue(OutputComparator.matches("a\r\nb", "a\nb"));
    }

    @Test
    void rejectsCaseDifference() {
        assertFalse(OutputComparator.matches("Accepted", "accepted"));
    }

    @Test
    void rejectsDifferentContent() {
        assertFalse(OutputComparator.matches("1 2", "1 3"));
    }

    @Test
    void rejectsMissingOutput() {
        assertFalse(OutputComparator.matches("42", ""));
    }

    @Test
    void treatsNullAsEmpty() {
        assertTrue(OutputComparator.matches(null, ""));
    }
}
