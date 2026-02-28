package com.mycompany.backend.controllers;

import org.springframework.web.bind.annotation.GetMapping;

public class HomeController {
    @GetMapping("/authenticate")
    public String getHomePage() {
        return "homePage";
    }

    @GetMapping("/register")
    public String getWelcomePage() {
        return "welcomePage";
    }

    @GetMapping("/admin")
    public String getAdminPage() {
        return "adminPage";
    }

    @GetMapping("/mod")
    public String getModeratorPage() {
        return "modPage";
    }

    @GetMapping("/analyste")
    public String getAnalystePage() {
        return "analystePage";
    }



    @GetMapping("/common")
    public String getCommonPage() {
        return "commonPage";
    }

    @GetMapping("/accessDenied")
    public String getAccessDeniedPage() {
        return "accessDeniedPage";
    }
}
