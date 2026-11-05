package com.app.sgelasmart.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * One place that turns exceptions into proper HTTP responses.
 *
 * Without this, every exception the services throw (IllegalArgumentException,
 * NoSuchElementException, ...) comes back as a 500 "Internal Server Error" with
 * no useful message. Here each one gets the status code it deserves, and every
 * error uses the same ApiError JSON shape.
 *
 * Deliberately NOT a catch-all: exceptions not listed here (wrong HTTP method,
 * unsupported media type, the 502/503 ResponseStatusExceptions for AI failures, ...)
 * keep Spring's own handling.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 400 - a @Valid request body broke one or more constraints (@NotBlank, @Size, ...). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex,
                                                     HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            // putIfAbsent: if one field breaks several rules, report the first message only
            fieldErrors.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "One or more fields are invalid", request, fieldErrors);
    }

    /** 400 - the body is missing, is not valid JSON, or has a wrong-typed value (e.g. an unknown enum or bad date). */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException ex,
                                                         HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST,
                "Request body is missing, is not valid JSON, or contains a value of the wrong type "
                        + "(for example an unknown status value or a badly formatted date)",
                request, Map.of());
    }

    /** 400 - a business rule was broken (the services throw IllegalArgumentException with a clear message). */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(IllegalArgumentException ex, HttpServletRequest request) {
        String message = ex.getMessage() != null ? ex.getMessage() : "Invalid request";
        return build(HttpStatus.BAD_REQUEST, message, request, Map.of());
    }

    /** 401 - wrong email/password, or a token that points at a user that no longer exists. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, Map.of());
    }

    /** 403 - the user is logged in but the goal/task/etc. belongs to someone else. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleForbidden(AccessDeniedException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request, Map.of());
    }

    /** 404 - the goal/task/etc. does not exist. */
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ApiError> handleNotFound(NoSuchElementException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, Map.of());
    }

    /** 409 - that email already has an account. */
    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<ApiError> handleConflict(EmailAlreadyRegisteredException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, Map.of());
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message,
                                           HttpServletRequest request, Map<String, String> fieldErrors) {
        ApiError body = ApiError.of(status.value(), status.getReasonPhrase(), message,
                request.getRequestURI(), fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
