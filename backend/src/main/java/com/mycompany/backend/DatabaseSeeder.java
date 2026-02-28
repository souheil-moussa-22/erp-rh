package com.mycompany.backend;

import com.mycompany.backend.entities.*;
import com.mycompany.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {
    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Seed roles
        if (roleRepository.findByName(ERole.ROLE_EMPLOYEE).isEmpty()) {
            Role employeeRole = new Role(ERole.ROLE_EMPLOYEE);
            roleRepository.save(employeeRole);
            System.out.println("Employee role created");
        }

        if (roleRepository.findByName(ERole.ROLE_HR).isEmpty()) {
            Role hrRole = new Role(ERole.ROLE_HR);
            roleRepository.save(hrRole);
            System.out.println("HR role created");
        }

        if (roleRepository.findByName(ERole.ROLE_HRMANAGER).isEmpty()) {
            Role hrManagerRole = new Role(ERole.ROLE_HRMANAGER);
            roleRepository.save(hrManagerRole);
            System.out.println("HR Manager role created");
        }

        // Créer le HR Manager seulement s'il n'existe pas
        if (employeeRepository.findByEmail("sirinerezgui585@gmail.com").isEmpty()) {
            Employee hrManager = new Employee();
            hrManager.setUsername("HR Manager");
            hrManager.setEmail("sirinerezgui585@gmail.com");
            hrManager.setPassword(passwordEncoder.encode("Admin123!"));
            hrManager.setRoles(Set.of(roleRepository.findByName(ERole.ROLE_HRMANAGER).get()));
            employeeRepository.save(hrManager);
            System.out.println("HR Manager créé avec email: hrmanager@erp.com et mot de passe: Admin123!");
        }

        System.out.println("Database seeding completed!");
    }
}