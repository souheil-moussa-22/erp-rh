import { Injectable } from '@angular/core';
import { Employee } from './employee.service';

export interface SeniorityInfo {
  monthsOfService: number;
  bonusPeriods: number;
  nineDinarsBonus: number;
  traditionalSeniorityBonus: number;
  totalSeniorityBonus: number;
  yearsOfService: number;
}

export interface SalaryCalculation {
  baseSalary: number;
  transport: number;
  family: number;
  bonuses: number;
  totalBenefits: number;
  totalBrut: number;
  cnssEmployee: number;
  retirement: number;
  healthInsurance: number;
  totalCotisations: number;
  taxableIncome: number;
  irpp: number;
  netAPayer: number;
}

@Injectable({
  providedIn: 'root'
})
export class CalculationsService {
  // Méthode principale pour calculer l'ancienneté selon la date cible
  calculateSeniorityBonusForPeriod(employee: Employee, targetDate: Date): SeniorityInfo {
    if (!employee.hireDate) {
      return {
        monthsOfService: 0,
        bonusPeriods: 0,
        nineDinarsBonus: 0,
        traditionalSeniorityBonus: 0,
        totalSeniorityBonus: 0,
        yearsOfService: 0
      };
    }

    const hireDate = new Date(employee.hireDate);

    // Utiliser la date cible (fin du mois de la fiche de paie)
    const periodEndDate = new Date(targetDate);
    periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    periodEndDate.setDate(0);

    // Calcul précis des mois jusqu'à la date de la fiche
    const totalMonths = this.calculateExactMonthsOfService(hireDate, periodEndDate);

    let bonusPeriods = 0;
    let nineDinarsBonus = 0;

    //  CORRECTION : Calcul selon votre tableau
    if (totalMonths > 18) {
      // CORRECTION : On compte à partir du 19ème mois, pas par tranches de 18
      bonusPeriods = Math.floor((totalMonths - 1) / 18);  // -1 pour inclure le 19ème mois
      nineDinarsBonus = bonusPeriods * 9;

      console.log(` Prime 9 dinars CORRIGÉE: ${nineDinarsBonus} TND pour ${totalMonths} mois`);
      console.log(` Périodes: ${bonusPeriods} (calcul: floor((${totalMonths} - 1) / 18) = ${Math.floor((totalMonths - 1) / 18)})`);
    }

    // Test de vérification
    this.debugNineDinarsCalculation(totalMonths, bonusPeriods, nineDinarsBonus);

    // Prime traditionnelle toujours à 0
    const traditionalSeniorityBonus = 0;

    // Total = seulement la prime 9 dinars
    const totalSeniorityBonus = nineDinarsBonus;

    return {
      monthsOfService: totalMonths,
      bonusPeriods,
      nineDinarsBonus,
      traditionalSeniorityBonus,
      totalSeniorityBonus,
      yearsOfService: Math.floor(totalMonths / 12)
    };
  }

 // Méthode de débogage pour vérifier le calcul de la prime 9 dinars
  private debugNineDinarsCalculation(totalMonths: number, bonusPeriods: number, nineDinarsBonus: number): void {
    console.log('===  DEBUG CALCUL PRIME 9 DINARS ===');
    console.log(`Mois total: ${totalMonths}`);
    console.log(`Périodes: ${bonusPeriods}`);
    console.log(`Prime: ${nineDinarsBonus} TND`);

    // Vérification des tranches
    if (totalMonths >= 19 && totalMonths <= 35) {
      console.log(' Tranche 19-35 mois: Prime devrait être 9 TND');
    } else if (totalMonths >= 36 && totalMonths <= 53) {
      console.log(' Tranche 36-53 mois: Prime devrait être 18 TND');
    } else if (totalMonths >= 54 && totalMonths <= 71) {
      console.log(' Tranche 54-71 mois: Prime devrait être 27 TND');
    } else if (totalMonths >= 72) {
      console.log(' Tranche 72+ mois: Prime devrait être 36+ TND');
    }
    console.log('=== FIN DEBUG ===');
  }

  // Méthode alternative pour calculer l'ancienneté
  calculateSeniorityBonusForPeriodAlternative(employee: Employee, targetDate: Date): SeniorityInfo {
    if (!employee.hireDate) {
      return {
        monthsOfService: 0,
        bonusPeriods: 0,
        nineDinarsBonus: 0,
        traditionalSeniorityBonus: 0,
        totalSeniorityBonus: 0,
        yearsOfService: 0
      };
    }

    const hireDate = new Date(employee.hireDate);
    const periodEndDate = new Date(targetDate);
    periodEndDate.setMonth(periodEndDate.getMonth() + 1);
    periodEndDate.setDate(0);

    const totalMonths = this.calculateExactMonthsOfService(hireDate, periodEndDate);

    let bonusPeriods = 0;
    let nineDinarsBonus = 0;

    //  CALCUL SIMPLIFIÉ SELON VOTRE TABLEAU
    if (totalMonths >= 19 && totalMonths <= 35) {
      bonusPeriods = 1;
      nineDinarsBonus = 9;
    } else if (totalMonths >= 36 && totalMonths <= 53) {
      bonusPeriods = 2;
      nineDinarsBonus = 18;
    } else if (totalMonths >= 54 && totalMonths <= 71) {
      bonusPeriods = 3;
      nineDinarsBonus = 27;
    } else if (totalMonths >= 72 && totalMonths <= 89) {
      bonusPeriods = 4;
      nineDinarsBonus = 36;
    } else if (totalMonths >= 90) {
      bonusPeriods = 5;
      nineDinarsBonus = 45;
    }


    console.log(` PRIME CALCULÉE: ${nineDinarsBonus} TND pour ${totalMonths} mois`);

    return {
      monthsOfService: totalMonths,
      bonusPeriods,
      nineDinarsBonus,
      traditionalSeniorityBonus: 0,
      totalSeniorityBonus: nineDinarsBonus,
      yearsOfService: Math.floor(totalMonths / 12)
    };
  }

  // Méthode principale pour calculer l'ancienneté
  calculateSeniorityBonus(employee: Employee): SeniorityInfo {
    // Utilisez une des deux méthodes ci-dessus
    return this.calculateSeniorityBonusForPeriod(employee, new Date());
    // OU
    // return this.calculateSeniorityBonusForPeriodAlternative(employee, new Date());
  }

 // Calcule le nombre exact de mois entre deux dates
  private calculateExactMonthsOfService(hireDate: Date, currentDate: Date): number {
    const years = currentDate.getFullYear() - hireDate.getFullYear();
    const months = currentDate.getMonth() - hireDate.getMonth();
    let totalMonths = years * 12 + months;

    // Correction basée sur le jour du mois
    if (currentDate.getDate() < hireDate.getDate()) {
      totalMonths--;
    }

    return Math.max(0, totalMonths);
  }

  // Calcule le salaire détaillé
  calculateSalary(employee: Employee, seniorityInfo: SeniorityInfo): SalaryCalculation {
    const baseSalary = employee.salary || 2600;
    const transport = employee.transportAllowance || 0;
    const family = employee.familyAllowance || 0;
    const bonuses = employee.otherBonuses || 0;

    const totalBenefits = transport + family + bonuses + seniorityInfo.totalSeniorityBonus;
    const totalBrut = baseSalary + totalBenefits;

    const cnssEmployee = totalBrut * 0.0918;
    const retirement = totalBrut * 0.035;
    const healthInsurance = totalBrut * 0.02;
    const totalCotisations = cnssEmployee + retirement + healthInsurance;

    const taxableIncome = totalBrut - totalCotisations;
    const irpp = this.calculateIRPP(taxableIncome);
    const netAPayer = taxableIncome - irpp;

    return {
      baseSalary,
      transport,
      family,
      bonuses,
      totalBenefits,
      totalBrut,
      cnssEmployee,
      retirement,
      healthInsurance,
      totalCotisations,
      taxableIncome,
      irpp,
      netAPayer
    };
  }

  // Calcule l'IRPP selon les tranches
  private calculateIRPP(taxableIncome: number): number {
    let irpp = 0;

    if (taxableIncome <= 5000) {
      irpp = 0;
    } else if (taxableIncome <= 20000) {
      irpp = (taxableIncome - 5000) * 0.26;
    } else if (taxableIncome <= 30000) {
      irpp = (15000 * 0.26) + (taxableIncome - 20000) * 0.28;
    } else if (taxableIncome <= 50000) {
      irpp = (15000 * 0.26) + (10000 * 0.28) + (taxableIncome - 30000) * 0.32;
    } else {
      irpp = (15000 * 0.26) + (10000 * 0.28) + (20000 * 0.32) + (taxableIncome - 50000) * 0.35;
    }

    return irpp;
  }

  // Calcule l'ancienneté en années et mois
  calculateSeniorityYears(hireDate: Date): string {
    if (!hireDate) return 'Non définie';

    const today = new Date();

    let years = today.getFullYear() - hireDate.getFullYear();
    let months = today.getMonth() - hireDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (today.getDate() < hireDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    if (years === 0) return `${months} mois`;
    if (months === 0) return `${years} an${years > 1 ? 's' : ''}`;
    return `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
  }

// Génère une liste d'années depuis la date d'embauche
  generateYearsFromHireDate(hireDate: Date): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];

    if (!hireDate) {
      for (let year = currentYear; year >= currentYear - 5; year--) {
        years.push(year);
      }
      return years;
    }

    const hireYear = hireDate.getFullYear();

    for (let year = hireYear; year <= currentYear; year++) {
      years.push(year);
    }

    if (currentYear === hireYear) {
      years.push(currentYear + 1);
    }

    return years.sort((a, b) => b - a);
  }
}
