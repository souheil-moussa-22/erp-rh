package com.mycompany.backend.services.Impl;

import com.mycompany.backend.dto.EmployeeDTO;
import com.mycompany.backend.dto.EmployeeGetDTO;
import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.entities.Payslip;
import com.mycompany.backend.entities.Role;
import com.mycompany.backend.entities.ERole;
import com.mycompany.backend.repositories.EmployeeRepository;
import com.mycompany.backend.repositories.PayslipRepository;
import com.mycompany.backend.repositories.FormationRepository;
import com.mycompany.backend.repositories.RoleRepository;
import com.mycompany.backend.services.*;
import jakarta.servlet.http.HttpServletRequest;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PayslipRepository payslipRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FormationRepository formationRepository;

    @Autowired
    private GridFsService gridFsService;

    @Autowired
    private SalaryCalculationService salaryCalculationService;

    @Autowired
    private PermissionService permissionService;

    // MÉTHODES DE VÉRIFICATION DES PERMISSIONS
    private void checkCreateEmployeePermission() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!permissionService.canCreateEmployees(authentication)) {
            throw new AccessDeniedException("Access denied: Only HR Managers can create employees");
        }
    }

    private void checkDeleteEmployeePermission() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!permissionService.canDeleteEmployees(authentication)) {
            throw new AccessDeniedException("Access denied: Only HR Managers can delete employees");
        }
    }

    private void checkManageEmployeePermission() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!permissionService.canManageEmployees(authentication)) {
            throw new AccessDeniedException("Access denied: HR role required");
        }
    }
    // Vérification des permissions d'import
    private void checkImportEmployeePermission() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!permissionService.canImportEmployees(authentication)) {
            throw new AccessDeniedException("Access denied: Only HR Managers can import employees");
        }
    }

    // Vérification des permissions d'export
    private void checkExportEmployeePermission() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!permissionService.canExportEmployees(authentication)) {
            throw new AccessDeniedException("Access denied: Only HR Managers can export employees");
        }
    }
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            System.out.println(" getCurrentUsername: No authentication or not authenticated");
            return null;
        }
        String username = authentication.getName();
        System.out.println(" getCurrentUsername returning: " + username);
        return username;
    }

    private String getCurrentUserEmail() {
        String currentUsername = getCurrentUsername();
        if (currentUsername == null) {
            return null;
        }

        Optional<Employee> currentEmployee = employeeRepository.findByUsername(currentUsername);
        if (currentEmployee.isPresent()) {
            String email = currentEmployee.get().getEmail();
            System.out.println(" getCurrentUserEmail: " + email);
            return email;
        }

        Optional<Employee> currentEmployeeByEmail = employeeRepository.findByEmail(currentUsername);
        if (currentEmployeeByEmail.isPresent()) {
            String email = currentEmployeeByEmail.get().getEmail();
            System.out.println(" getCurrentUserEmail (fallback): " + email);
            return email;
        }

        System.out.println(" getCurrentUserEmail: Employee not found for username: " + currentUsername);
        return null;
    }

    private boolean isViewingOwnProfile(String employeeId) {
        String currentUserEmail = getCurrentUserEmail();
        if (currentUserEmail == null) {
            System.out.println(" isViewingOwnProfile: Current user email is null");
            return false;
        }

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();
            boolean isOwnProfile = employee.getEmail().equals(currentUserEmail);

            System.out.println(" isViewingOwnProfile DETAILED CHECK:");
            System.out.println("   - Employee ID: " + employeeId);
            System.out.println("   - Employee email: " + employee.getEmail());
            System.out.println("   - Current user email: " + currentUserEmail);
            System.out.println("   - Result: " + isOwnProfile);

            return isOwnProfile;
        }

        System.out.println(" isViewingOwnProfile: Employee not found with ID: " + employeeId);
        return false;
    }

    @Override
    public List<Employee> getAllEmployees() {
        // RH et RH Managers peuvent voir tous les employés
        checkManageEmployeePermission();
        return employeeRepository.findAll();
    }

    @Override
    public ResponseEntity<?> changePassword(String employeeId, String currentPassword, String newPassword) {
        try {
            System.out.println(" EmployeeServiceImpl.changePassword called for ID: " + employeeId);

            // Vérifier que l'utilisateur modifie son propre mot de passe
            if (!isViewingOwnProfile(employeeId)) {
                System.out.println("Access denied: Users can only change their own password");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Access denied: You can only change your own password");
            }

            Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
            if (employeeOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Employee not found");
            }

            Employee employee = employeeOpt.get();

            // Vérifier l'ancien mot de passe
            if (!passwordEncoder.matches(currentPassword, employee.getPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Current password is incorrect");
            }

            // Valider le nouveau mot de passe
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("New password must be at least 6 characters long");
            }

            // Mettre à jour le mot de passe
            employee.setPassword(passwordEncoder.encode(newPassword));
            employeeRepository.save(employee);

            System.out.println(" Password changed successfully for employee: " + employeeId);
            return ResponseEntity.ok("Password changed successfully");

        } catch (Exception e) {
            System.err.println(" Error changing password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error changing password");
        }
    }

    @Override
    public Optional<Employee> getEmployeeById(String id) {
        System.out.println(" EmployeeServiceImpl.getEmployeeById called for ID: " + id);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Vérifier si l'utilisateur peut voir ce profil
        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            String currentUserEmail = getCurrentUserEmail();
            Optional<Employee> employeeOpt = employeeRepository.findById(id);

            if (employeeOpt.isPresent()) {
                Employee employee = employeeOpt.get();
                if (!employee.getEmail().equals(currentUserEmail)) {
                    throw new AccessDeniedException("Access denied: You can only access your own profile");
                }
            }
        }

        Optional<Employee> employee = employeeRepository.findById(id);
        if (employee.isPresent()) {
            System.out.println(" Employee found: " + employee.get().getUsername());
        } else {
            System.out.println(" Employee not found with ID: " + id);
        }
        return employee;
    }

    @Override
    public void deleteEmployee(String id) {
        // SEULEMENT LES RH MANAGERS PEUVENT SUPPRIMER
        checkDeleteEmployeePermission();
        employeeRepository.deleteById(id);
    }

    @Override
    public Optional<Employee> getEmployeeByEmail(String email) {
        return employeeRepository.findByEmail(email);
    }

    @Override
    public Optional<Employee> getEmployeeByUsername(String username) {
        return employeeRepository.findByUsername(username);
    }

    @Override
    public EmployeeGetDTO getSingleRhManager() {
        Employee rhManager = employeeRepository.findAll().stream()
                .filter(emp -> emp.getRoles().stream()
                        .anyMatch(role -> role.getName() == ERole.ROLE_HRMANAGER))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("HR Manager not found"));
        return EmployeeGetDTO.EmployeeToEmployeeDto(rhManager);
    }

    @Override
    public EmployeeGetDTO getSingleRh() {
        Employee rh = employeeRepository.findAll().stream()
                .filter(emp -> emp.getRoles().stream()
                        .anyMatch(role -> role.getName().equals(ERole.ROLE_HR)))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("HR not found"));
        return EmployeeGetDTO.EmployeeToEmployeeDto(rh);
    }

    @Override
    public Employee saveEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    @Override
    public Employee createEmployee(Employee employee) {
        return employeeRepository.save(employee);
    }

    @Override
    public ResponseEntity<?> registerNewEmployee(EmployeeDTO employeeDTO, HttpServletRequest request) {
        // SEULEMENT LES RH MANAGERS PEUVENT CRÉER DES EMPLOYÉS
        checkCreateEmployeePermission();

        System.out.println("=== DÉBUT CRÉATION NOUVEL EMPLOYÉ ===");
        System.out.println("Créé par HR Manager: " + getCurrentUsername());
        System.out.println("Permission vérifiée: CREATE EMPLOYEE");

        // Validation des champs requis
        if (employeeDTO.getEmail() == null || employeeDTO.getEmail().trim().isEmpty()) {
            System.err.println(" Email requis manquant");
            return ResponseEntity.badRequest().body("Email is required!");
        }

        if (employeeDTO.getUsername() == null || employeeDTO.getUsername().trim().isEmpty()) {
            System.err.println(" Username requis manquant");
            return ResponseEntity.badRequest().body("Username is required!");
        }

        if (employeeDTO.getPassword() == null || employeeDTO.getPassword().length() < 6) {
            System.err.println(" Mot de passe trop court");
            return ResponseEntity.badRequest().body("Password must be at least 6 characters long!");
        }

        // Vérification si l'email existe déjà
        if (employeeRepository.existsByEmail(employeeDTO.getEmail())) {
            System.err.println(" Email déjà existant: " + employeeDTO.getEmail());
            return ResponseEntity.badRequest().body("Employee with provided email already exists!");
        }

        // Vérification si le username existe déjà
        if (employeeRepository.existsByUsername(employeeDTO.getUsername())) {
            System.err.println(" Username déjà existant: " + employeeDTO.getUsername());
            return ResponseEntity.badRequest().body("Employee with provided username already exists!");
        }

        System.out.println(" Données reçues:");
        System.out.println("  Email: " + employeeDTO.getEmail());
        System.out.println("  Username: " + employeeDTO.getUsername());
        System.out.println("  RoleNames: " + (employeeDTO.getRoleNames() != null ? employeeDTO.getRoleNames() : "null"));

        // Création de l'employé
        Employee employee = new Employee();
        employee.setUsername(employeeDTO.getUsername());
        employee.setEmail(employeeDTO.getEmail());
        employee.setPhone(employeeDTO.getPhone());
        employee.setPassword(passwordEncoder.encode(employeeDTO.getPassword()));
        employee.setHireDate(employeeDTO.getHireDate());
        employee.setSalary(employeeDTO.getSalary() != null ? employeeDTO.getSalary() : 0.0);
        employee.setStatus(employeeDTO.getStatus() != null ? employeeDTO.getStatus() : "ACTIVE");
        employee.setDepartment(employeeDTO.getDepartment());
        employee.setAge(employeeDTO.getAge());
        employee.setPerformance(employeeDTO.getPerformance());
        employee.setSatisfaction(employeeDTO.getSatisfaction());
        employee.setCin(employeeDTO.getCin());
        employee.setCnssNumber(employeeDTO.getCnssNumber());
        employee.setPosition(employeeDTO.getPosition() != null ? employeeDTO.getPosition() : "Employee");
        employee.setAddress(employeeDTO.getAddress());
        employee.setCity(employeeDTO.getCity());
        employee.setMatricule(employeeDTO.getMatricule());
        employee.setRib(employeeDTO.getRib());
        employee.setBankName(employeeDTO.getBankName());
        employee.setWorkingDays(employeeDTO.getWorkingDays() != null ? employeeDTO.getWorkingDays() : 22);
        employee.setActualWorkingDays(employeeDTO.getActualWorkingDays() != null ? employeeDTO.getActualWorkingDays() : 22);
        employee.setTransportAllowance(employeeDTO.getTransportAllowance() != null ? employeeDTO.getTransportAllowance() : 0.0);
        employee.setFamilyAllowance(employeeDTO.getFamilyAllowance() != null ? employeeDTO.getFamilyAllowance() : 0.0);
        employee.setOtherBonuses(employeeDTO.getOtherBonuses() != null ? employeeDTO.getOtherBonuses() : 0.0);

        // Calcul de l'ancienneté
        try {
            Map<String, Object> seniorityInfo = salaryCalculationService.calculateSeniorityBonus(employee);
            employee.setYearsOfService((Integer) seniorityInfo.get("yearsOfService"));
            employee.setMonthsOfService((Integer) seniorityInfo.get("monthsOfService"));
            employee.setBonusPeriods((Integer) seniorityInfo.get("bonusPeriods"));
            employee.setTraditionalSeniorityBonus((Double) seniorityInfo.get("traditionalSeniorityBonus"));
            employee.setNineDinarsBonus((Double) seniorityInfo.get("nineDinarsBonus"));
            employee.setSeniorityBonus((Double) seniorityInfo.get("seniorityBonus"));
            System.out.println(" Ancienneté calculée: " + employee.getYearsOfService() + " ans, " +
                    employee.getMonthsOfService() + " mois");
        } catch (Exception e) {
            System.err.println(" Erreur calcul ancienneté: " + e.getMessage());
            // Valeurs par défaut
            employee.setYearsOfService(0);
            employee.setMonthsOfService(0);
            employee.setSeniorityBonus(0.0);
        }

        // Attribution des rôles depuis le DTO
        Set<Role> roles = new HashSet<>();

        if (employeeDTO.getRoleNames() != null && !employeeDTO.getRoleNames().isEmpty()) {
            System.out.println(" Attribution des rôles depuis DTO: " + employeeDTO.getRoleNames());

            for (String roleName : employeeDTO.getRoleNames()) {
                try {
                    String cleanedRoleName = roleName.trim().toUpperCase();

                    if (!cleanedRoleName.startsWith("ROLE_")) {
                        cleanedRoleName = "ROLE_" + cleanedRoleName;
                    }

                    System.out.println("   Recherche rôle: " + cleanedRoleName);

                    // Convertir en ERole
                    ERole eRole = ERole.valueOf(cleanedRoleName);

                    // Chercher le rôle dans la base
                    Optional<Role> roleOpt = roleRepository.findByName(eRole);

                    if (roleOpt.isPresent()) {
                        Role role = roleOpt.get();
                        roles.add(role);
                        System.out.println("   Rôle ajouté: " + role.getName());
                    } else {
                        System.err.println("   Rôle non trouvé: " + cleanedRoleName);
                        System.err.println("   Rôles disponibles en base:");
                        roleRepository.findAll().forEach(r -> System.err.println("    - " + r.getName()));
                        return ResponseEntity.badRequest()
                                .body("Role not found: " + cleanedRoleName + ". Available roles: ROLE_EMPLOYEE, ROLE_HR, ROLE_HRMANAGER");
                    }

                } catch (IllegalArgumentException e) {
                    System.err.println("   Nom de rôle invalide: " + roleName);
                    System.err.println("   Rôles valides: ROLE_EMPLOYEE, ROLE_HR, ROLE_HRMANAGER");
                    return ResponseEntity.badRequest()
                            .body("Invalid role name: " + roleName + ". Valid roles are: ROLE_EMPLOYEE, ROLE_HR, ROLE_HRMANAGER");
                } catch (Exception e) {
                    System.err.println("   Erreur traitement rôle " + roleName + ": " + e.getMessage());
                    e.printStackTrace();
                    return ResponseEntity.badRequest()
                            .body("Error processing role: " + roleName);
                }
            }
        } else {
            System.out.println(" Aucun rôle spécifié, attribution ROLE_EMPLOYEE par défaut");
            Role employeeRole = roleRepository.findByName(ERole.ROLE_EMPLOYEE)
                    .orElseThrow(() -> {
                        System.err.println(" ROLE_EMPLOYEE non trouvé en base!");
                        return new RuntimeException("ROLE_EMPLOYEE not found in database");
                    });
            roles.add(employeeRole);
            System.out.println("   Rôle par défaut ajouté: ROLE_EMPLOYEE");
        }

        // Vérification qu'au moins un rôle a été attribué
        if (roles.isEmpty()) {
            System.err.println(" Aucun rôle attribué à l'employé!");
            return ResponseEntity.badRequest().body("At least one role must be assigned to the employee");
        }

        employee.setRoles(roles);

        System.out.println(" Rôles attribués: " +
                roles.stream().map(r -> r.getName().name()).collect(Collectors.joining(", ")));

        try {
            // Sauvegarde de l'employé
            Employee savedEmployee = employeeRepository.save(employee);

            System.out.println(" Employé créé avec succès!");
            System.out.println("  ID: " + savedEmployee.getId());
            System.out.println("  Username: " + savedEmployee.getUsername());
            System.out.println("  Email: " + savedEmployee.getEmail());
            System.out.println("  Rôles: " + savedEmployee.getRoles().stream()
                    .map(r -> r.getName().name())
                    .collect(Collectors.joining(", ")));

            // Envoi des informations de connexion par email
            try {
                emailService.sendEmployeeCredentials(
                        savedEmployee.getEmail(),
                        savedEmployee.getUsername(),
                        employeeDTO.getPassword()
                );
                System.out.println(" Email d'informations envoyé à: " + savedEmployee.getEmail());
            } catch (Exception e) {
                System.err.println(" Échec envoi email: " + e.getMessage());
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Employee registered successfully!");
            response.put("employeeId", savedEmployee.getId());
            response.put("username", savedEmployee.getUsername());
            response.put("email", savedEmployee.getEmail());
            response.put("roles", savedEmployee.getRoles().stream()
                    .map(role -> role.getName().name())
                    .collect(Collectors.toList()));
            response.put("createdAt", new Date());
            response.put("createdBy", getCurrentUsername());

            System.out.println("=== FIN CRÉATION EMPLOYÉ ===");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println(" Erreur sauvegarde employé: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error registering employee: " + e.getMessage());
        }
    }

    private String getCellValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf((int) cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return "";
        }
    }

    @Override
    public void importFromExcel(MultipartFile file) throws IOException {
        // SEULS LES RH MANAGERS PEUVENT IMPORTER
        checkImportEmployeePermission();

        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            Employee emp = new Employee();
            emp.setEmail(getCellValue(row.getCell(1)));
            emp.setUsername(getCellValue(row.getCell(2)));
            employeeRepository.save(emp);
        }
        workbook.close();
    }

    @Override
    public ByteArrayOutputStream exportToExcel() throws IOException {
        // RH ET RH MANAGERS PEUVENT EXPORTER
        checkExportEmployeePermission();

        List<Employee> employees = employeeRepository.findAll();
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Employees");

        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        Row header = sheet.createRow(0);
        String[] headers = {"ID", "Email", "Nom", "Téléphone", "Salaire", "Poste", "CIN", "CNSS", "Date d'embauche"};

        for (int i = 0; i < headers.length; i++) {
            Cell cell = header.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowNum = 1;
        for (Employee emp : employees) {
            Row row = sheet.createRow(rowNum++);
            row.createCell(0).setCellValue(emp.getId() != null ? emp.getId() : "");
            row.createCell(1).setCellValue(emp.getEmail() != null ? emp.getEmail() : "");
            row.createCell(2).setCellValue(emp.getUsername() != null ? emp.getUsername() : "");
            row.createCell(3).setCellValue(emp.getPhone() != null ? emp.getPhone() : "");
            row.createCell(4).setCellValue(emp.getSalary() != null ? emp.getSalary() : 0.0);
            row.createCell(5).setCellValue(emp.getPosition() != null ? emp.getPosition() : "");
            row.createCell(6).setCellValue(emp.getCin() != null ? emp.getCin() : "");
            row.createCell(7).setCellValue(emp.getCnssNumber() != null ? emp.getCnssNumber() : "");
            row.createCell(8).setCellValue(emp.getHireDate() != null ? emp.getHireDate().toString() : "");
        }

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out;
    }

    @Override
    public String storeEmployeePhoto(String id, MultipartFile file) {
        // RH ET RH MANAGERS PEUVENT UPLOADER DES PHOTOS
        checkManageEmployeePermission();

        try {
            Optional<Employee> employeeOpt = employeeRepository.findById(id);
            if (employeeOpt.isEmpty()) {
                throw new RuntimeException("Employee not found with id: " + id);
            }

            String fileId = gridFsService.saveFile(file);

            Employee employee = employeeOpt.get();
            employee.setPhotoId(fileId);
            employeeRepository.save(employee);

            return fileId;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement de la photo", e);
        }
    }

    @Override
    public String storeFormationFile(MultipartFile file) {
        try {
            return gridFsService.saveFile(file);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier formation", e);
        }
    }

    @Override
    public byte[] generatePaySlipPDF(String employeeId) throws IOException {
        try {
            // Vérifier les permissions pour générer des fiches de paie
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (!permissionService.canManageEmployees(authentication)) {
                // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
                if (!isViewingOwnProfile(employeeId)) {
                    throw new AccessDeniedException("Access denied: You can only generate your own payslips");
                }
            }

            Employee emp = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

            Calendar cal = Calendar.getInstance();
            int month = cal.get(Calendar.MONTH) + 1;
            int year = cal.get(Calendar.YEAR);

            return generatePaySlipPDF(employeeId, month, year);

        } catch (Exception e) {
            System.err.println("Erreur génération fiche: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la génération de la fiche de paie: " + e.getMessage());
        }
    }

    @Override
    public byte[] generatePaySlipPDF(String employeeId, Integer month, Integer year) throws IOException {
        // Vérifier les permissions pour générer des fiches de paie
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            if (!isViewingOwnProfile(employeeId)) {
                throw new AccessDeniedException("Access denied: You can only generate your own payslips");
            }
        }

        try {
            Employee emp = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employé non trouvé"));

            if (month == null || year == null) {
                Calendar cal = Calendar.getInstance();
                month = cal.get(Calendar.MONTH) + 1;
                year = cal.get(Calendar.YEAR);
            }

            Map<String, Object> seniorityInfo = salaryCalculationService.calculateSeniorityBonus(emp);

            if (seniorityInfo.get("seniorityBonus") == null) {
                seniorityInfo.put("seniorityBonus", 0.0);
            }

            Map<String, Object> salaryInfo = salaryCalculationService.calculateCompleteSalary(emp, seniorityInfo);

            Double netSalary = salaryInfo.get("netSalary") != null ? (Double) salaryInfo.get("netSalary") : 0.0;
            Double totalBrut = salaryInfo.get("totalBrut") != null ? (Double) salaryInfo.get("totalBrut") : 0.0;

            int yearsOfService = seniorityInfo.get("yearsOfService") != null ? (int) seniorityInfo.get("yearsOfService") : 0;
            int monthsOfService = seniorityInfo.get("monthsOfService") != null ? (int) seniorityInfo.get("monthsOfService") : 0;
            int bonusPeriods = seniorityInfo.get("bonusPeriods") != null ? (int) seniorityInfo.get("bonusPeriods") : 0;
            double traditionalSeniorityBonus = seniorityInfo.get("traditionalSeniorityBonus") != null ? (double) seniorityInfo.get("traditionalSeniorityBonus") : 0.0;
            double nineDinarsBonus = seniorityInfo.get("nineDinarsBonus") != null ? (double) seniorityInfo.get("nineDinarsBonus") : 0.0;
            double totalSeniorityBonus = seniorityInfo.get("seniorityBonus") != null ? (double) seniorityInfo.get("seniorityBonus") : 0.0;

            emp.setYearsOfService(yearsOfService);
            emp.setMonthsOfService(monthsOfService);
            emp.setBonusPeriods(bonusPeriods);
            emp.setTraditionalSeniorityBonus(traditionalSeniorityBonus);
            emp.setNineDinarsBonus(nineDinarsBonus);
            emp.setSeniorityBonus(totalSeniorityBonus);
            employeeRepository.save(emp);

            String[] monthNames = {"Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"};
            String period = monthNames[month - 1] + " " + year;

            Optional<Payslip> existingPayslip = payslipRepository
                    .findByEmployeeIdAndYearAndMonth(employeeId, year, month);

            Payslip payslip;
            if (existingPayslip.isPresent()) {
                payslip = existingPayslip.get();
                payslip.setNetSalary(netSalary);
                payslip.setGrossSalary(totalBrut);
                payslip.setSeniorityBonus(totalSeniorityBonus);
                payslip.setYearsOfService(yearsOfService);
                payslip.setMonthsOfService(monthsOfService);
                payslip.setBonusPeriods(bonusPeriods);
                payslip.setPeriod(period);
                payslip.setGenerationDate(new Date());
            } else {
                payslip = new Payslip();
                payslip.setEmployee(emp);
                payslip.setPeriod(period);
                payslip.setMonth(month);
                payslip.setYear(year);
                payslip.setNetSalary(netSalary);
                payslip.setGrossSalary(totalBrut);
                payslip.setSeniorityBonus(totalSeniorityBonus);
                payslip.setYearsOfService(yearsOfService);
                payslip.setMonthsOfService(monthsOfService);
                payslip.setBonusPeriods(bonusPeriods);
                payslip.setGenerationDate(new Date());
            }

            Payslip savedPayslip = payslipRepository.save(payslip);
            System.out.println("Fiche sauvegardée: " + savedPayslip.getId());

            String pdfContent = "FICHE DE PAIE - " + period + "\n" +
                    "Employé: " + emp.getUsername() + "\n" +
                    "Salaire net: " + netSalary + " TND\n" +
                    "Salaire brut: " + totalBrut + " TND\n" +
                    "Prime ancienneté: " + totalSeniorityBonus + " TND\n" +
                    "Prime 9 dinars: " + nineDinarsBonus + " TND";

            return pdfContent.getBytes();

        } catch (Exception e) {
            System.err.println("Erreur génération fiche: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Erreur lors de la génération de la fiche de paie: " + e.getMessage());
        }
    }

    @Override
    public Optional<Payslip> getLatestPayslip(String employeeId, Integer year, Integer month) {
        try {
            System.out.println("Recherche dernière fiche pour employé: " + employeeId);

            // Vérifier les permissions pour voir les fiches de paie
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (!permissionService.canManageEmployees(authentication)) {
                // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
                if (!isViewingOwnProfile(employeeId)) {
                    throw new AccessDeniedException("Access denied: You can only view your own payslips");
                }
            }

            if (year != null && month != null) {
                System.out.println("Recherche fiche spécifique: " + month + "/" + year);
                Optional<Payslip> payslip = payslipRepository.findByEmployeeIdAndYearAndMonth(employeeId, year, month);

                if (payslip.isPresent()) {
                    System.out.println("Fiche spécifique trouvée: " + payslip.get().getPeriod());
                } else {
                    System.out.println("Aucune fiche trouvée pour " + month + "/" + year);
                }

                return payslip;
            } else {
                System.out.println("Recherche dernière fiche créée");
                List<Payslip> payslips = payslipRepository.findByEmployeeIdOrderByYearDescMonthDesc(employeeId);

                if (payslips.isEmpty()) {
                    System.out.println("Aucune fiche existante pour cet employé");
                    return Optional.empty();
                }

                Payslip latest = payslips.get(0);
                System.out.println("Dernière fiche: " + latest.getPeriod() + " (ID: " + latest.getId() + ")");
                return Optional.of(latest);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de la recherche de fiche: " + e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public List<Integer> getAvailableYears(String employeeId) {
        // Vérifier les permissions pour voir les fiches de paie
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            if (!isViewingOwnProfile(employeeId)) {
                throw new AccessDeniedException("Access denied: You can only view your own payslips");
            }
        }

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
        if (employeeOpt.isEmpty()) return Collections.emptyList();

        Employee employee = employeeOpt.get();

        System.out.println("CALCUL DES ANNÉES DISPONIBLES");
        System.out.println("Employé: " + employee.getUsername());
        System.out.println("Date d'embauche: " + employee.getHireDate());

        List<Integer> yearsFromPayslips = payslipRepository.findByEmployeeIdOrderByYearDescMonthDesc(employeeId)
                .stream()
                .map(Payslip::getYear)
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        System.out.println("Années depuis les fiches existantes: " + yearsFromPayslips);

        List<Integer> yearsFromHireDate = this.generateAllYearsSinceHireDate(employee);
        System.out.println("Toutes les années depuis l'embauche: " + yearsFromHireDate);

        Set<Integer> allYears = new TreeSet<>(Comparator.reverseOrder());
        allYears.addAll(yearsFromHireDate);
        allYears.addAll(yearsFromPayslips);

        List<Integer> finalYears = new ArrayList<>(allYears);
        System.out.println("Années finales disponibles: " + finalYears);
        System.out.println("FIN CALCUL ANNÉES");

        return finalYears;
    }

    private List<Integer> generateAllYearsSinceHireDate(Employee employee) {
        List<Integer> years = new ArrayList<>();

        if (employee.getHireDate() == null) {
            System.out.println("Pas de date d'embauche, utilisation de l'année courante");
            int currentYear = Calendar.getInstance().get(Calendar.YEAR);
            years.add(currentYear);
            return years;
        }

        Calendar hireDate = Calendar.getInstance();
        hireDate.setTime(employee.getHireDate());
        int hireYear = hireDate.get(Calendar.YEAR);

        Calendar currentDate = Calendar.getInstance();
        int currentYear = currentDate.get(Calendar.YEAR);

        System.out.println("Période de travail: " + hireYear + " à " + currentYear);

        for (int year = hireYear; year <= currentYear; year++) {
            years.add(year);
        }

        System.out.println("Années de travail générées: " + years);
        return years;
    }

    @Override
    public boolean isMonthAvailableForEmployee(Employee employee, int year, int month) {
        if (employee.getHireDate() == null) {
            System.out.println("Pas de date d'embauche - mois disponible");
            return true;
        }

        Calendar hireDate = Calendar.getInstance();
        hireDate.setTime(employee.getHireDate());
        int hireYear = hireDate.get(Calendar.YEAR);
        int hireMonth = hireDate.get(Calendar.MONTH) + 1;

        System.out.println("Vérification mois " + month + "/" + year +
                " vs embauche " + hireMonth + "/" + hireYear);

        boolean isAvailable = (year > hireYear) || (year == hireYear && month >= hireMonth);

        System.out.println("Résultat: " + (isAvailable ? "DISPONIBLE" : "NON DISPONIBLE"));

        return isAvailable;
    }

    @Override
    public List<Payslip> getEmployeePayslipsByYear(String employeeId, int year) {
        // Vérifier les permissions pour voir les fiches de paie
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            if (!isViewingOwnProfile(employeeId)) {
                throw new AccessDeniedException("Access denied: You can only view your own payslips");
            }
        }

        try {
            if (!employeeRepository.existsById(employeeId)) {
                System.err.println("Employé non trouvé: " + employeeId);
                return Collections.emptyList();
            }

            System.out.println("Recherche fiches pour employé: " + employeeId + ", année: " + year);

            List<Payslip> payslips = payslipRepository.findByEmployeeIdAndYearOrderByMonthDesc(employeeId, year);

            if (payslips.isEmpty()) {
                System.out.println("Tentative avec méthode alternative...");
                payslips = payslipRepository.findByEmployeeIdAndYearRobust(employeeId, year);
            }

            if (payslips.isEmpty()) {
                System.out.println("Fallback final - Filtrage côté serveur...");
                List<Payslip> allPayslips = payslipRepository.findByEmployeeIdOrderByYearDescMonthDesc(employeeId);
                payslips = allPayslips.stream()
                        .filter(p -> p.getYear() == year)
                        .collect(Collectors.toList());
            }

            System.out.println("Fiches trouvées: " + payslips.size());
            return payslips;

        } catch (Exception e) {
            System.err.println("Erreur récupération fiches: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public List<Payslip> getEmployeePayslips(String employeeId) {
        // Vérifier les permissions pour voir les fiches de paie
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            if (!isViewingOwnProfile(employeeId)) {
                throw new AccessDeniedException("Access denied: You can only view your own payslips");
            }
        }

        try {
            if (!employeeRepository.existsById(employeeId)) {
                System.err.println("Employé non trouvé: " + employeeId);
                return Collections.emptyList();
            }

            List<Payslip> payslips = payslipRepository.findByEmployeeIdOrderByYearDescMonthDesc(employeeId);
            System.out.println("Fiches récupérées pour " + employeeId + ": " + payslips.size());
            return payslips;
        } catch (Exception e) {
            System.err.println("Erreur récupération toutes les fiches: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    @Override
    public boolean isMonthInFuture(int year, int month) {
        Calendar currentDate = Calendar.getInstance();
        int currentYear = currentDate.get(Calendar.YEAR);
        int currentMonth = currentDate.get(Calendar.MONTH) + 1;

        System.out.println("Vérification mois " + month + "/" + year +
                " vs actuel " + currentMonth + "/" + currentYear);

        if (year > currentYear) {
            System.out.println(month + "/" + year + " est dans le futur (année future)");
            return true;
        }

        if (year == currentYear && month > currentMonth) {
            System.out.println(month + "/" + year + " est dans le futur (mois futur)");
            return true;
        }

        System.out.println(month + "/" + year + " peut être généré");
        return false;
    }

    @Override
    public Payslip savePayslip(Payslip payslip) {
        if (payslip.getEmployee() == null) {
            throw new RuntimeException("Payslip must have an employee");
        }
        if (payslip.getMonth() == null || payslip.getYear() == null) {
            throw new RuntimeException("Payslip must have month and year");
        }

        return payslipRepository.save(payslip);
    }

    @Override
    public Optional<Payslip> getPayslipById(String payslipId) {
        return payslipRepository.findById(payslipId);
    }

    @Override
    public Map<String, Object> generatePayslipsForYear(String employeeId, int year) {
        // Vérifier les permissions pour générer des fiches de paie
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            if (!isViewingOwnProfile(employeeId)) {
                throw new AccessDeniedException("Access denied: You can only generate your own payslips");
            }
        }

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
        if (employeeOpt.isEmpty()) {
            throw new RuntimeException("Employee not found with id: " + employeeId);
        }

        Employee employee = employeeOpt.get();
        Map<String, Object> result = new HashMap<>();
        List<Payslip> generatedPayslips = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;
        int skippedCount = 0;
        int futureMonthsCount = 0;

        if (year > Calendar.getInstance().get(Calendar.YEAR)) {
            throw new RuntimeException("Impossible de générer des fiches pour une année future: " + year);
        }

        System.out.println("Génération annuelle pour " + year + " - Employé: " + employee.getUsername());

        for (int month = 1; month <= 12; month++) {
            try {
                if (isMonthInFuture(year, month)) {
                    futureMonthsCount++;
                    System.out.println("Mois futur ignoré: " + month + "/" + year);
                    continue;
                }

                if (isMonthAvailableForEmployee(employee, year, month)) {
                    byte[] pdfData = generatePaySlipPDF(employeeId, month, year);
                    successCount++;

                    Optional<Payslip> payslipOpt = payslipRepository
                            .findByEmployeeIdAndYearAndMonth(employeeId, year, month);
                    payslipOpt.ifPresent(generatedPayslips::add);

                    System.out.println("Fiche générée: " + month + "/" + year);
                } else {
                    skippedCount++;
                    System.out.println("Mois non disponible (avant embauche): " + month + "/" + year);
                }
            } catch (Exception e) {
                errorCount++;
                System.err.println("Erreur génération fiche " + month + "/" + year + ": " + e.getMessage());
            }
        }

        result.put("generatedCount", successCount);
        result.put("errorCount", errorCount);
        result.put("skippedCount", skippedCount);
        result.put("futureMonthsCount", futureMonthsCount);
        result.put("payslips", generatedPayslips);

        String message = "Génération terminée: " + successCount + " succès, " +
                errorCount + " erreurs, " + skippedCount + " mois non disponibles";

        if (futureMonthsCount > 0) {
            message += ", " + futureMonthsCount + " mois futurs ignorés";
        }

        result.put("message", message);

        return result;
    }

    @Override
    public Map<String, Object> generateTestPayslips(String employeeId) {
        // Vérifier les permissions pour générer des fiches de paie
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (!permissionService.canManageEmployees(authentication)) {
            // Si ce n'est pas un RH/Manager, vérifier si c'est son propre profil
            if (!isViewingOwnProfile(employeeId)) {
                throw new AccessDeniedException("Access denied: You can only generate your own payslips");
            }
        }

        Optional<Employee> employeeOpt = employeeRepository.findById(employeeId);
        if (employeeOpt.isEmpty()) {
            throw new RuntimeException("Employee not found with id: " + employeeId);
        }

        Employee employee = employeeOpt.get();
        Map<String, Object> result = new HashMap<>();
        List<Payslip> generatedPayslips = new ArrayList<>();
        int successCount = 0;
        int errorCount = 0;
        int futureMonthsCount = 0;

        int currentYear = Calendar.getInstance().get(Calendar.YEAR);

        int[] testMonths = {10, 11, 12};

        System.out.println("Génération fiches de test pour " + employee.getUsername());

        for (int month : testMonths) {
            try {
                if (isMonthInFuture(currentYear, month)) {
                    futureMonthsCount++;
                    System.out.println("Mois futur ignoré: " + month + "/" + currentYear);
                    continue;
                }

                if (isMonthAvailableForEmployee(employee, currentYear, month)) {
                    byte[] pdfData = generatePaySlipPDF(employeeId, month, currentYear);
                    successCount++;

                    Optional<Payslip> payslipOpt = payslipRepository
                            .findByEmployeeIdAndYearAndMonth(employeeId, currentYear, month);
                    payslipOpt.ifPresent(generatedPayslips::add);

                    System.out.println("Fiche test générée: " + month + "/" + currentYear);
                } else {
                    System.out.println("Mois test non disponible: " + month + "/" + currentYear);
                }
            } catch (Exception e) {
                errorCount++;
                System.err.println("Erreur génération fiche test " + month + "/" + currentYear + ": " + e.getMessage());
            }
        }

        result.put("count", successCount);
        result.put("errorCount", errorCount);
        result.put("futureMonthsCount", futureMonthsCount);
        result.put("payslips", generatedPayslips);

        String message = "Génération test terminée: " + successCount + " fiches créées";
        if (futureMonthsCount > 0) {
            message += ", " + futureMonthsCount + " mois futurs ignorés";
        }
        if (errorCount > 0) {
            message += ", " + errorCount + " erreurs";
        }

        result.put("message", message);

        return result;
    }
}