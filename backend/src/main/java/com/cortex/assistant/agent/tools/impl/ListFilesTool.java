package com.cortex.assistant.agent.tools.impl;

import com.cortex.assistant.agent.tools.Tool;
import com.cortex.assistant.agent.tools.ToolResponse;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Tool to list files in a specified directory.
 * This is a read-only tool.
 */
@Component
public class ListFilesTool implements Tool {

    @Override
    public String getToolName() {
        return "list_files";
    }

    @Override
    public String getDescription() {
        return "Lists the files and subdirectories in a given directory path.";
    }

    @Override
    public Map<String, String> getExpectedInputSchema() {
        return Map.of("directory_path", "string (The absolute path of the directory to list)");
    }

    @Override
    public ToolResponse execute(Map<String, Object> input) {
        String rawPath = (String) input.get("directory_path");
        String path = com.cortex.assistant.infrastructure.util.PathNormalizer.normalize(rawPath);
        if (path == null || path.isEmpty()) {
            return ToolResponse.failed(getToolName(), "Missing required parameter 'directory_path'");
        }

        try {
            File directory = new File(path);
            if (!directory.exists()) {
                return ToolResponse.failed(getToolName(), "Directory does not exist: " + path);
            }
            if (!directory.isDirectory()) {
                return ToolResponse.failed(getToolName(), "Provided path is not a directory: " + path);
            }

            File[] files = directory.listFiles();
            List<Map<String, Object>> fileList = new ArrayList<>();
            int MAX_FILES = 100; // Safety limit
            boolean truncated = false;

            if (files != null) {
                for (int i = 0; i < files.length; i++) {
                    if (i >= MAX_FILES) {
                        truncated = true;
                        break;
                    }
                    File file = files[i];
                    Map<String, Object> fileInfo = new HashMap<>();
                    fileInfo.put("name", file.getName());
                    fileInfo.put("is_directory", file.isDirectory());
                    fileInfo.put("size_bytes", file.length());
                    fileList.add(fileInfo);
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("path", path);
            result.put("files", fileList);
            result.put("count", fileList.size());
            result.put("total_count", files != null ? files.length : 0);
            result.put("is_truncated", truncated);

            return ToolResponse.success(getToolName(), result);
        } catch (Exception e) {
            return ToolResponse.failed(getToolName(), "Error listing files: " + e.getMessage());
        }
    }
}
