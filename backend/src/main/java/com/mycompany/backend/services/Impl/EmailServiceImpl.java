package com.mycompany.backend.services.Impl;

import com.mycompany.backend.services.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendEmployeeCredentials(String toEmail, String username, String password) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Bienvenue dans l'entreprise !");
        message.setText("Bonjour " + username + ",\n\n" +
                "Votre compte employé a été créé avec succès.\n\n" +
                "Voici vos identifiants :\n" +
                "Email : " + toEmail + "\n" +
                "Mot de passe : " + password + "\n\n" +
                " Veuillez changer votre mot de passe après votre première connexion.\n\n" +
                "Cordialement,\nL’équipe RH");

        mailSender.send(message);
    }
}
