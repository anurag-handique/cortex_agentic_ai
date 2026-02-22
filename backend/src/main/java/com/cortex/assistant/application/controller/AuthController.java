package com.cortex.assistant.application.controller;

import com.cortex.assistant.application.dto.ApiResponse;
import com.cortex.assistant.application.service.AuthService;
import com.cortex.assistant.domain.model.User;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, String>> register(@RequestBody User user) {
        try {
            Map<String, String> data = authService.register(user);
            return new ApiResponse<>(true, "Registration successful", data);
        } catch (Exception e) {
            return new ApiResponse<>(false, e.getMessage(), null);
        }
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String password = request.get("password");
            Map<String, Object> data = authService.login(email, password);
            return new ApiResponse<>(true, "Login successful", data);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Invalid email or password", null);
        }
    }
}
