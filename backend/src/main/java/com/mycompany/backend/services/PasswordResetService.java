package com.mycompany.backend.services;

public interface PasswordResetService {
    String createPasswordResetToken(String email , String applicationUrl) throws Exception;

    boolean validatePasswordResetToken(String token);

    void resetPassword(String token, String newPassword);
}
