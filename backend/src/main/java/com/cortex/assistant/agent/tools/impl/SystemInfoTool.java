package com.cortex.assistant.agent.tools.impl;

import com.cortex.assistant.agent.tools.Tool;
import com.cortex.assistant.agent.tools.ToolResponse;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Tool to retrieve basic system information (OS, CPU, Memory).
 * This is a read-only tool.
 */
@Component
public class SystemInfoTool implements Tool {

    @Override
    public String getToolName() {
        return "get_system_info";
    }

    @Override
    public String getDescription() {
        return "Retrieves information about the operating system, CPU architecture, and memory usage.";
    }

    @Override
    public Map<String, String> getExpectedInputSchema() {
        return Map.of(); // No input required
    }

    @Override
    public ToolResponse execute(Map<String, Object> input) {
        try {
            Map<String, Object> sysInfo = new HashMap<>();

            // Operating System Info
            sysInfo.put("os_name", System.getProperty("os.name"));
            sysInfo.put("os_version", System.getProperty("os.version"));
            sysInfo.put("os_arch", System.getProperty("os.arch"));

            // CPU/Processor Info
            sysInfo.put("available_processors", Runtime.getRuntime().availableProcessors());

            // Memory Info (in MB)
            long maxMemory = Runtime.getRuntime().maxMemory();
            long totalMemory = Runtime.getRuntime().totalMemory();
            long freeMemory = Runtime.getRuntime().freeMemory();

            sysInfo.put("max_memory_mb", maxMemory / (1024 * 1024));
            sysInfo.put("total_memory_mb", totalMemory / (1024 * 1024));
            sysInfo.put("free_memory_mb", freeMemory / (1024 * 1024));
            sysInfo.put("used_memory_mb", (totalMemory - freeMemory) / (1024 * 1024));

            return ToolResponse.success(getToolName(), sysInfo);
        } catch (Exception e) {
            return ToolResponse.failed(getToolName(), "Failed to retrieve system info: " + e.getMessage());
        }
    }
}
