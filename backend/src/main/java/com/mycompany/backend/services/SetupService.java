package com.mycompany.backend.services;

import com.mycompany.backend.repositories.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class SetupService {

    @Autowired
    private EmployeeRepository employeeRepository;

    public boolean isFirstTimeSetup() {
        // Si aucun employé n'existe (sauf le HR Manager créé automatiquement)
        return employeeRepository.count() <= 1; // Seulement le HR Manager existe
    }

    public boolean hasHRManager() {
        return employeeRepository.findByEmail("sirinerezgui585@gmail.com").isPresent();
    }
}