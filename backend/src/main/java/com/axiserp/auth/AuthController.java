package com.axiserp.auth;

import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.auth.api.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request);
        ResponseCookie cookie = ResponseCookie.from(AuthService.COOKIE_NAME, result.sessionId())
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofHours(12))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.user());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        if (sessionId != null) {
            authService.logout(sessionId);
        }

        ResponseCookie cookie = ResponseCookie.from(AuthService.COOKIE_NAME, "")
                .httpOnly(true)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();

        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .build();
    }

    @GetMapping("/me")
    public AuthUserResponse me(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        return authService.currentUser(sessionId);
    }
}
