package com.mycompany.backend.security.jwt;

import com.mycompany.backend.services.EmployeeDetailsImpl;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;
@Component
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${bezkoder.app.jwtSecret}")
    private String jwtSecret;

    @Value("${bezkoder.app.jwtExpirationMs}")
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) {
        EmployeeDetailsImpl userPrincipal = (EmployeeDetailsImpl) authentication.getPrincipal();

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .setSubject(userPrincipal.getEmail())  //  UTILISER EMAIL COMME SUBJECT
                .claim("email", userPrincipal.getEmail())
                .claim("username", userPrincipal.getUsername())
                .claim("roles", roles)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();

        //  Retourner le subject (qui est maintenant l'email)
        return claims.getSubject();
    }

    private Key key() {
        // Si la clé est trop courte, en générer une sécurisée
        if (jwtSecret == null || jwtSecret.length() < 32) {
            logger.warn("JWT secret too short, generating secure key");
            return Keys.secretKeyFor(SignatureAlgorithm.HS256);
        }
        
        try {
            byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
            // Vérifier la longueur (32 bytes = 256 bits)
            if (keyBytes.length < 32) {
                logger.warn("JWT secret too short after decoding ({} bytes), generating secure key", keyBytes.length);
                return Keys.secretKeyFor(SignatureAlgorithm.HS256);
            }
            return Keys.hmacShaKeyFor(keyBytes);
        } catch (Exception e) {
            logger.error("Error decoding JWT secret, generating secure key", e);
            return Keys.secretKeyFor(SignatureAlgorithm.HS256);
        }
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key())
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (SecurityException e) {
            logger.error("Signature JWT invalide: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Token JWT invalide: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Token JWT expiré: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Token JWT non supporté: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("Claims JWT vides: {}", e.getMessage());
        }
        return false;
    }
}