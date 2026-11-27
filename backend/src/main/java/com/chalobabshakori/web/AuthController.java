package com.chalobabshakori.web;

import com.chalobabshakori.security.CurrentUser;
import com.chalobabshakori.service.AuthService;
import com.chalobabshakori.web.dto.Dtos.AuthResponse;
import com.chalobabshakori.web.dto.Dtos.LoginRequest;
import com.chalobabshakori.web.dto.Dtos.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest req) {
        return auth.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @GetMapping("/me")
    public AuthResponse me() {
        return auth.me(CurrentUser.get().userId());
    }
}
