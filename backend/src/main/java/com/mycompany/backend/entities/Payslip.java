package com.mycompany.backend.entities;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Document(collection = "payslips")
public class Payslip {

    @Id
    private String id;

    @DBRef
    private Employee employee;

    private String fileName;
    private Date generationDate;
    private String period;
    private Integer month;
    private Integer year;
    private Double netSalary;
    private Double grossSalary;
    private byte[] pdfData;

    // Nouveaux champs pour l'ancienneté
    private Double seniorityBonus;
    private Integer yearsOfService;
    private Integer monthsOfService;
    private Integer bonusPeriods;

    // Constructeurs
    public Payslip() {}

    public Payslip(Employee employee, String period, Integer month, Integer year,
                   Double netSalary, Double grossSalary, byte[] pdfData) {
        this.employee = employee;
        this.period = period;
        this.month = month;
        this.year = year;
        this.netSalary = netSalary;
        this.grossSalary = grossSalary;
        this.pdfData = pdfData;
        this.generationDate = new Date();
        this.fileName = "Payslip_" + employee.getUsername() + "_" + period.replace(" ", "_") + ".pdf";
    }

    // Getters et Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public Date getGenerationDate() { return generationDate; }
    public void setGenerationDate(Date generationDate) { this.generationDate = generationDate; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public Integer getMonth() { return month; }
    public void setMonth(Integer month) { this.month = month; }

    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }

    public Double getNetSalary() { return netSalary; }
    public void setNetSalary(Double netSalary) { this.netSalary = netSalary; }

    public Double getGrossSalary() { return grossSalary; }
    public void setGrossSalary(Double grossSalary) { this.grossSalary = grossSalary; }

    public byte[] getPdfData() { return pdfData; }
    public void setPdfData(byte[] pdfData) { this.pdfData = pdfData; }

    public Double getSeniorityBonus() { return seniorityBonus; }
    public void setSeniorityBonus(Double seniorityBonus) { this.seniorityBonus = seniorityBonus; }

    public Integer getYearsOfService() { return yearsOfService; }
    public void setYearsOfService(Integer yearsOfService) { this.yearsOfService = yearsOfService; }

    public Integer getMonthsOfService() { return monthsOfService; }
    public void setMonthsOfService(Integer monthsOfService) { this.monthsOfService = monthsOfService; }

    public Integer getBonusPeriods() { return bonusPeriods; }
    public void setBonusPeriods(Integer bonusPeriods) { this.bonusPeriods = bonusPeriods; }

}