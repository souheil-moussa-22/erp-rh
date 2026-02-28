package com.mycompany.backend.controllers;

import com.mycompany.backend.services.SetupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/setup")
public class SetupController {

    @Autowired
    private SetupService setupService;

    @GetMapping("/status")
    public ResponseEntity<?> getSetupStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("isFirstTimeSetup", setupService.isFirstTimeSetup());
        response.put("hasHRManager", setupService.hasHRManager());

        if (setupService.isFirstTimeSetup()) {
            response.put("message", "Première configuration nécessaire");
            response.put("defaultHRManager", Map.of(
                    "email", "sirinerezgui585@gmail.com",
                    "password", "Admin123!"
            ));
        } else {
            response.put("message", "Système déjà configuré");
        }

        return ResponseEntity.ok(response);
    }
}