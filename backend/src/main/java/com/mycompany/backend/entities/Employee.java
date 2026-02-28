package com.mycompany.backend.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "employees")
public class Employee {

    @Id
    private String id;
    private String username;
    private String email;
    private String phone;
    private String password;
    private Double salary;
    private String status;
    private Date hireDate;
    private String photoUrl;
    private String photoId;

    private String department;
    private Integer age;
    private String performance;
    private Integer satisfaction;
    // Informations pour la fiche de paie tunisienne
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

    // Ancienneté et primes
    private Integer yearsOfService;
    private Integer monthsOfService;
    private Integer bonusPeriods;
    private Double seniorityBonus;
    private Double traditionalSeniorityBonus;
    private Double nineDinarsBonus;
    private Integer seniorityBlocks; // Pour compatibilité
    private String gender;

    @DBRef
    @JsonIgnore
    private Set<Formation> formations = new HashSet<>();

    @DBRef
    @JsonIgnore
    private Set<Role> roles = new HashSet<>();

    // Constructeurs
    public Employee() {}

    public Employee(String username, String email, String password) {
        this.username = username;
        this.email = email;
        this.password = password;
    }

    // Getters et Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Double getSalary() { return salary; }
    public void setSalary(Double salary) { this.salary = salary; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Date getHireDate() { return hireDate; }
    public void setHireDate(Date hireDate) { this.hireDate = hireDate; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getPhotoId() { return photoId; }
    public void setPhotoId(String photoId) { this.photoId = photoId; }

    public String getCin() { return cin; }
    public void setCin(String cin) { this.cin = cin; }

    public String getCnssNumber() { return cnssNumber; }
    public void setCnssNumber(String cnssNumber) { this.cnssNumber = cnssNumber; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getMatricule() { return matricule; }
    public void setMatricule(String matricule) { this.matricule = matricule; }

    public String getRib() { return rib; }
    public void setRib(String rib) { this.rib = rib; }

    public String getBankName() { return bankName; }
    public void setBankName(String bankName) { this.bankName = bankName; }

    public Integer getWorkingDays() { return workingDays; }
    public void setWorkingDays(Integer workingDays) { this.workingDays = workingDays; }

    public Integer getActualWorkingDays() { return actualWorkingDays; }
    public void setActualWorkingDays(Integer actualWorkingDays) { this.actualWorkingDays = actualWorkingDays; }

    public Double getTransportAllowance() { return transportAllowance; }
    public void setTransportAllowance(Double transportAllowance) { this.transportAllowance = transportAllowance; }

    public Double getFamilyAllowance() { return familyAllowance; }
    public void setFamilyAllowance(Double familyAllowance) { this.familyAllowance = familyAllowance; }

    public Double getOtherBonuses() { return otherBonuses; }
    public void setOtherBonuses(Double otherBonuses) { this.otherBonuses = otherBonuses; }

    public Integer getYearsOfService() { return yearsOfService; }
    public void setYearsOfService(Integer yearsOfService) { this.yearsOfService = yearsOfService; }

    public Integer getMonthsOfService() { return monthsOfService; }
    public void setMonthsOfService(Integer monthsOfService) { this.monthsOfService = monthsOfService; }

    public Integer getBonusPeriods() { return bonusPeriods; }
    public void setBonusPeriods(Integer bonusPeriods) { this.bonusPeriods = bonusPeriods; }

    public Double getSeniorityBonus() { return seniorityBonus; }
    public void setSeniorityBonus(Double seniorityBonus) { this.seniorityBonus = seniorityBonus; }

    public Double getTraditionalSeniorityBonus() { return traditionalSeniorityBonus; }
    public void setTraditionalSeniorityBonus(Double traditionalSeniorityBonus) { this.traditionalSeniorityBonus = traditionalSeniorityBonus; }

    public Double getNineDinarsBonus() { return nineDinarsBonus; }
    public void setNineDinarsBonus(Double nineDinarsBonus) { this.nineDinarsBonus = nineDinarsBonus; }

    public Integer getSeniorityBlocks() { return seniorityBlocks; }
    public void setSeniorityBlocks(Integer seniorityBlocks) { this.seniorityBlocks = seniorityBlocks; }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getPerformance() {
        return performance;
    }

    public void setPerformance(String performance) {
        this.performance = performance;
    }

    public Integer getSatisfaction() {
        return satisfaction;
    }

    public void setSatisfaction(Integer satisfaction) {
        this.satisfaction = satisfaction;
    }

    public Set<Formation> getFormations() { return formations; }
    public void setFormations(Set<Formation> formations) { this.formations = formations; }

    public Set<Role> getRoles() { return roles; }
    public void setRoles(Set<Role> roles) { this.roles = roles; }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }
}