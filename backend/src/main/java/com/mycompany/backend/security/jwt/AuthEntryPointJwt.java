package com.mycompany.backend.security.jwt;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    // Liste des URLs publiques qui ne doivent pas renvoyer d'erreur 401
    private static final List<String> PUBLIC_URLS = Arrays.asList(
            "/auth/",
            "/api/auth/",
            "/error",
            "/swagger-ui/",
            "/v3/api-docs/",
            "/css/",
            "/js/",
            "/images/",
            "/webjars/",
            "/favicon.ico",  // ← AJOUTEZ CECI
            "/static/"       // ← AJOUTEZ CECI
    );

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        String requestURI = request.getRequestURI();

        // Vérifier si l'URL est publique
        boolean isPublicUrl = PUBLIC_URLS.stream()
                .anyMatch(requestURI::startsWith);

        if (isPublicUrl) {
            // Pour les URLs publiques, ne pas envoyer d'erreur 401
            logger.debug("Public URL accessed without authentication: {}", requestURI);
            // Laisser la requête continuer
            return;
        }

        logger.error("Unauthorized error: {}", authException.getMessage());
        logger.error("Request URI: {}", requestURI);
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Unauthorized");
    }
}