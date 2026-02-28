package com.mycompany.backend.services;

import com.mycompany.backend.dto.EmployeeDTO;
import com.mycompany.backend.dto.EmployeeGetDTO;
import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.Payslip;

import jakarta.servlet.http.HttpServletRequest;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

public interface EmployeeService {

    List<Employee> getAllEmployees();
    Optional<Employee> getEmployeeById(String id);
    Optional<Employee> getEmployeeByUsername(String username);
    Employee saveEmployee(Employee employee);
    Employee createEmployee(Employee employee);
    Optional<Employee> getEmployeeByEmail(String email);
    EmployeeGetDTO getSingleRhManager();
    EmployeeGetDTO getSingleRh();
    void deleteEmployee(String id);
    ResponseEntity<?> registerNewEmployee(EmployeeDTO employeeDTO, final HttpServletRequest request);
    void importFromExcel(MultipartFile file) throws IOException;
    ByteArrayOutputStream exportToExcel() throws IOException;

    // Gestion des fichiers
    String storeEmployeePhoto(String id, MultipartFile file);
    String storeFormationFile(MultipartFile file);

    // Génération de fiches de paie
    byte[] generatePaySlipPDF(String employeeId) throws IOException;
    byte[] generatePaySlipPDF(String employeeId, Integer month, Integer year) throws IOException;

    // Historique des fiches de paie
    List<Payslip> getEmployeePayslips(String employeeId);
    List<Payslip> getEmployeePayslipsByYear(String employeeId, int year);
    List<Integer> getAvailableYears(String employeeId);
    Payslip savePayslip(Payslip payslip);
    Optional<Payslip> getPayslipById(String payslipId);

    //  Méthode pour vérifier la disponibilité selon l'embauche
    boolean isMonthAvailableForEmployee(Employee employee, int year, int month);

    //  Méthode pour vérifier si un mois est dans le futur
    boolean isMonthInFuture(int year, int month);

    //  Génération annuelle avec vérification des mois futurs
    Map<String, Object> generatePayslipsForYear(String employeeId, int year);

    // Génération de fiches de test avec vérification des mois futurs
    Map<String, Object> generateTestPayslips(String employeeId);

    // Méthode pour récupérer la dernière fiche
    Optional<Payslip> getLatestPayslip(String employeeId, Integer year, Integer month);
    ResponseEntity<?> changePassword(String employeeId, String currentPassword, String newPassword);
}