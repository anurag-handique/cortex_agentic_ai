package com.cortex.assistant.application.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
public class LogStreamService {

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private LogAppender appender;

    @PostConstruct
    public void init() {
        LoggerContext context = (LoggerContext) LoggerFactory.getILoggerFactory();
        appender = new LogAppender();
        appender.setContext(context);
        appender.setName("CORTEX_LOG_STREAM");
        appender.start();

        Logger rootLogger = context.getLogger(Logger.ROOT_LOGGER_NAME);
        rootLogger.addAppender(appender);
    }

    @PreDestroy
    public void cleanup() {
        if (appender != null) {
            appender.stop();
        }
    }

    public SseEmitter createEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE); // Infinite timeout
        this.emitters.add(emitter);

        emitter.onCompletion(() -> this.emitters.remove(emitter));
        emitter.onTimeout(() -> this.emitters.remove(emitter));

        return emitter;
    }

    public void broadcastLog(LogEntry entry) {
        List<SseEmitter> deadEmitters = new CopyOnWriteArrayList<>();
        this.emitters.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().name("log").data(entry));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        });
        this.emitters.removeAll(deadEmitters);
    }

    // Inner Class for Appender
    class LogAppender extends AppenderBase<ILoggingEvent> {
        private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm:ss.SSS")
                .withZone(ZoneId.systemDefault());

        @Override
        protected void append(ILoggingEvent eventObject) {
            // Filter out our own logs to prevent infinite loops if we logged in broadcast
            if (eventObject.getLoggerName()
                    .startsWith("org.springframework.web.servlet.mvc.method.annotation.SseEmitter") ||
                    eventObject.getLoggerName().equals(LogStreamService.class.getName())) {
                return;
            }

            LogEntry entry = new LogEntry(
                    formatter.format(Instant.ofEpochMilli(eventObject.getTimeStamp())),
                    eventObject.getLevel().toString(),
                    eventObject.getLoggerName(),
                    eventObject.getFormattedMessage());

            // Broadcast asynchronously via the service
            broadcastLog(entry);
        }
    }

    public record LogEntry(String timestamp, String level, String logger, String message) {
    }
}
