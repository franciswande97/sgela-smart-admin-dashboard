package com.app.sgelasmart.exception;

/** Thrown when someone tries to register with an email that already has an account (maps to HTTP 409). */
public class EmailAlreadyRegisteredException extends RuntimeException {
    public EmailAlreadyRegisteredException(String message) {
        super(message);
    }
}
