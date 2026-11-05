package com.app.sgelasmart.exception;

import java.time.Instant;
import java.util.Map;

/**
 * The single JSON shape every error response uses, so the Android client only
 * has to know how to read one format:
 *
 * { "timestamp": "...", "status": 400, "error": "Bad Request",
 *   "message": "...", "path": "/api/...", "fieldErrors": { "title": "Title is required" } }
 *
 * fieldErrors is only filled for validation failures (it is an empty object otherwise).
 */
public record ApiError(
        String timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors
) {
    public static ApiError of(int status, String error, String message, String path,
                              Map<String, String> fieldErrors) {
        return new ApiError(Instant.now().toString(), status, error, message, path, fieldErrors);
    }
}
