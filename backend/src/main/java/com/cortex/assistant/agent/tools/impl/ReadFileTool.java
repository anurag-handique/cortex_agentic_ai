package com.cortex.assistant.agent.tools.impl;

import com.cortex.assistant.agent.tools.Tool;
import com.cortex.assistant.agent.tools.ToolResponse;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Tool to read the content of a text file.
 * This is a read-only tool.
 */
@Component
public class ReadFileTool implements Tool {

    private static final long MAX_FILE_SIZE = 1024 * 1024; // 1MB limit for safety

    @Override
    public String getToolName() {
        return "read_file";
    }

    @Override
    public String getDescription() {
        return "Reads the content of a text file. Limited to 1MB files for safety.";
    }

    @Override
    public Map<String, String> getExpectedInputSchema() {
        return Map.of("file_path", "string (The absolute path of the file to read)");
    }

    @Override
    public ToolResponse execute(Map<String, Object> input) {
        String rawPath = (String) input.get("file_path");
        String pathStr = com.cortex.assistant.infrastructure.util.PathNormalizer.normalize(rawPath);
        if (pathStr == null || pathStr.isEmpty()) {
            return ToolResponse.failed(getToolName(), "Missing required parameter 'file_path'");
        }

        try {
            Path path = Paths.get(pathStr);
            File file = path.toFile();

            if (!file.exists()) {
                return ToolResponse.failed(getToolName(), "File does not exist: " + pathStr);
            }
            if (!file.isFile()) {
                return ToolResponse.failed(getToolName(), "Provided path is not a file: " + pathStr);
            }
            if (file.length() > MAX_FILE_SIZE) {
                return ToolResponse.failed(getToolName(), "File is too large to read (Limit: 1MB)");
            }

            String content = Files.readString(path);
            return ToolResponse.success(getToolName(), content);
        } catch (Exception e) {
            return ToolResponse.failed(getToolName(), "Error reading file: " + e.getMessage());
        }
    }
}
