package com.mycompany.backend.controllers;

import com.mycompany.backend.dto.*;
import com.mycompany.backend.entities.*;
import com.mycompany.backend.repositories.EmployeeRepository;
import com.mycompany.backend.repositories.FormationRepository;
import com.mycompany.backend.repositories.PayslipRepository;
import com.mycompany.backend.services.EmployeeService;
import com.mycompany.backend.services.GridFsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@CrossOrigin(origins = {"http://localhost:4200"})
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private FormationRepository formationRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private GridFsService gridFsService;

    // -------------------- EMPLOYÉ --------------------
    @GetMapping
    public ResponseEntity<List<Employee>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDetailDTO> getEmployeeById(@PathVariable String id) {
        System.out.println("=== GET EMPLOYEE BY ID CONTROLLER ===");
        System.out.println(" Employee ID requested: " + id);

        try {
            // Vérifier l'authentification
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null) {
                System.out.println(" Authenticated user: " + auth.getName());
                System.out.println(" Authorities: " + auth.getAuthorities());
                System.out.println(" Is authenticated: " + auth.isAuthenticated());
            } else {
                System.out.println(" No authentication found in controller!");
            }

            Optional<Employee> employeeOpt = employeeService.getEmployeeById(id);
            if (employeeOpt.isPresent()) {
                System.out.println(" Employee found: " + employeeOpt.get().getUsername());
                EmployeeDetailDTO response = convertToDetailDTO(employeeOpt.get());
                return ResponseEntity.ok(response);
            } else {
                System.out.println(" Employee not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (AccessDeniedException e) {
            System.err.println(" ACCESS DENIED in controller: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (Exception e) {
            System.err.println(" Error getting employee in controller: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/Add-employee")
    public ResponseEntity<?> registerNewEmployee(@RequestBody @Valid EmployeeDTO employeeDTO,
                                                 final HttpServletRequest request) {
        return employeeService.registerNewEmployee(employeeDTO, request);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeDetailDTO> updateEmployee(@PathVariable String id,
                                                            @RequestBody Employee employeeDetails) {
        Optional<Employee> optionalEmployee = employeeService.getEmployeeById(id);
        if (optionalEmployee.isEmpty()) return ResponseEntity.notFound().build();

        Employee employee = optionalEmployee.get();
        employee.setUsername(employeeDetails.getUsername());
        employee.setEmail(employeeDetails.getEmail());
        employee.setPhone(employeeDetails.getPhone());
        employee.setSalary(employeeDetails.getSalary());
        employee.setStatus(employeeDetails.getStatus());
        employee.setHireDate(employeeDetails.getHireDate());
        employee.setCin(employeeDetails.getCin());
        employee.setCnssNumber(employeeDetails.getCnssNumber());
        employee.setPosition(employeeDetails.getPosition());
        employee.setAddress(employeeDetails.getAddress());
        employee.setCity(employeeDetails.getCity());
        employee.setMatricule(employeeDetails.getMatricule());
        employee.setRib(employeeDetails.getRib());
        employee.setBankName(employeeDetails.getBankName());
        employee.setWorkingDays(employeeDetails.getWorkingDays());
        employee.setActualWorkingDays(employeeDetails.getActualWorkingDays());
        employee.setTransportAllowance(employeeDetails.getTransportAllowance());
        employee.setFamilyAllowance(employeeDetails.getFamilyAllowance());
        employee.setOtherBonuses(employeeDetails.getOtherBonuses());

        Employee updated = employeeService.saveEmployee(employee);
        EmployeeDetailDTO response = convertToDetailDTO(updated);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteEmployee(@PathVariable String id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.ok("Employé supprimé avec succès");
    }

    @PutMapping("/{id}/change-password")
    public ResponseEntity<?> changePassword(
            @PathVariable String id, // CHANGÉ DE Long À String
            @RequestBody @Valid PasswordChangeRequest request,
            @RequestHeader("Authorization") String token) {

        System.out.println(" Change password request for employee ID: " + id);
        System.out.println(" Request details:");
        System.out.println("   - Current password provided: " + (request.getCurrentPassword() != null ? "YES" : "NO"));
        System.out.println("   - New password length: " + (request.getNewPassword() != null ? request.getNewPassword().length() : 0));
        System.out.println("   - Token present: " + (token != null ? "YES" : "NO"));

        return employeeService.changePassword(id, request.getCurrentPassword(), request.getNewPassword());
    }

    // -------------------- PHOTO --------------------
    @PostMapping("/{id}/upload-photo")
    public ResponseEntity<EmployeeDetailDTO> uploadPhoto(@PathVariable String id,
                                                         @RequestParam("file") MultipartFile file) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found"));
        try {
            if (employee.getPhotoId() != null) {
                gridFsService.deleteFile(employee.getPhotoId());
            }

            String photoId = employeeService.storeEmployeePhoto(id, file);
            employee.setPhotoId(photoId);
            employeeRepository.save(employee);

            EmployeeDetailDTO response = convertToDetailDTO(employee);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Erreur upload photo: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getEmployeePhoto(@PathVariable String id) throws IOException {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        if (emp.getPhotoId() == null) {
            return ResponseEntity.notFound().build();
        }

        GridFsResource file = gridFsService.getFile(emp.getPhotoId());
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.getContentType()))
                .body(file.getInputStream().readAllBytes());
    }

    // -------------------- EXPORT / IMPORT --------------------
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportEmployees() throws IOException {
        ByteArrayOutputStream out = employeeService.exportToExcel();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename("employees.xlsx").build());
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok().headers(headers).body(out.toByteArray());
    }

    @PostMapping("/import")
    public ResponseEntity<String> importEmployees(@RequestParam("file") MultipartFile file) {
        try {
            employeeService.importFromExcel(file);
            return ResponseEntity.ok("Fichier importé avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erreur lors de l'import : " + e.getMessage());
        }
    }

    // -------------------- FORMATION --------------------
    @PostMapping("/{id}/formations")
    public ResponseEntity<FormationDTO> addFormation(
            @PathVariable String id,
            @RequestParam("name") String name,
            @RequestParam("location") String location,
            @RequestParam("startDate") String startDate,
            @RequestParam("endDate") String endDate,
            @RequestParam(value = "certificate", required = false) MultipartFile certificate
    ) {
        Employee emp = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

        Formation f = new Formation();
        f.setTitle(name);
        f.setLocation(location);
        f.setStartDate(LocalDate.parse(startDate));
        f.setEndDate(LocalDate.parse(endDate));
        f.setCreatedBy(emp);
        f.getParticipants().add(emp);

        if (certificate != null && !certificate.isEmpty()) {
            if (f.getCertificateId() != null) {
                gridFsService.deleteFile(f.getCertificateId());
            }

            String fileId = employeeService.storeFormationFile(certificate);
            f.setCertificateId(fileId);
        }

        Formation savedFormation = formationRepository.save(f);

        // Initialiser la collection si elle est null
        if (emp.getFormations() == null) {
            emp.setFormations(new HashSet<>());
        }
        emp.getFormations().add(savedFormation);
        employeeRepository.save(emp);

        FormationDTO response = convertToFormationDTO(savedFormation);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/formations/certificate/{id}")
    public ResponseEntity<byte[]> getFormationCertificate(@PathVariable String id) throws IOException {
        GridFsResource resource = gridFsService.getFile(id);
        byte[] data = resource.getInputStream().readAllBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(resource.getContentType()));
        headers.setContentLength(data.length);
        headers.setContentDisposition(ContentDisposition.inline().filename(resource.getFilename()).build());
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Frame-Options", "SAMEORIGIN");

        return new ResponseEntity<>(data, headers, HttpStatus.OK);
    }

    @DeleteMapping("/{employeeId}/formations/{formationId}")
    public ResponseEntity<String> deleteFormation(
            @PathVariable String employeeId,
            @PathVariable String formationId) {

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
        if (employeeOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Employee not found");
        }
        Employee employee = employeeOpt.get();

        Optional<Formation> formationOpt = formationRepository.findById(formationId);
        if (formationOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Formation not found");
        }
        Formation f = formationOpt.get();

        if (f.getCertificateId() != null) {
            try {
                gridFsService.deleteFile(f.getCertificateId());
            } catch (Exception e) {
                System.err.println("Erreur suppression fichier certificat: " + e.getMessage());
            }
        }

        if (employee.getFormations() != null) {
            employee.getFormations().removeIf(form -> form.getId().equals(formationId));
            employeeRepository.save(employee);
        }

        formationRepository.deleteById(formationId);

        return ResponseEntity.ok("Formation supprimée avec succès");
    }

    // -------------------- HISTORIQUE FICHES DE PAIE --------------------
    @GetMapping("/{id}/payslips/by-year")
    public ResponseEntity<List<Payslip>> getEmployeePayslipsByYear(
            @PathVariable String id,
            @RequestParam int year) {
        try {
            System.out.println("API - Recherche fiches pour employé: " + id + ", année: " + year);
            List<Payslip> payslips = employeeService.getEmployeePayslipsByYear(id, year);
            System.out.println("API - Fiches retournées: " + payslips.size() + " pour " + year);
            return ResponseEntity.ok(payslips);
        } catch (Exception e) {
            System.err.println("API - Erreur recherche fiches: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/{id}/payslips")
    public ResponseEntity<List<Payslip>> getEmployeePayslips(@PathVariable String id) {
        try {
            System.out.println("Récupération de TOUTES les fiches pour: " + id);
            List<Payslip> payslips = employeeService.getEmployeePayslips(id);
            System.out.println(payslips.size() + " fiche(s) trouvée(s)");
            return ResponseEntity.ok(payslips);
        } catch (Exception e) {
            System.err.println("Erreur récupération toutes les fiches: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/{employeeId}/payslips/years")
    public ResponseEntity<List<Integer>> getAvailableYears(@PathVariable String employeeId) {
        try {
            System.out.println("API - Recherche années disponibles pour: " + employeeId);
            List<Integer> years = employeeService.getAvailableYears(employeeId);
            System.out.println("API - Années retournées: " + years);
            return ResponseEntity.ok(years);
        } catch (Exception e) {
            System.err.println("API - Erreur années disponibles: " + e.getMessage());
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @PostMapping("/{employeeId}/payslip/generate")
    public ResponseEntity<?> generatePayslipForMonth(
            @PathVariable String employeeId,
            @RequestParam Integer month,
            @RequestParam Integer year) {

        try {
            System.out.println("API - Génération fiche pour employé: " + employeeId + ", " + month + "/" + year);

            Optional<Employee> employeeOpt = employeeService.getEmployeeById(employeeId);
            if (employeeOpt.isEmpty()) {
                System.err.println("API - Employé non trouvé: " + employeeId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Employé non trouvé");
            }

            Employee employee = employeeOpt.get();

            if (!employeeService.isMonthAvailableForEmployee(employee, year, month)) {
                String errorMsg = "Impossible de générer une fiche pour " + month + "/" + year +
                        " - Employé embauché le " + employee.getHireDate();
                System.err.println(errorMsg);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMsg);
            }

            if (employeeService.isMonthInFuture(year, month)) {
                String errorMsg = "Impossible de générer une fiche pour " + month + "/" + year + " - Mois futur";
                System.err.println(errorMsg);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMsg);
            }

            byte[] pdf = employeeService.generatePaySlipPDF(employeeId, month, year);

            Thread.sleep(300);
            Optional<Payslip> payslipOpt = payslipRepository.findByEmployeeIdAndYearAndMonth(employeeId, year, month);

            if (payslipOpt.isPresent()) {
                Payslip payslip = payslipOpt.get();
                System.out.println("API - Fiche générée avec succès: " + payslip.getPeriod());
                return ResponseEntity.ok(payslip);
            } else {
                System.err.println("API - Fiche non trouvée après génération");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Fiche non trouvée après génération");
            }

        } catch (Exception e) {
            System.err.println("API - Erreur génération fiche: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erreur lors de la génération: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/payslips/generate-test")
    public ResponseEntity<Map<String, Object>> generateTestPayslips(@PathVariable String id) {
        try {
            System.out.println("Génération fiches de test pour: " + id);

            Map<String, Object> result = employeeService.generateTestPayslips(id);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("Erreur génération test: " + e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("count", 0);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }

    @PostMapping("/{id}/payslips/generate-year")
    public ResponseEntity<Map<String, Object>> generatePayslipsForYear(
            @PathVariable String id,
            @RequestParam int year) {
        try {
            System.out.println("Génération fiches pour l'année " + year + " - Employé: " + id);

            Map<String, Object> result = employeeService.generatePayslipsForYear(id, year);
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            System.err.println("Erreur génération année: " + e.getMessage());
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("error", e.getMessage());
            errorResult.put("generatedCount", 0);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResult);
        }
    }

    @GetMapping("/{id}/payslip")
    public ResponseEntity<byte[]> generatePaySlip(
            @PathVariable String id,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year) {

        System.out.println("=== CREATING PAYSLIP RECORD ===");
        System.out.println("Employee ID: " + id);
        System.out.println("Month: " + month);
        System.out.println("Year: " + year);

        try {
            byte[] pdf = employeeService.generatePaySlipPDF(id, month, year);

            System.out.println("Payslip record created successfully");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body("{\"message\": \"Payslip record created successfully\"}".getBytes());

        } catch (Exception e) {
            System.err.println("ERROR creating payslip record: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/payslips/{payslipId}/download")
    public ResponseEntity<byte[]> downloadHistoricalPayslip(@PathVariable String payslipId) {
        try {
            Optional<Payslip> payslipOpt = employeeService.getPayslipById(payslipId);
            if (payslipOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Payslip payslip = payslipOpt.get();

            String message = "PDF généré côté frontend pour la période: " + payslip.getPeriod();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            headers.setContentDisposition(ContentDisposition.attachment()
                    .filename("Fiche_Paie_" + payslip.getPeriod().replace(" ", "_") + ".txt").build());

            return new ResponseEntity<>(message.getBytes(), headers, HttpStatus.OK);

        } catch (Exception e) {
            System.err.println("Erreur téléchargement fiche: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ================= HELPER METHODS =================
    private EmployeeDetailDTO convertToDetailDTO(Employee employee) {
        if (employee == null) {
            return null;
        }

        EmployeeDetailDTO dto = new EmployeeDetailDTO();
        dto.setId(employee.getId());
        dto.setUsername(employee.getUsername());
        dto.setEmail(employee.getEmail());
        dto.setPhone(employee.getPhone());
        dto.setSalary(employee.getSalary());
        dto.setStatus(employee.getStatus());
        dto.setHireDate(employee.getHireDate());
        dto.setPhotoUrl(employee.getPhotoUrl());
        dto.setPhotoId(employee.getPhotoId());

        // Informations fiche de paie
        dto.setCin(employee.getCin());
        dto.setCnssNumber(employee.getCnssNumber());
        dto.setPosition(employee.getPosition());
        dto.setAddress(employee.getAddress());
        dto.setCity(employee.getCity());
        dto.setMatricule(employee.getMatricule());
        dto.setRib(employee.getRib());
        dto.setBankName(employee.getBankName());
        dto.setWorkingDays(employee.getWorkingDays());
        dto.setActualWorkingDays(employee.getActualWorkingDays());
        dto.setTransportAllowance(employee.getTransportAllowance());
        dto.setFamilyAllowance(employee.getFamilyAllowance());
        dto.setOtherBonuses(employee.getOtherBonuses());

        // Ancienneté
        dto.setYearsOfService(employee.getYearsOfService());
        dto.setMonthsOfService(employee.getMonthsOfService());
        dto.setBonusPeriods(employee.getBonusPeriods());
        dto.setSeniorityBonus(employee.getSeniorityBonus());
        dto.setTraditionalSeniorityBonus(employee.getTraditionalSeniorityBonus());
        dto.setNineDinarsBonus(employee.getNineDinarsBonus());
        dto.setSeniorityBlocks(employee.getSeniorityBlocks());

        // Extract role names safely
        List<String> roleNames = new ArrayList<>();
        if (employee.getRoles() != null) {
            for (Role role : employee.getRoles()) {
                if (role != null && role.getRoleName() != null) {
                    roleNames.add(role.getRoleName());
                }
            }
        }
        dto.setRoleNames(roleNames);

        // Convert formations to DTOs
        List<FormationDTO> formationDTOs = new ArrayList<>();
        if (employee.getFormations() != null) {
            for (Formation formation : employee.getFormations()) {
                formationDTOs.add(convertToFormationDTO(formation));
            }
        }
        dto.setFormations(formationDTOs);

        return dto;
    }

    private FormationDTO convertToFormationDTO(Formation formation) {
        if (formation == null) {
            return null;
        }

        FormationDTO dto = new FormationDTO();
        dto.setId(formation.getId());
        dto.setName(formation.getTitle());
        dto.setLocation(formation.getLocation());
        dto.setStartDate(formation.getStartDate());
        dto.setEndDate(formation.getEndDate());
        dto.setCertificateId(formation.getCertificateId());

        return dto;
    }

    @GetMapping("/rh")
    public EmployeeGetDTO getSingleRh() {
        return employeeService.getSingleRh();
    }
}
