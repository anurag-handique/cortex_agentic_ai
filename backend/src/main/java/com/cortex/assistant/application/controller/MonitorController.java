package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.service.LogStreamService;
import com.cortex.assistant.application.service.SystemMonitorService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/monitor")
public class MonitorController {

    private final LogStreamService logStreamService;
    private final SystemMonitorService systemMonitorService;

    public MonitorController(LogStreamService logStreamService, SystemMonitorService systemMonitorService) {
        this.logStreamService = logStreamService;
        this.systemMonitorService = systemMonitorService;
    }

    @GetMapping("/logs")
    public SseEmitter streamLogs() {
        return logStreamService.createEmitter();
    }

    @GetMapping("/metrics")
    public SseEmitter streamMetrics() {
        return systemMonitorService.createEmitter();
    }
}
