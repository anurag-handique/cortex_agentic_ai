# Optimization Plan for Cortex AI Assistant

Yes, you can significantly improve the speed of Cortex AI. The current bottlenecks are primarily due to the dependence on a large LLM (Mistral) for every single decision.

Here is a step-by-step optimization roadmap.

## 1. Quick Wins (Configuration)
*Immediate improvements without coding.*

### Update Ollama Configuration
Ensure your local model stays loaded in memory so it doesn't reload for every request (saving 2-5 sec per request).
*   **Action**: When starting Ollama, or in your `OllamaRequest` (if supported), set `keep_alive` to `-1` (infinite) or `30m`.
*   **Model Selection**: Switch to a faster "Router" model. `Mistral` (7B) is great but `Phi-3` (3.8B) or `Gemma-2b` are 2-3x faster and often sufficient just for deciding *which tool* to use.

## 2. Code Level Optimizations (The Hybrid Approach)
*Stop asking the LLM for obvious tasks.*

### Implement "Fast-Path" Routing
Currently, if a user says "List files", your code sends a massive prompt to Mistral just to get `{"tool": "list_files"}` back. This is wasteful.

**Solution**: Add a Regex-based `HeuristicRouter` in `AgentServiceImpl`.
- IF input matches `^(list|show|ls|dir)\s+files?`, IMMEDIATELY return `ListFilesTool`.
- IF input matches `^(system|os|machine)\s+info`, IMMEDIATELY return `SystemInfoTool`.
- ONLY if no regex matches, send to LLM.

### Example hybrid logic for `makeDecision`:
```java
// Fast Path
if (request.getInput().matches("(?i).*(list|show).*files.*")) {
    return new AgentDecision("command", "none", "Fast-path detection", "execute", "list_files", "high", "{}", List.of("Regex match"));
}

// Slow Path (LLM)
return llmClient.generate(...);
```

## 3. Prompt Engineering (Token Reduction)
*Smaller prompt = Faster generation.*

Your current prompt is very long (~500 tokens). Reducing input tokens reduces processing time.
1.  **Remove Examples**: You have 6 detailed JSON examples. Reduce this to 1 or 2.
2.  **Compact JSON**: The LLM doesn't need pretty-printed JSON examples. Minify them in the prompt.
3.  **Prompt Caching**: If using a provider that supports it, cache the system prompt.

## 4. Parallel Execution
*Do multiple things at once.*

If the agent decides to run a tool, currently it waits:
`User -> LLM Decide (3s) -> Tool Execute (1s) -> LLM Interpret (3s) = 7s Total`

**Optimization**:
- **Optimistic Execution**: If the intent is `respond` (conversation), start streaming the response *while* checking safety in the background.
- **Fire-and-Forget**: For tools that don't need interpretation (e.g., "Play music"), execute and return immediately without the second "Interpretation" LLM call.

## Implementation Checklist

- [ ] **Step 1**: Create `RegexRouter.java` class with common patterns.
- [ ] **Step 2**: Integrate `RegexRouter` into `AgentServiceImpl.java` before the Ollama call.
- [ ] **Step 3**: Trim the `createSystemPrompt` text in `AgentServiceImpl.java` to remove redundant examples.
- [ ] **Step 4**: (Optional) Download `phi3` via `ollama pull phi3` and update the model name in Java code to test speed difference.

## Benchmarks (Estimated)
| Task | Current (Mistral 7B) | Optimized (Hybrid + Phi3) |
| :--- | :--- | :--- |
| **Simple Command ("List files")** | ~3.5s | **< 0.1s** (Regex) |
| **Complex Reasoning** | ~5.0s | ~2.0s (Phi3) |
| **Chat Response** | ~40 tokens/sec | ~100 tokens/sec |
