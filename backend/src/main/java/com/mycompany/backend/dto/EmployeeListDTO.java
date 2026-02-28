package com.mycompany.backend.dto;

import java.util.List;

public class EmployeeListDTO {
    private String id;
    private String username;
    private String email;
    private String phone;
    private String position;
    private String status;
    private String matricule;
    private List<String> roleNames;

    public EmployeeListDTO() {}

    public EmployeeListDTO(String id, String username, String email, String phone,
                           String position, String status, String matricule, List<String> roleNames) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.phone = phone;
        this.position = position;
        this.status = status;
        this.matricule = matricule;
        this.roleNames = roleNames;
    }

    // Getters et setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public List<String> getRoleNames() { return roleNames; }
    public void setRoleNames(List<String> roleNames) { this.roleNames = roleNames; }
}