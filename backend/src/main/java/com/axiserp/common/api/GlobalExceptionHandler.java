package com.axiserp.common.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final Map<String, String> FIELD_LABELS = Map.ofEntries(
            Map.entry("username", "아이디"),
            Map.entry("password", "비밀번호"),
            Map.entry("employeeNo", "직원 번호"),
            Map.entry("displayName", "이름"),
            Map.entry("email", "이메일"),
            Map.entry("positionTitle", "직책"),
            Map.entry("status", "상태"),
            Map.entry("departmentId", "부서"),
            Map.entry("employeeId", "직원"),
            Map.entry("roles", "역할"),
            Map.entry("permissions", "권한")
    );

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatus(ResponseStatusException exception) {
        HttpStatusCode status = exception.getStatusCode();
        return ResponseEntity.status(status)
                .body(new ApiErrorResponse(resolveMessage(status, exception.getReason())));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
        FieldError fieldError = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .orElse(null);
        String message = fieldError == null
                ? "입력값을 확인해 주세요."
                : FIELD_LABELS.getOrDefault(fieldError.getField(), fieldError.getField()) + " 값을 확인해 주세요.";

        return ResponseEntity.badRequest().body(new ApiErrorResponse(message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidBody() {
        return ResponseEntity.badRequest().body(new ApiErrorResponse("요청 형식이 올바르지 않습니다."));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch() {
        return ResponseEntity.badRequest().body(new ApiErrorResponse("요청 값이 올바르지 않습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        log.error("Unhandled API error", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiErrorResponse("서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
    }

    private String resolveMessage(HttpStatusCode status, String reason) {
        if (reason != null && !reason.isBlank()) {
            return reason;
        }
        if (status.value() == HttpStatus.UNAUTHORIZED.value()) {
            return "로그인이 필요합니다.";
        }
        if (status.value() == HttpStatus.FORBIDDEN.value()) {
            return "요청한 작업을 수행할 권한이 없습니다.";
        }
        if (status.value() == HttpStatus.NOT_FOUND.value()) {
            return "요청한 대상을 찾을 수 없습니다.";
        }
        if (status.value() == HttpStatus.CONFLICT.value()) {
            return "이미 처리된 요청입니다.";
        }
        return "요청 처리 중 오류가 발생했습니다.";
    }
}
