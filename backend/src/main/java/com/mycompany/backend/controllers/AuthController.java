package com.mycompany.backend.controllers;

import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.Role;
import com.mycompany.backend.payload.request.LoginRequest;
import com.mycompany.backend.payload.request.SignupRequest;
import com.mycompany.backend.payload.response.JwtResponse;
import com.mycompany.backend.payload.response.MessageResponse;
import com.mycompany.backend.payload.response.SignupResponse;
import com.mycompany.backend.repositories.EmployeeRepository;
import com.mycompany.backend.repositories.RoleRepository;
import com.mycompany.backend.security.jwt.JwtUtils;
import com.mycompany.backend.services.EmployeeDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    EmployeeRepository employeeRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            EmployeeDetailsImpl employeeDetails = (EmployeeDetailsImpl) authentication.getPrincipal();
            List<String> roles = employeeDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());


            return ResponseEntity.ok(new JwtResponse(jwt,
                    employeeDetails.getId().toString(),
                    employeeDetails.getUsername(),
                    employeeDetails.getEmail(),
                    roles));

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Error: Invalid email or password!"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error: Authentication failed - " + e.getMessage()));
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        try {

            if (employeeRepository.existsByUsername(signUpRequest.getUsername())) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Username is already taken!"));
            }

            if (employeeRepository.existsByEmail(signUpRequest.getEmail())) {
                return ResponseEntity
                        .badRequest()
                        .body(new MessageResponse("Error: Email is already in use!"));
            }

            // Create new user's account
            Employee employee = new Employee();
            employee.setUsername(signUpRequest.getUsername());
            employee.setEmail(signUpRequest.getEmail());
            employee.setPassword(encoder.encode(signUpRequest.getPassword()));

            Set<String> strRoles = signUpRequest.getRoles();
            Set<Role> roles = new HashSet<>();

            if (strRoles == null) {
                Role userRole = roleRepository.findByRoleName("ROLE_EMPLOYEE")
                        .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                roles.add(userRole);
            } else {
                strRoles.forEach(role -> {
                    switch (role) {
                        case "hrManager":
                            Role adminRole = roleRepository.findByRoleName("ROLE_HRMANAGER")
                                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                            roles.add(adminRole);
                            break;
                        case "hr":
                            Role hrRole = roleRepository.findByRoleName("ROLE_HR")
                                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                            roles.add(hrRole);
                            break;
                        default:
                            Role employeeRole = roleRepository.findByRoleName("ROLE_EMPLOYEE")
                                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                            roles.add(employeeRole);
                    }
                });
            }

            employee.setRoles(roles);
            employeeRepository.save(employee);

            Set<String> roleNames = roles.stream()
                    .map(role -> {
                        String roleName = role.getRoleName().toLowerCase();
                        if (roleName.startsWith("role_")) {
                            roleName = roleName.substring(5);
                        }
                        return roleName;
                    })
                    .collect(Collectors.toSet());


            return ResponseEntity.ok(new SignupResponse(employee.getUsername(), employee.getEmail(), roleNames));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error: Registration failed - " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody LoginRequest resetRequest) {
        try {

            Employee employee = employeeRepository.findByEmail(resetRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Error: User not found."));

            employee.setPassword(encoder.encode(resetRequest.getPassword()));
            employeeRepository.save(employee);


            return ResponseEntity.ok(new MessageResponse("Password reset successfully!"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error: Password reset failed - " + e.getMessage()));
        }
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Error: Internal server error - " + e.getMessage()));
    }

}