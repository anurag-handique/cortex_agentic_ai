package com.cortex.assistant.application.service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.ThreadMXBean;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
public class SystemMonitorService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private final OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    private final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();

    public SystemMonitorService() {
        // Schedule metric broadcast every 1 second
        scheduler.scheduleAtFixedRate(this::broadcastMetrics, 0, 1, TimeUnit.SECONDS);
    }

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.emitters.add(emitter);
        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> this.emitters.remove(emitter));
        return emitter;
    }

    private void broadcastMetrics() {
        if (emitters.isEmpty())
            return;

        SystemMetrics metrics = collectMetrics();
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();

        this.emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("metrics").data(metrics));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });

        this.emitters.removeAll(deadEmitters);
    }

    private SystemMetrics collectMetrics() {
        double systemCpuLoad = 0.0;
        double processCpuLoad = 0.0;

        // Try to cast to com.sun.management.OperatingSystemMXBean for CPU load
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
            systemCpuLoad = sunOsBean.getCpuLoad() * 100;
            processCpuLoad = sunOsBean.getProcessCpuLoad() * 100;
        }

        long usedHeap = memoryBean.getHeapMemoryUsage().getUsed();
        long maxHeap = memoryBean.getHeapMemoryUsage().getMax();
        long usedNonHeap = memoryBean.getNonHeapMemoryUsage().getUsed();

        // System Memory (if available via Sun bean)
        long totalPhysicalMemory = 0;
        long freePhysicalMemory = 0;
        if (osBean instanceof com.sun.management.OperatingSystemMXBean sunOsBean) {
            totalPhysicalMemory = sunOsBean.getTotalMemorySize();
            freePhysicalMemory = sunOsBean.getFreeMemorySize();
        }

        return new SystemMetrics(
                systemCpuLoad,
                processCpuLoad,
                usedHeap,
                maxHeap,
                usedNonHeap,
                totalPhysicalMemory,
                totalPhysicalMemory - freePhysicalMemory,
                threadBean.getThreadCount(),
                System.currentTimeMillis());
    }

    public record SystemMetrics(
            double systemCpuUsage,
            double processCpuUsage,
            long heapUsed,
            long heapMax,
            long nonHeapUsed,
            long systemMemoryTotal,
            long systemMemoryUsed,
            int threadCount,
            long timestamp) {
    }
}
