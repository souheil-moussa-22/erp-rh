package com.mycompany.backend.controllers;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/dashboard")
public class DashboardController {

    @GetMapping
    public String dashboard(Authentication authentication, Model model) {
        // VERSION JAVA 8 CORRECTE
        if (authentication != null && authentication.getPrincipal() instanceof com.mycompany.backend.services.EmployeeDetailsImpl) {
            com.mycompany.backend.services.EmployeeDetailsImpl principal = 
                (com.mycompany.backend.services.EmployeeDetailsImpl) authentication.getPrincipal();
            model.addAttribute("username", principal.getUsername());
            model.addAttribute("userId", principal.getId());
            model.addAttribute("authorities", principal.getAuthorities());
        }
        
        model.addAttribute("content", "employees/list :: content");
        return "layout/dashboard";
    }

    @GetMapping("/employees")
    public String employeesPage() {
        return "fragments/employees :: employees-content";
    }

    @GetMapping("/my-profile")
    public String myProfilePage() {
        return "fragments/my-profile :: profile-content";
    }

    @GetMapping("/jobs")
    public String jobsPage() {
        return "fragments/jobs :: jobs-content";
    }

    @GetMapping("/formations")
    public String formationsPage() {
        return "fragments/formations :: formations-content";
    }
}

