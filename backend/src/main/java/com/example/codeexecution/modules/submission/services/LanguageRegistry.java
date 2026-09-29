package com.example.codeexecution.modules.submission.services;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.example.codeexecution.modules.submission.config.ExecutionProperties;
import com.example.codeexecution.modules.submission.entities.Language;

/**
 * Centralized, extensible registry mapping language types to their
 * EXISTING Docker containers ({@code app.execution.containers.*}).
 *
 * The judge does not create containers: it {@code docker exec}s into the
 * containers you already run on this machine, so a language with no
 * configured container name is simply unavailable.
 */
@Component
public class LanguageRegistry {

    private final ExecutionProperties properties;

    public LanguageRegistry(ExecutionProperties properties) {
        this.properties = properties;
    }

    /** Container name for a language ({@code cpp -> "cpp"}), or null when unconfigured. */
    public String containerName(Language language) {
        return this.properties.getContainers().get(language.name());
    }

    /** Source file name staged into the container's sandbox directory. */
    public String sourceFileName(Language language) {
        return switch (language) {
            case cpp -> "main.cpp";
            case java -> "Main.java";
            case python -> "main.py";
            case javascript -> "main.js";
        };
    }

    /**
     * Starter templates exposed in the public problem detail payload so
     * the frontend can pre-fill the editor per language.
     */
    public Map<String, String> starterTemplates() {
        Map<String, String> templates = new LinkedHashMap<>();
        templates.put("cpp", """
                #include <bits/stdc++.h>
                using namespace std;

                int main() {
                    ios::sync_with_stdio(false);
                    cin.tie(nullptr);
                    // TODO: solve
                    return 0;
                }
                """);
        templates.put("java", """
                import java.io.*;
                import java.util.*;

                public class Main {
                    public static void main(String[] args) throws Exception {
                        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
                        // TODO: solve
                    }
                }
                """);
        templates.put("python", """
                import sys

                def main():
                    data = sys.stdin.read().split()
                    # TODO: solve

                if __name__ == "__main__":
                    main()
                """);
        templates.put("javascript", """
                const fs = require('fs');
                const input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);
                // TODO: solve
                """);
        return templates;
    }
}
