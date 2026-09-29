package com.example.codeexecution.modules.submission.entities;

/**
 * Supported judge runtimes. Constants are lowercase so the DB value, the
 * JSON value and the blueprint values ({@code 'cpp', 'java', 'python',
 * 'javascript'}) are all identical for Mongo, Jackson and query params.
 */
public enum Language {
    cpp,
    java,
    python,
    javascript
}
