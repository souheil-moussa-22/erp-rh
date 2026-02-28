package com.mycompany.backend.services;

public interface EmailService {
    void sendEmployeeCredentials(String toEmail, String username, String password);
}
