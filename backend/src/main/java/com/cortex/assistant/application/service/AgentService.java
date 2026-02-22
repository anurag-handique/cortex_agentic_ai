package com.cortex.assistant.application.service;

import com.cortex.assistant.domain.model.AgentDecision;
import com.cortex.assistant.domain.model.UserRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public interface AgentService {
    AgentDecision makeDecision(UserRequest request);

    void streamDecision(UserRequest request, HttpServletResponse response) throws IOException;

    AgentDecision interpretResult(String sessionId, String originalRequest,
            com.cortex.assistant.agent.tools.ToolResponse toolResponse);

}