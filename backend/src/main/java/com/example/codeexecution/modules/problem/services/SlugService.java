package com.example.codeexecution.modules.problem.services;

import java.util.Locale;

import org.springframework.stereotype.Service;

/**
 * Generates URL-safe slugs from problem titles: lowercase, alphanumeric
 * runs kept, everything else collapsed into single hyphens.
 */
@Service
public class SlugService {

    public String slugify(String title) {
        if (title == null) {
            return "problem";
        }

        String slug = title
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");

        return slug.isBlank() ? "problem" : slug;
    }
}
