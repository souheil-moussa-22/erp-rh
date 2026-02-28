package com.mycompany.backend.services.Impl;

import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.PasswordResetToken;
import com.mycompany.backend.listener.RegistrationCompleteEventListener;
import com.mycompany.backend.repositories.EmployeeRepository;
import com.mycompany.backend.repositories.PasswordResetTokenRepository;
import com.mycompany.backend.services.PasswordResetService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.util.Optional;
import java.util.UUID;

@Service
public class PasswordResetServiceImpl implements PasswordResetService {

        @Autowired
        private EmployeeRepository employeeRepository;

        @Autowired
        private PasswordResetTokenRepository tokenRepository;

        @Autowired
        private RegistrationCompleteEventListener emailListener;

        @Autowired
        private PasswordEncoder passwordEncoder;

        public String createPasswordResetToken(String email, String applicationUrl)
                throws MessagingException, UnsupportedEncodingException {

            // Find employee by email
            Optional<Employee> employeeOptional = employeeRepository.findByEmail(email);

            if (employeeOptional.isEmpty()) {
                throw new RuntimeException("Employee not found with email: " + email);
            }

            Employee employee = employeeOptional.get();

            // Delete any existing token for this employee
            tokenRepository.deleteByEmployeeId(employee.getId());

            // Generate new token
            String token = UUID.randomUUID().toString();

            // Save token to database
            PasswordResetToken resetToken = new PasswordResetToken(token, employee.getId());
            tokenRepository.save(resetToken);

            // Build reset URL
            String resetUrl = applicationUrl + "/reset-password?token=" + token;

            // Send email
            emailListener.sendPasswordResetVerificationEmail(resetUrl, employee);

            return token;
        }

        public boolean validatePasswordResetToken(String token) {
            Optional<PasswordResetToken> resetTokenOpt = tokenRepository.findByToken(token);

            if (resetTokenOpt.isEmpty()) {
                return false;
            }

            PasswordResetToken resetToken = resetTokenOpt.get();

            return !resetToken.isExpired() && !resetToken.isUsed();
        }

        @Transactional
        public void resetPassword(String token, String newPassword) {
            Optional<PasswordResetToken> resetTokenOpt = tokenRepository.findByToken(token);

            if (resetTokenOpt.isEmpty()) {
                throw new RuntimeException("Invalid token");
            }

            PasswordResetToken resetToken = resetTokenOpt.get();

            if (resetToken.isExpired()) {
                throw new RuntimeException("Token has expired");
            }

            if (resetToken.isUsed()) {
                throw new RuntimeException("Token has already been used");
            }

            // Get employee
            Optional<Employee> employeeOpt = employeeRepository.findById(resetToken.getEmployeeId());

            if (employeeOpt.isEmpty()) {
                throw new RuntimeException("Employee not found");
            }

            Employee employee = employeeOpt.get();

            // Update password
            employee.setPassword(passwordEncoder.encode(newPassword));
            employeeRepository.save(employee);

            // Mark token as used
            resetToken.setUsed(true);
            tokenRepository.save(resetToken);
        }
    }
