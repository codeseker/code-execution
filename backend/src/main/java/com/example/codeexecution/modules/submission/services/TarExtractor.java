package com.example.codeexecution.modules.submission.services;

import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;

/**
 * Minimal TAR reader used to unpack artifacts copied out of compile
 * containers ({@code docker cp} streams plain tar). Handles regular files
 * and directories, strips docker's leading path segment ({@code tmp/exec},
 * {@code build/Main.class}) and refuses entries that would escape the
 * target directory.
 */
public final class TarExtractor {

    private static final int HEADER_SIZE = 512;

    private TarExtractor() {
    }

    /** Extracts a tar stream into {@code targetDir}; returns entry count. */
    public static int extract(InputStream tarStream, Path targetDir) throws IOException {
        Files.createDirectories(targetDir);
        Path absoluteTarget = targetDir.toAbsolutePath().normalize();

        int extracted = 0;
        try (DataInputStream in = new DataInputStream(new BufferedInputStream(tarStream))) {
            byte[] header = new byte[HEADER_SIZE];
            while (readFully(in, header)) {
                if (header[0] == 0) {
                    break; // end-of-archive marker
                }

                String name = field(header, 0, 100);
                String prefix = field(header, 345, 155);
                if (!prefix.isEmpty()) {
                    name = prefix + "/" + name;
                }
                long size = parseOctal(header, 124, 12);
                char type = (char) header[156];

                if (type == '5' || type == 0 && size == 0) {
                    skip(in, padding(size));
                    if (type == '5') {
                        Files.createDirectories(resolve(absoluteTarget, strip(name)));
                    }
                    continue;
                }

                Path out = resolve(absoluteTarget, strip(name));
                Files.createDirectories(out.getParent());
                try (OutputStream outStream = Files.newOutputStream(out,
                        StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING)) {
                    copy(in, outStream, size);
                }
                // The compiled C++ binary must stay executable.
                out.toFile().setExecutable(true, false);
                extracted++;

                skip(in, padding(size));
            }
        }
        return extracted;
    }

    private static Path resolve(Path targetDir, String name) {
        Path resolved = targetDir.resolve(name).normalize();
        if (!resolved.startsWith(targetDir)) {
            throw new IllegalArgumentException("Tar entry escapes target: " + name);
        }
        return resolved;
    }

    /**
     * Docker tars a copy source with a leading segment ({@code exec} for
     * {@code /tmp/exec}, {@code build/...} for {@code /tmp/build}). Strip
     * it so files land at the artifact root.
     */
    private static String strip(String name) {
        String cleaned = name.startsWith("./") ? name.substring(2) : name;
        int slash = cleaned.indexOf('/');
        if (slash > 0) {
            String first = cleaned.substring(0, slash);
            if (first.equals("tmp") || first.equals("build") || first.equals("exec")) {
                return cleaned.substring(slash + 1);
            }
        }
        return cleaned;
    }

    private static String field(byte[] header, int offset, int length) {
        int end = offset;
        while (end < offset + length && header[end] != 0) {
            end++;
        }
        return new String(header, offset, end - offset, StandardCharsets.US_ASCII).trim();
    }

    private static long parseOctal(byte[] header, int offset, int length) {
        String text = field(header, offset, length);
        if (text.isEmpty()) {
            return 0;
        }
        return Long.parseLong(text, 8);
    }

    private static int padding(long size) {
        return (int) ((HEADER_SIZE - (size % HEADER_SIZE)) % HEADER_SIZE);
    }

    private static boolean readFully(DataInputStream in, byte[] buffer) throws IOException {
        int read = 0;
        while (read < buffer.length) {
            int count = in.read(buffer, read, buffer.length - read);
            if (count < 0) {
                return false;
            }
            read += count;
        }
        return true;
    }

    private static void copy(InputStream in, OutputStream out, long size) throws IOException {
        byte[] buffer = new byte[8192];
        long remaining = size;
        while (remaining > 0) {
            int count = in.read(buffer, 0, (int) Math.min(buffer.length, remaining));
            if (count < 0) {
                throw new IOException("Truncated tar entry");
            }
            out.write(buffer, 0, count);
            remaining -= count;
        }
    }

    private static void skip(DataInputStream in, int count) throws IOException {
        int remaining = count;
        while (remaining > 0) {
            int skipped = in.skipBytes(remaining);
            if (skipped <= 0) {
                if (in.read() < 0) {
                    return;
                }
                skipped = 1;
            }
            remaining -= skipped;
        }
    }
}
