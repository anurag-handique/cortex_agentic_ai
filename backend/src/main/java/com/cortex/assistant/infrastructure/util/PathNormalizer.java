package com.cortex.assistant.infrastructure.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility to normalize file paths across different operating systems.
 */
public class PathNormalizer {

    private static final Pattern UNIX_DRIVE_PATTERN = Pattern.compile("^/([a-zA-Z])(/.*)?$");

    /**
     * Normalizes a path, especially handling Unix-style drive letters on Windows.
     * Example: "/c/Users" -> "C:\\Users"
     */
    public static String normalize(String path) {
        if (path == null)
            return null;

        String trimmed = path.trim();

        // Handle Unix-style Windows paths: /c/foo -> C:\foo
        Matcher matcher = UNIX_DRIVE_PATTERN.matcher(trimmed);
        if (matcher.matches()) {
            String drive = matcher.group(1).toUpperCase();
            String rest = matcher.group(2);
            if (rest == null || rest.equals("/")) {
                return drive + ":\\";
            }
            return drive + ":" + rest.replace('/', '\\');
        }

        // Handle simple slash normalization
        if (trimmed.contains("/") && System.getProperty("os.name").toLowerCase().contains("win")) {
            return trimmed.replace('/', '\\');
        }

        return trimmed;
    }
}
