package com.mycompany.backend;

import com.mycompany.backend.entities.*;
import com.mycompany.backend.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Set;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseSeeder.class);

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
            logger.info("Employee role created");
        }

        if (roleRepository.findByName(ERole.ROLE_HR).isEmpty()) {
            Role hrRole = new Role(ERole.ROLE_HR);
            roleRepository.save(hrRole);
            logger.info("HR role created");
        }

        if (roleRepository.findByName(ERole.ROLE_HRMANAGER).isEmpty()) {
            Role hrManagerRole = new Role(ERole.ROLE_HRMANAGER);
            roleRepository.save(hrManagerRole);
            logger.info("HR Manager role created");
        }

        // Create the HR Manager only if they do not already exist
        if (employeeRepository.findByEmail("sirinerezgui585@gmail.com").isEmpty()) {
            Employee hrManager = new Employee();
            hrManager.setUsername("HR Manager");
            hrManager.setEmail("sirinerezgui585@gmail.com");
            hrManager.setPassword(passwordEncoder.encode("Admin123!"));
            hrManager.setRoles(Set.of(roleRepository.findByName(ERole.ROLE_HRMANAGER).get()));
            employeeRepository.save(hrManager);
            logger.info("Default HR Manager account created");
        }

        logger.info("Database seeding completed");
    }
}
