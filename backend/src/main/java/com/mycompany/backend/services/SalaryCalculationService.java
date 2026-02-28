package com.mycompany.backend.services;

import com.mycompany.backend.entities.Employee;
import java.util.List;
import java.util.Map;

public interface SalaryCalculationService {

   // Calcule la prime d'ancienneté
    Map<String, Object> calculateSeniorityBonus(Employee employee);
    // Calcule l'IRPP
    Double calculateIRPP(Double taxableIncome);
   // Calcule le salaire complet
    Map<String, Object> calculateCompleteSalary(Employee employee, Map<String, Object> seniorityInfo);
   // Génère une liste d'années depuis la date d'embauche
    List<Integer> generateYearsFromHireDate(Employee employee);
}