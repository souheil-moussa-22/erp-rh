package com.mycompany.backend.services.Impl;

import com.mycompany.backend.entities.Employee;
import com.mycompany.backend.services.SalaryCalculationService;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SalaryCalculationServiceImpl implements SalaryCalculationService {

    @Override
    public Map<String, Object> calculateCompleteSalary(Employee employee, Map<String, Object> seniorityInfo) {
        Map<String, Object> result = new HashMap<>();


        if (seniorityInfo == null) {
            seniorityInfo = calculateSeniorityBonus(employee);
        }

        Double baseSalary = employee.getSalary() != null ? employee.getSalary() : 0.0;
        Integer workingDays = employee.getWorkingDays() != null ? employee.getWorkingDays() : 22;
        Integer actualDays = employee.getActualWorkingDays() != null ? employee.getActualWorkingDays() : workingDays;

        Double proportionalSalary = baseSalary * actualDays / workingDays;

        //  Gérer les valeurs nulles pour totalSeniorityBonus
        Double totalSeniorityBonus = 0.0;
        if (seniorityInfo.get("seniorityBonus") != null) {
            totalSeniorityBonus = (Double) seniorityInfo.get("seniorityBonus");
        }

        System.out.println(" Calcul salaire - Prime ancienneté: " + totalSeniorityBonus);

        Double transport = employee.getTransportAllowance() != null ? employee.getTransportAllowance() : 0.0;
        Double family = employee.getFamilyAllowance() != null ? employee.getFamilyAllowance() : 0.0;
        Double bonuses = employee.getOtherBonuses() != null ? employee.getOtherBonuses() : 0.0;

        // TOTAL BRUT INCLUT MAINTENANT LA PRIME D'ANCIENNETÉ TOTALE
        Double totalBenefits = transport + family + bonuses + totalSeniorityBonus;
        Double totalBrut = proportionalSalary + totalBenefits;

        // CALCUL DES COTISATIONS SUR LE NOUVEAU TOTAL BRUT
        Double cnssEmployee = totalBrut * 0.0918;
        Double retirement = totalBrut * 0.035;
        Double healthInsurance = totalBrut * 0.02;
        Double totalCotisations = cnssEmployee + retirement + healthInsurance;

        Double taxableIncome = totalBrut - totalCotisations;
        Double irpp = calculateIRPP(taxableIncome);
        Double netSalary = taxableIncome - irpp;

        result.put("baseSalary", baseSalary);
        result.put("proportionalSalary", proportionalSalary);
        result.put("transport", transport);
        result.put("family", family);
        result.put("bonuses", bonuses);
        result.put("totalBenefits", totalBenefits);
        result.put("totalBrut", totalBrut);
        result.put("cnssEmployee", cnssEmployee);
        result.put("retirement", retirement);
        result.put("healthInsurance", healthInsurance);
        result.put("totalCotisations", totalCotisations);
        result.put("taxableIncome", taxableIncome);
        result.put("irpp", irpp);
        result.put("netSalary", netSalary);
        result.put("seniorityInfo", seniorityInfo);

        System.out.println(" Salaire net calculé: " + netSalary + " TND");

        return result;
    }


    // CALCUL DE LA PRIME D'ANCIENNETÉ (SEULEMENT PRIME 9 DINARS)

    @Override
    public Map<String, Object> calculateSeniorityBonus(Employee employee) {
        return calculateSeniorityBonusForPeriod(employee, new Date());
    }

   // Calcule la prime d'ancienneté pour une période donnée
    public Map<String, Object> calculateSeniorityBonusForPeriod(Employee employee, Date periodDate) {
        Map<String, Object> result = new HashMap<>();

        if (employee.getHireDate() == null) {
            result.put("yearsOfService", 0);
            result.put("monthsOfService", 0);
            result.put("bonusPeriods", 0);
            result.put("traditionalSeniorityBonus", 0.0);
            result.put("nineDinarsBonus", 0.0);
            result.put("seniorityBonus", 0.0); // ← TOTAL = seulement prime 9 dinars
            return result;
        }

        Calendar hireDate = Calendar.getInstance();
        hireDate.setTime(employee.getHireDate());

        // Utiliser la date de période
        Calendar periodEnd = Calendar.getInstance();
        periodEnd.setTime(periodDate);
        periodEnd.set(Calendar.DAY_OF_MONTH, periodEnd.getActualMaximum(Calendar.DAY_OF_MONTH));

        int totalMonthsOfService = calculateExactMonthsOfService(hireDate, periodEnd);

        int bonusPeriods = 0;
        double nineDinarsBonus = 0.0;

        //  CALCUL PRIME 9 DINARS SEULEMENT
        if (totalMonthsOfService > 18) {
            // On retire les 18 premiers mois qui ne donnent pas de prime
            int monthsAfterInitialPeriod = totalMonthsOfService - 18;

            //  Chaque période de 18 mois COMPLÈTE donne 9 dinars
            bonusPeriods = monthsAfterInitialPeriod / 18;
            nineDinarsBonus = bonusPeriods * 9.0;

            System.out.println(" Prime 9 dinars calculée pour " + periodEnd.getTime() + ": " + nineDinarsBonus + " TND");
            System.out.println("Mois de service: " + totalMonthsOfService +
                    ", Mois après période initiale: " + monthsAfterInitialPeriod +
                    ", Périodes: " + bonusPeriods);
        } else {
            System.out.println(" Pas encore éligible à la prime 9 dinars: " +
                    totalMonthsOfService + " mois (besoin de > 18 mois)");
        }


        double traditionalSeniorityBonus = 0.0;

        //  TOTAL = SEULEMENT LA PRIME 9 DINARS
        double totalSeniorityBonus = nineDinarsBonus;

        result.put("yearsOfService", totalMonthsOfService / 12);
        result.put("monthsOfService", totalMonthsOfService);
        result.put("bonusPeriods", bonusPeriods);
        result.put("traditionalSeniorityBonus", traditionalSeniorityBonus);
        result.put("nineDinarsBonus", nineDinarsBonus);
        result.put("seniorityBonus", totalSeniorityBonus); // ← égal à nineDinarsBonus

        System.out.println("=== CALCUL ANCIENNETÉ POUR " + periodEnd.getTime() + " ===");
        System.out.println("- Total mois de service: " + totalMonthsOfService);
        System.out.println("- Prime 9 dinars: " + nineDinarsBonus + " TND");
        System.out.println("- Prime traditionnelle: " + traditionalSeniorityBonus + " TND");
        System.out.println("- Prime totale: " + totalSeniorityBonus + " TND");
        System.out.println("===============================");

        return result;
    }

    // Méthode utilitaire pour calculer les mois exacts de service
    private int calculateExactMonthsOfService(Calendar hireDate, Calendar currentDate) {
        int years = currentDate.get(Calendar.YEAR) - hireDate.get(Calendar.YEAR);
        int months = currentDate.get(Calendar.MONTH) - hireDate.get(Calendar.MONTH);
        int totalMonths = (years * 12) + months;

        // Ajustement basé sur le jour du mois
        if (currentDate.get(Calendar.DAY_OF_MONTH) < hireDate.get(Calendar.DAY_OF_MONTH)) {
            totalMonths--;
        }

        return Math.max(0, totalMonths);
    }

    @Override
    public Double calculateIRPP(Double taxableIncome) {
        if (taxableIncome == null || taxableIncome <= 5000) {
            return 0.0;
        } else if (taxableIncome <= 20000) {
            return (taxableIncome - 5000) * 0.26;
        } else if (taxableIncome <= 30000) {
            return (15000 * 0.26) + (taxableIncome - 20000) * 0.28;
        } else if (taxableIncome <= 50000) {
            return (15000 * 0.26) + (10000 * 0.28) + (taxableIncome - 30000) * 0.32;
        } else {
            return (15000 * 0.26) + (10000 * 0.28) + (20000 * 0.32) + (taxableIncome - 50000) * 0.35;
        }
    }

    @Override
    public List<Integer> generateYearsFromHireDate(Employee employee) {
        int currentYear = Calendar.getInstance().get(Calendar.YEAR);
        List<Integer> years = new ArrayList<>();

        if (employee.getHireDate() != null) {
            Calendar hireDate = Calendar.getInstance();
            hireDate.setTime(employee.getHireDate());
            int hireYear = hireDate.get(Calendar.YEAR);

            // Inclure TOUTES les années depuis l'embauche jusqu'à aujourd'hui
            for (int year = hireYear; year <= currentYear; year++) {
                years.add(year);
            }

            // Vérifier si on doit inclure l'année prochaine (pour planification)
            if (currentYear == hireYear) {
                years.add(currentYear + 1);
            }
        } else {
            // Si pas de date d'embauche, retourner les 5 dernières années + année courante
            for (int year = currentYear; year >= currentYear - 5; year--) {
                years.add(year);
            }
        }

        // Trier par ordre décroissant
        Collections.sort(years, Collections.reverseOrder());
        return years;
    }
}