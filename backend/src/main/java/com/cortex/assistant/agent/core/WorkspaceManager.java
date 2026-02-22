package com.cortex.assistant.agent.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * WorkspaceManager
 * 
 * Manages the agent's view of the local filesystem.
 * Provides "Eyes" for the agent to understand the project structure.
 */
@Service
public class WorkspaceManager {

    private static final Logger logger = LoggerFactory.getLogger(WorkspaceManager.class);

    private final Map<String, String> sessionWorkspaces = new ConcurrentHashMap<>();
    private final Set<String> ignoredDirectories = new HashSet<>(Arrays.asList(
            ".git", "node_modules", "target", "build", ".idea", ".vscode", "bin", "obj"));

    /**
     * Set the root directory for a session
     */
    public void setWorkspaceRoot(String sessionId, String path) {
        sessionWorkspaces.put(sessionId, path);
        logger.info("Workspace root set for session {}: {}", sessionId, path);
    }

    /**
     * Get the workspace root for a session
     */
    public String getWorkspaceRoot(String sessionId) {
        return sessionWorkspaces.getOrDefault(sessionId, System.getProperty("user.dir"));
    }

    /**
     * Get a tree-like view of the workspace
     */
    public List<String> getFileTree(String sessionId, int maxDepth) {
        String root = getWorkspaceRoot(sessionId);
        List<String> tree = new ArrayList<>();
        try {
            walk(Paths.get(root), 0, maxDepth, tree);
        } catch (IOException e) {
            logger.error("Error generating file tree for {}", root, e);
        }
        return tree;
    }

    private void walk(Path path, int currentDepth, int maxDepth, List<String> result) throws IOException {
        if (currentDepth > maxDepth)
            return;

        String name = path.getFileName().toString();
        if (ignoredDirectories.contains(name))
            return;

        String indent = "  ".repeat(currentDepth);
        result.add(indent + (Files.isDirectory(path) ? "📁 " : "📄 ") + name);

        if (Files.isDirectory(path)) {
            try (Stream<Path> stream = Files.list(path)) {
                List<Path> children = stream.sorted().collect(Collectors.toList());
                for (Path child : children) {
                    walk(child, currentDepth + 1, maxDepth, result);
                }
            }
        }
    }

    /**
     * Find specific files by pattern
     */
    public List<String> findFiles(String sessionId, String pattern) {
        String root = getWorkspaceRoot(sessionId);
        List<String> matches = new ArrayList<>();
        PathMatcher matcher = FileSystems.getDefault().getPathMatcher("glob:**/" + pattern);

        try (Stream<Path> stream = Files.walk(Paths.get(root))) {
            stream.filter(Files::isRegularFile)
                    .filter(matcher::matches)
                    .forEach(p -> matches.add(p.toString()));
        } catch (IOException e) {
            logger.error("Error searching files in {}", root, e);
        }
        return matches;
    }

    /**
     * Auto-detect project type and key files
     */
    public Map<String, String> getProjectContext(String sessionId) {
        Map<String, String> context = new HashMap<>();
        String root = getWorkspaceRoot(sessionId);

        File readme = new File(root, "README.md");
        if (readme.exists()) {
            context.put("hasReadme", "true");
        }

        File pom = new File(root, "pom.xml");
        if (pom.exists()) {
            context.put("projectType", "Maven");
        }

        File packageJson = new File(root, "package.json");
        if (packageJson.exists()) {
            context.put("projectType", "Node/JS");
        }

        return context;
    }
}
