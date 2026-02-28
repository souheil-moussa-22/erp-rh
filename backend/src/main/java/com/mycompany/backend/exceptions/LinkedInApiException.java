package com.mycompany.backend.exceptions;

public class LinkedInApiException extends RuntimeException {

    public LinkedInApiException(String message) {
        super(message);
    }

    public LinkedInApiException(String message, Throwable cause) {
        super(message, cause);
    }
}