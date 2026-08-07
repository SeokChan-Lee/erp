package com.axiserp.auth;

import com.axiserp.audit.AuditLogService;
import com.axiserp.auth.api.AuthUserResponse;
import com.axiserp.auth.api.LoginRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
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
    private final AuditLogService auditLogService;
    private final boolean secureCookie;
    private final String sameSite;
    private final Duration sessionDuration;

    public AuthController(
            AuthService authService,
            AuditLogService auditLogService,
            @Value("${axis.auth.cookie-secure:false}") boolean secureCookie,
            @Value("${axis.auth.cookie-same-site:Lax}") String sameSite,
            @Value("${axis.auth.session-duration:PT12H}") Duration sessionDuration
    ) {
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.secureCookie = secureCookie;
        this.sameSite = sameSite;
        this.sessionDuration = sessionDuration;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUserResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request);
        auditLogService.record("AUTH", "AUTH_LOGIN", result.user().username(), "로그인", "로그인했습니다.", result.user().displayName());
        ResponseCookie cookie = ResponseCookie.from(AuthService.COOKIE_NAME, result.sessionId())
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(sessionDuration)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result.user());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue(name = AuthService.COOKIE_NAME, required = false) String sessionId) {
        if (sessionId != null) {
            authService.optionalUser(sessionId).ifPresent((user) ->
                    auditLogService.record("AUTH", "AUTH_LOGOUT", user.username(), "로그아웃", "로그아웃했습니다.", user.displayName())
            );
            authService.logout(sessionId);
        }

        ResponseCookie cookie = ResponseCookie.from(AuthService.COOKIE_NAME, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
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
