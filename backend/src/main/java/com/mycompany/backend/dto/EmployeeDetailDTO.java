package com.mycompany.backend.dto;

import lombok.*;

import java.util.Date;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDetailDTO {
    private String id;
    private String username;
    private String email;
    private String phone;
    private Double salary;
    private String status;
    private Date hireDate;
    private String photoUrl;
    private String photoId;

    // Informations fiche de paie
    private String cin;
    private String cnssNumber;
    private String position;
    private String address;
    private String city;
    private String matricule;
    private String rib;
    private String bankName;
    private Integer workingDays;
    private Integer actualWorkingDays;
    private Double transportAllowance;
    private Double familyAllowance;
    private Double otherBonuses;

    // Ancienneté
    private Integer yearsOfService;
    private Integer monthsOfService;
    private Integer bonusPeriods;
    private Double seniorityBonus;
    private Double traditionalSeniorityBonus;
    private Double nineDinarsBonus;
    private Integer seniorityBlocks;

    // Roles (only names, not full objects)
    private List<String> roleNames = new ArrayList<>();

    // Formations
    private List<FormationDTO> formations = new ArrayList<>();
    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getPhotoId() {
        return photoId;
    }

    public void setPhotoId(String photoId) {
        this.photoId = photoId;
    }
}