package com.mycompany.backend.dto;

import lombok.Data;
import java.util.Date;
import java.util.List;

@Data
public class EmployeeDTO {
    private String username;
    private String email;
    private String phone;
    private String password;
    private Date hireDate;
    private Double salary;
    private String status;
    private String department;
    private Integer age;
    private String performance;
    private Integer satisfaction;
    // Champs fiche de paie
    private String cin;
    private String cnssNumber;
    private String position;
    private String address;
    private String city;
    private String matricule;
    private String rib;
    private String bankName;
    private Integer workingDays = 22;
    private Integer actualWorkingDays = 22;
    private Double transportAllowance = 0.0;
    private Double familyAllowance = 0.0;
    private Double otherBonuses = 0.0;

    // Champs ancienneté
    private Double seniorityBonus = 0.0;
    private Integer yearsOfService = 0;
    private Integer totalMonthsOfService = 0;
    private Integer seniorityBlocks = 0;

    private List<String> roleNames;

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

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Date getHireDate() {
        return hireDate;
    }

    public void setHireDate(Date hireDate) {
        this.hireDate = hireDate;
    }

    public Double getSalary() {
        return salary;
    }

    public void setSalary(Double salary) {
        this.salary = salary;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCin() {
        return cin;
    }

    public void setCin(String cin) {
        this.cin = cin;
    }

    public String getCnssNumber() {
        return cnssNumber;
    }

    public void setCnssNumber(String cnssNumber) {
        this.cnssNumber = cnssNumber;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getMatricule() {
        return matricule;
    }

    public void setMatricule(String matricule) {
        this.matricule = matricule;
    }

    public String getRib() {
        return rib;
    }

    public void setRib(String rib) {
        this.rib = rib;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public Integer getWorkingDays() {
        return workingDays;
    }

    public void setWorkingDays(Integer workingDays) {
        this.workingDays = workingDays;
    }

    public Integer getActualWorkingDays() {
        return actualWorkingDays;
    }

    public void setActualWorkingDays(Integer actualWorkingDays) {
        this.actualWorkingDays = actualWorkingDays;
    }

    public Double getTransportAllowance() {
        return transportAllowance;
    }

    public void setTransportAllowance(Double transportAllowance) {
        this.transportAllowance = transportAllowance;
    }

    public Double getFamilyAllowance() {
        return familyAllowance;
    }

    public void setFamilyAllowance(Double familyAllowance) {
        this.familyAllowance = familyAllowance;
    }

    public Double getOtherBonuses() {
        return otherBonuses;
    }

    public void setOtherBonuses(Double otherBonuses) {
        this.otherBonuses = otherBonuses;
    }

    public Double getSeniorityBonus() {
        return seniorityBonus;
    }

    public void setSeniorityBonus(Double seniorityBonus) {
        this.seniorityBonus = seniorityBonus;
    }

    public Integer getYearsOfService() {
        return yearsOfService;
    }

    public void setYearsOfService(Integer yearsOfService) {
        this.yearsOfService = yearsOfService;
    }

    public Integer getTotalMonthsOfService() {
        return totalMonthsOfService;
    }

    public void setTotalMonthsOfService(Integer totalMonthsOfService) {
        this.totalMonthsOfService = totalMonthsOfService;
    }

    public List<String> getRoleNames() {
        return roleNames;
    }

    public void setRoleNames(List<String> roleNames) {
        this.roleNames = roleNames;
    }

    public Integer getSeniorityBlocks() {
        return seniorityBlocks;
    }

    public void setSeniorityBlocks(Integer seniorityBlocks) {
        this.seniorityBlocks = seniorityBlocks;
    }
}