# Cortex AI: Autonomous Agent Roadmap

To transform Cortex from a reactive assistant into a fully autonomous agent, we need to build a "Brain" (Memory) and a "Will" (Planning Loop).

## Phase 1: The Hippocampus (Relational Memory)
*Structured storage for active context, history, and tasks.*

1.  **Database Integration (PostgreSQL)**
    *   **Technology**: PostgreSQL (robust, production-grade).
    *   Add `postgresql` driver and `spring-boot-starter-data-jpa` dependencies.
    *   Configure `application.properties` for Postgres connection.
    *   Create `ChatSession` and `ChatMessage` JPA Entities.
2.  **Context Management Service**
    *   Create `ContextService` to fetch the last N messages from Postgres.
    *   Inject `List<ChatMessage> history` into the system prompt.
    *   **Benefit**: "Context awareness" (User: "Delete that file." -> Agent: "Which one? The `test.txt` you mentioned?").
3.  **Persistent User Preferences**
    *   Create `UserPreference` entity (e.g., preferred_language_mode, brevity_level).

## Phase 2: The Frontal Lobe (Planning & Reasoning)
*Currently, Cortex reacts. It needs to plan.*

1.  **Task Queue System (PostgreSQL)**
    *   Create `AgentTask` entity (Status: PENDING, IN_PROGRESS, COMPLETED, FAILED).
    *   Persist complex multi-step plans in Postgres.
2.  **The "Think" Endpoint**
    *   Split the monolithic "Decide" step.
    *   **Planner**: LLM breaks request into steps -> Saves to DB.
    *   **Executor**: Picks next PENDING task -> Executes Tool -> Updates Task Status.
3.  **Reflexion Loop**
    *   After tool execution, the Agent evaluates the output.
    *   If failure: Add "Debug Task" to queue.
    *   If success: Mark complete.

## Phase 3: The Nervous System (Action & Autonomy)
*Currently, the user drives. The agent needs to drive itself.*

1.  **Autonomous Loop (`AgentLoopService`)**
    *   A `@Scheduled` background thread that runs every 1-2 seconds.
    *   Checks `TaskRepository` (Postgres) for pending work.
    *   If tasks exist, it wakes up the LLM to execute them *without* user HTTP requests.
2.  **Filesystem & Environment State**
    *   `WorkspaceManager`: Track which files are open, tree structure cache.
    *   Give the Agent "Eyes": `ReadFile` is too manual. Agent should auto-read `README.md` on project open.

## Phase 4: Long-Term Knowledge (Vector Memory)
*Semantic search for retrieval of past knowledge.*

1.  **Vector Database Integration**
    *   **Technology**: ChromaDB, Milvus, or **pgvector** (Postgres extension).
    *   **RAG Pipeline**:
        *   Chunk chat history and code documentation.
        *   Generate embeddings (via Ollama `nomic-embed-text` etc).
        *   Store vectors in the Vector DB.
    *   **Retrieval**: When User asks a vague question ("How did we fix that bug last time?"), perform semantic search before prompting LLM.

## Phase 5: The Extended Self (Cross-Domain Execution)
*Beyond the filesystem: Giving Cortex a body to interact with the digital world.*

1.  **The Digital Eye (Multimodal Vision)**
    *   Integrate Vision-Language Models (VLMs) like **LLaVA** or **Moondream** via Ollama.
    *   Allows Cortex to "see" screenshots, UI bugs, and architectural diagrams.
2.  **Web-Native Agency (Browser Integration)**
    *   **Tool**: `web_browser` (using Playwright or Puppeteer).
    *   Cortex can navigate documentation sites, perform live research, and test frontend UIs.
3.  **The Sandbox (Code Interpreter)**
    *   A secure Python/Node.js sandbox for data analysis, complex math, and file transformations.
    *   **Benefit**: "Create a graph of the system metrics from the last hour."
4.  **API Forge (Third-Party Integrations)**
    *   Dynamic tool loading for GitHub/GitLab, Slack, and Jira.
    *   Cortex as a "Unified Workspace Manager."

## Phase 6: The Cortex Hive (Multi-Agent Swarms & Self-Evolution)
*Scaling intelligence and enabling the system to improve itself.*

1.  **Orchestrated Sub-Agents**
    *   Cortex can spawn specialized "Shadow" agents for parallel tasks (e.g., a "Coder" agent and a "Tester" agent working simultaneously).
    *   Peer-review loops where one agent audits the code of another.
2.  **Tool Discovery & Scripting Engine**
    *   Cortex can "teach itself" new capabilities by writing reusable scripts and saving them to a `manifest` of custom tools.
3.  **Recursive Self-Optimization**
    *   The agent analyzes its own `AgentDecision` logs to identify patterns of failure and automatically adjusts its system prompts or retrieval strategy.
4.  **Proactive Monitoring & Zero-Input Mode**
    *   The "Pulse" monitors external triggers (e.g., breaking build, new GitHub PR, high server latency) and initiates autonomous resolution without human input.

---

# Immediate Implementation Steps (Next Session)

1.  **Step 1**: Add `spring-boot-starter-data-jpa` and `postgresql` driver to `pom.xml`.
2.  **Step 2**: Configure PostgreSQL connection in `application.properties`.
3.  **Step 3**: Create `domain/model/ChatMessage.java` and `ChatSession.java` entities.
4.  **Step 4**: Implement `ContextService` to read/write from Postgres.
