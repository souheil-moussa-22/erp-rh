import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import { Employee } from './employee.service';
import { CalculationsService, SeniorityInfo, SalaryCalculation } from './calculations.service';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class PdfGenerationService {

  constructor(
    private calculationsService: CalculationsService,
    private translationService: TranslationService
  ) {}

// Génère la fiche de paie PDF pour un employé donné et une période spécifique
  generatePayslipPDF(employee: Employee, periodText: string, language: 'fr' | 'en' = 'fr'): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = 15;

    //  CORRECTION : Déterminer la date de la fiche de paie
    const periodDate = this.extractDateFromPeriod(periodText);

    //  CORRECTION : Créer un employé "propre" sans données d'ancienneté pré-calculées
    const cleanEmployee = this.createCleanEmployeeForCalculation(employee);

    //  CORRECTION : Utiliser le calcul avec date spécifique
    const seniorityInfo = this.calculationsService.calculateSeniorityBonusForPeriod(cleanEmployee, periodDate);
    const salaryCalculation = this.calculationsService.calculateSalary(cleanEmployee, seniorityInfo);

    // ================= EN-TÊTE =================
    this.addHeader(doc, pageWidth, language);
    yPosition = 40;

    // ================= PÉRIODE DE PAIE =================
    yPosition = this.addPayPeriod(doc, pageWidth, yPosition, periodText, language);

    // ================= INFORMATIONS EMPLOYÉ =================
    yPosition = this.addEmployeeInfo(doc, pageWidth, margin, yPosition, employee, seniorityInfo, language);

    // ================= TABLEAU GAINS ET DÉDUCTIONS =================
    yPosition = this.addEarningsDeductionsTable(doc, pageWidth, margin, yPosition, salaryCalculation, seniorityInfo, language);

    // ================= RÉSUMÉ DÉTAILLÉ ANCIENNETÉ =================
    yPosition = this.addSeniorityDetails(doc, pageWidth, margin, yPosition, seniorityInfo, language);

    // ================= RÉSUMÉ SALARIAL =================
    yPosition = this.addSalarySummary(doc, pageWidth, margin, yPosition, salaryCalculation, language);

    // ================= SIGNATURES =================
    this.addSignatures(doc, pageWidth, margin, yPosition, language);

    return doc;
  }

  private extractDateFromPeriod(periodText: string): Date {
    try {
      const [monthName, yearStr] = periodText.split(' ');
      const year = parseInt(yearStr);

      const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      const monthIndex = monthNames.findIndex(name => name === monthName);

      if (monthIndex !== -1 && !isNaN(year)) {
        return new Date(year, monthIndex, 15);
      }
    } catch (error) {
      console.error('Erreur extraction date période:', error);
    }

    // Fallback : date actuelle
    return new Date();
  }

  private createCleanEmployeeForCalculation(employee: Employee): Employee {
    const cleanEmployee: Employee = {
      id: employee.id,
      username: employee.username,
      email: employee.email,
      phone: employee.phone,
      salary: employee.salary,
      status: employee.status,
      hireDate: employee.hireDate,
      photoUrl: employee.photoUrl,
      photoId: employee.photoId,
      cin: employee.cin,
      cnssNumber: employee.cnssNumber,
      position: employee.position,
      address: employee.address,
      city: employee.city,
      matricule: employee.matricule,
      rib: employee.rib,
      bankName: employee.bankName,
      workingDays: employee.workingDays,
      actualWorkingDays: employee.actualWorkingDays,
      transportAllowance: employee.transportAllowance,
      familyAllowance: employee.familyAllowance,
      otherBonuses: employee.otherBonuses,
      seniorityBonus: undefined,
      yearsOfService: undefined,
      monthsOfService: undefined,
      bonusPeriods: undefined,
      traditionalSeniorityBonus: undefined,
      nineDinarsBonus: undefined,
      // Propriétés optionnelles
      employee: employee.employee,
      formations: employee.formations
    };

    return cleanEmployee;
  }

  private addHeader(doc: jsPDF, pageWidth: number, language: 'fr' | 'en'): void {
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('PAYSLIP_TITLE', language), pageWidth / 2, 12, { align: 'center' });

    // Informations entreprise
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(this.getTranslation('COMPANY_NAME', language), pageWidth / 2, 20, { align: 'center' });
    doc.text(this.getTranslation('COMPANY_ADDRESS', language), pageWidth / 2, 25, { align: 'center' });
    doc.text('Tel: 71 000 000 - Tax ID: 12345678/AM0000', pageWidth / 2, 30, { align: 'center' });
  }

  private addPayPeriod(doc: jsPDF, pageWidth: number, yPosition: number, periodText: string, language: 'fr' | 'en'): number {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    const periodLabel = language === 'fr'
      ? `Période de paie : ${periodText}`
      : `Pay Period: ${periodText}`;

    doc.text(periodLabel, pageWidth / 2, yPosition, { align: 'center' });
    return yPosition + 10;
  }

  private addEmployeeInfo(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    yPosition: number,
    employee: Employee,
    seniorityInfo: SeniorityInfo,
    language: 'fr' | 'en'
  ): number {
    doc.setFontSize(8);

    // Ligne 1
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('EMPLOYEE_ID', language), margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.matricule || employee.id || 'G123456', margin + 20, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('FULL_NAME', language), pageWidth / 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.username || 'Malia Idous', pageWidth / 2 + 25, yPosition);
    yPosition += 6;

    // Ligne 2
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('CNSS_NUMBER', language), margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.cnssNumber || this.getTranslation('NOT_PROVIDED', language), margin + 15, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('POSITION', language), pageWidth / 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.position || employee.status || '-', pageWidth / 2 + 15, yPosition);
    yPosition += 6;

    // Ligne 3
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('HIRE_DATE', language), margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('fr-FR') : '-', margin + 30, yPosition);

    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('ID_NUMBER', language), pageWidth / 2, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(employee.cin || '-', pageWidth / 2 + 15, yPosition);

    return yPosition + 10;
  }

  private addEarningsDeductionsTable(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    yPosition: number,
    salaryCalculation: SalaryCalculation,
    seniorityInfo: SeniorityInfo,
    language: 'fr' | 'en'
  ): number {
    const tableWidth = pageWidth - 2 * margin;
    const colWidth = tableWidth / 2;
    const rowHeight = 8;

    // En-têtes
    doc.setFillColor(44, 62, 80);
    doc.rect(margin, yPosition, colWidth, rowHeight, 'F');
    doc.rect(margin + colWidth, yPosition, colWidth, rowHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('EARNINGS_ALLOWANCES', language), margin + colWidth / 2, yPosition + 5, { align: 'center' });
    doc.text(this.getTranslation('SOCIAL_DEDUCTIONS', language), margin + colWidth + colWidth / 2, yPosition + 5, { align: 'center' });
    yPosition += rowHeight;

    // Fonction pour dessiner une ligne
    const drawRow = (leftLabel: string, leftValue: string, rightLabel: string, rightValue: string) => {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.1);
      doc.rect(margin, yPosition, colWidth, rowHeight);
      doc.rect(margin + colWidth, yPosition, colWidth, rowHeight);

      doc.setTextColor(0, 0, 0);

      // Colonne gauche
      doc.setFont('helvetica', 'bold');
      doc.text(leftLabel, margin + 5, yPosition + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(leftValue, margin + colWidth - 5, yPosition + 5, { align: 'right' });

      // Colonne droite
      doc.setFont('helvetica', 'bold');
      doc.text(rightLabel, margin + colWidth + 5, yPosition + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(rightValue, margin + tableWidth - 5, yPosition + 5, { align: 'right' });

      yPosition += rowHeight;
    };

    //  CORRECTION : Logs de débogage pour vérifier le calcul
    console.log('🔍 PDF Generation - Prime calculée:', {
      totalSeniorityBonus: seniorityInfo.totalSeniorityBonus,
      nineDinarsBonus: seniorityInfo.nineDinarsBonus,
      traditionalSeniorityBonus: seniorityInfo.traditionalSeniorityBonus,
      monthsOfService: seniorityInfo.monthsOfService,
      bonusPeriods: seniorityInfo.bonusPeriods
    });

    // Données du tableau
    drawRow(
      this.getTranslation('BASE_SALARY', language),
      `${salaryCalculation.baseSalary.toFixed(3)} TND`,
      'CNSS (9.18%)',
      `${salaryCalculation.cnssEmployee.toFixed(3)} TND`
    );

    drawRow(
      this.getTranslation('TRANSPORT_ALLOWANCE', language),
      `${salaryCalculation.transport.toFixed(3)} TND`,
      this.getTranslation('RETIREMENT', language),
      `${salaryCalculation.retirement.toFixed(3)} TND`
    );

    drawRow(
      this.getTranslation('FAMILY_ALLOWANCE', language),
      `${salaryCalculation.family.toFixed(3)} TND`,
      this.getTranslation('HEALTH_INSURANCE', language),
      `${salaryCalculation.healthInsurance.toFixed(3)} TND`
    );

    drawRow(
      this.getTranslation('SENIORITY_BONUS', language),
      `${seniorityInfo.totalSeniorityBonus.toFixed(3)} TND`,
      'IRPP',
      `${salaryCalculation.irpp.toFixed(3)} TND`
    );

    // Totaux
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, colWidth, rowHeight, 'F');
    doc.rect(margin + colWidth, yPosition, colWidth, rowHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('TOTAL_GROSS', language), margin + 5, yPosition + 5);
    doc.text(`${salaryCalculation.totalBrut.toFixed(3)} TND`, margin + colWidth - 5, yPosition + 5, { align: 'right' });

    doc.text(this.getTranslation('TOTAL_DEDUCTIONS', language), margin + colWidth + 5, yPosition + 5);
    doc.text(`${salaryCalculation.totalCotisations.toFixed(3)} TND`, margin + tableWidth - 5, yPosition + 5, { align: 'right' });

    return yPosition + rowHeight + 10;
  }

  private addSeniorityDetails(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    yPosition: number,
    seniorityInfo: SeniorityInfo,
    language: 'fr' | 'en'
  ): number {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('SENIORITY_DETAILS', language), margin + 3, yPosition + 4);
    yPosition += 10;

    // Détails ancienneté
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');

    doc.text(`${this.getTranslation('MONTHS_OF_SERVICE', language)}: ${seniorityInfo.monthsOfService}`, margin, yPosition);
    doc.text(`${this.getTranslation('BONUS_PERIODS', language)}: ${seniorityInfo.bonusPeriods}`, pageWidth / 2, yPosition);
    yPosition += 5;

    doc.text(`${this.getTranslation('NINE_DINARS_BONUS', language)}: ${seniorityInfo.nineDinarsBonus.toFixed(3)} TND`, margin, yPosition);
    doc.text(`${this.getTranslation('TRADITIONAL_SENIORITY_BONUS', language)}: ${seniorityInfo.traditionalSeniorityBonus.toFixed(3)} TND`, pageWidth / 2, yPosition);

    return yPosition + 8;
  }

  private addSalarySummary(
    doc: jsPDF,
    pageWidth: number,
    margin: number,
    yPosition: number,
    salaryCalculation: SalaryCalculation,
    language: 'fr' | 'en'
  ): number {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 6, 'F');

    doc.setTextColor(44, 62, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('SUMMARY', language), margin + 3, yPosition + 4);
    yPosition += 10;

    const summaryHeight = 8;

    // Revenu imposable
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('TAXABLE_INCOME', language), margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(`${salaryCalculation.taxableIncome.toFixed(3)} TND`, pageWidth - margin - 5, yPosition, { align: 'right' });
    yPosition += summaryHeight;

    // Net à payer
    doc.setFillColor(200, 230, 201);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, summaryHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text(this.getTranslation('NET_PAY', language), margin, yPosition + 5);
    doc.text(`${salaryCalculation.netAPayer.toFixed(3)} TND`, pageWidth - margin - 5, yPosition + 5, { align: 'right' });

    return yPosition + summaryHeight + 10;
  }

  private addSignatures(doc: jsPDF, pageWidth: number, margin: number, yPosition: number, language: 'fr' | 'en'): void {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(this.getTranslation('EMPLOYEE_SIGNATURE', language), margin, yPosition);
    doc.text(this.getTranslation('EMPLOYER_SIGNATURE', language), pageWidth - margin - 40, yPosition);

    doc.setLineWidth(0.2);
    doc.line(margin, yPosition + 4, margin + 40, yPosition + 4);
    doc.line(pageWidth - margin - 40, yPosition + 4, pageWidth - margin, yPosition + 4);
  }

  private getTranslation(key: string, language: 'fr' | 'en'): string {
    const translations: { [key: string]: { fr: string, en: string } } = {
      'PAYSLIP_TITLE': { fr: 'FICHE DE PAIE - TUNISIE', en: 'PAYSLIP - TUNISIA' },
      'COMPANY_NAME': { fr: 'ENTREPRISE TUNISIENNE SARL', en: 'TUNISIAN COMPANY SARL' },
      'COMPANY_ADDRESS': { fr: 'Avenue Habib Bourguiba - 1002 Tunis', en: 'Avenue Habib Bourguiba - 1002 Tunis' },
      'EMPLOYEE_ID': { fr: 'Matricule:', en: 'Employee ID:' },
      'FULL_NAME': { fr: 'Nom Complet:', en: 'Full Name:' },
      'CNSS_NUMBER': { fr: 'CNSS:', en: 'CNSS Number:' },
      'POSITION': { fr: 'Poste:', en: 'Position:' },
      'HIRE_DATE': { fr: 'Date embauche:', en: 'Hire Date:' },
      'ID_NUMBER': { fr: 'CIN:', en: 'ID Number:' },
      'EARNINGS_ALLOWANCES': { fr: 'GAINS ET ALLOCATIONS', en: 'EARNINGS AND ALLOWANCES' },
      'SOCIAL_DEDUCTIONS': { fr: 'DÉDUCTIONS SOCIALES', en: 'SOCIAL DEDUCTIONS' },
      'BASE_SALARY': { fr: 'Salaire de base', en: 'Base salary' },
      'TRANSPORT_ALLOWANCE': { fr: 'Allocation transport', en: 'Transport allowance' },
      'FAMILY_ALLOWANCE': { fr: 'Allocation famille', en: 'Family allowance' },
      'SENIORITY_BONUS': { fr: 'Prime ancienneté', en: 'Seniority bonus' },
      'RETIREMENT': { fr: 'Retraite (3.5%)', en: 'Retirement (3.5%)' },
      'HEALTH_INSURANCE': { fr: 'Assurance maladie (2%)', en: 'Health insurance (2%)' },
      'TOTAL_GROSS': { fr: 'TOTAL BRUT', en: 'TOTAL GROSS' },
      'TOTAL_DEDUCTIONS': { fr: 'TOTAL DÉDUCTIONS', en: 'TOTAL DEDUCTIONS' },
      'SENIORITY_DETAILS': { fr: 'Détail Ancienneté', en: 'Seniority Details' },
      'MONTHS_OF_SERVICE': { fr: 'Mois de service', en: 'Months of service' },
      'BONUS_PERIODS': { fr: 'Périodes de prime (18 mois)', en: 'Bonus periods (18 months)' },
      'NINE_DINARS_BONUS': { fr: 'Prime 9 dinars', en: '9 dinars bonus' },
      'TRADITIONAL_SENIORITY_BONUS': { fr: 'Prime ancienneté trad.', en: 'Traditional seniority bonus' },
      'SUMMARY': { fr: 'Résumé Salarial', en: 'Summary' },
      'TAXABLE_INCOME': { fr: 'Revenu imposable', en: 'Taxable income' },
      'NET_PAY': { fr: 'NET À PAYER', en: 'NET PAY' },
      'EMPLOYEE_SIGNATURE': { fr: 'Signature employé', en: 'Employee signature' },
      'EMPLOYER_SIGNATURE': { fr: 'Signature employeur', en: 'Employer signature' },
      'NOT_PROVIDED': { fr: 'Non fourni', en: 'Not provided' }
    };

    return translations[key]?.[language] || key;
  }
}
