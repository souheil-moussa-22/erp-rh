import { Injectable } from '@angular/core';

export type TranslationKey =
  | 'PAYSLIP_TITLE'
  | 'COMPANY_NAME'
  | 'COMPANY_ADDRESS'
  | 'EMPLOYEE_ID'
  | 'FULL_NAME'
  | 'CNSS_NUMBER'
  | 'POSITION'
  | 'HIRE_DATE'
  | 'ID_NUMBER'
  | 'EARNINGS_ALLOWANCES'
  | 'SOCIAL_DEDUCTIONS'
  | 'BASE_SALARY'
  | 'TRANSPORT_ALLOWANCE'
  | 'FAMILY_ALLOWANCE'
  | 'OTHER_BONUSES'
  | 'TRADITIONAL_SENIORITY_BONUS'
  | 'NINE_DINARS_BONUS'
  | 'CNSS_EMPLOYEE'
  | 'RETIREMENT'
  | 'HEALTH_INSURANCE'
  | 'INCOME_TAX'
  | 'TOTAL_GROSS'
  | 'TOTAL_DEDUCTIONS'
  | 'SUMMARY'
  | 'GROSS_SALARY'
  | 'TOTAL_SOCIAL_DEDUCTIONS'
  | 'NET_PAY'
  | 'EMPLOYEE_SIGNATURE'
  | 'EMPLOYER_SIGNATURE';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage: 'fr' | 'en' = 'fr';

  private translations = {
    fr: {
      'PAYSLIP_TITLE': 'FICHE DE PAIE',
      'COMPANY_NAME': 'Société Tunisienne Example SARL',
      'COMPANY_ADDRESS': '123 Avenue Habib Bourguiba, Tunis 1001',
      'EMPLOYEE_ID': 'Matricule',
      'FULL_NAME': 'Nom Complet',
      'CNSS_NUMBER': 'Numéro CNSS',
      'POSITION': 'Poste',
      'HIRE_DATE': 'Date d\'embauche',
      'ID_NUMBER': 'CIN',
      'EARNINGS_ALLOWANCES': 'GAINS ET ALLOCATIONS',
      'SOCIAL_DEDUCTIONS': 'COTISATIONS SOCIALES',
      'BASE_SALARY': 'Salaire de base',
      'TRANSPORT_ALLOWANCE': 'Allocation transport',
      'FAMILY_ALLOWANCE': 'Allocation familiale',
      'OTHER_BONUSES': 'Autres primes',
      'TRADITIONAL_SENIORITY_BONUS': 'Prime ancienneté traditionnelle',
      'NINE_DINARS_BONUS': 'Prime 9 dinars (18 mois)',
      'CNSS_EMPLOYEE': 'CNSS Salarial (9.18%)',
      'RETIREMENT': 'Retraite (3.5%)',
      'HEALTH_INSURANCE': 'Assurance maladie (2%)',
      'INCOME_TAX': 'IRPP',
      'TOTAL_GROSS': 'Total Brut',
      'TOTAL_DEDUCTIONS': 'Total Déductions',
      'SUMMARY': 'RÉSUMÉ',
      'GROSS_SALARY': 'Salaire Brut',
      'TOTAL_SOCIAL_DEDUCTIONS': 'Total Cotisations',
      'NET_PAY': 'NET À PAYER',
      'EMPLOYEE_SIGNATURE': 'Signature Employé',
      'EMPLOYER_SIGNATURE': 'Signature Employeur'
    },
    en: {
      'PAYSLIP_TITLE': 'PAYSLIP',
      'COMPANY_NAME': 'Tunisian Company Example LLC',
      'COMPANY_ADDRESS': '123 Habib Bourguiba Avenue, Tunis 1001',
      'EMPLOYEE_ID': 'Employee ID',
      'FULL_NAME': 'Full Name',
      'CNSS_NUMBER': 'CNSS Number',
      'POSITION': 'Position',
      'HIRE_DATE': 'Hire Date',
      'ID_NUMBER': 'ID Number',
      'EARNINGS_ALLOWANCES': 'EARNINGS AND ALLOWANCES',
      'SOCIAL_DEDUCTIONS': 'SOCIAL DEDUCTIONS',
      'BASE_SALARY': 'Base salary',
      'TRANSPORT_ALLOWANCE': 'Transport allowance',
      'FAMILY_ALLOWANCE': 'Family allowance',
      'OTHER_BONUSES': 'Other bonuses',
      'TRADITIONAL_SENIORITY_BONUS': 'Traditional seniority bonus',
      'NINE_DINARS_BONUS': '9 dinars bonus (18 months)',
      'CNSS_EMPLOYEE': 'Employee CNSS (9.18%)',
      'RETIREMENT': 'Retirement (3.5%)',
      'HEALTH_INSURANCE': 'Health insurance (2%)',
      'INCOME_TAX': 'Income tax',
      'TOTAL_GROSS': 'Total Gross',
      'TOTAL_DEDUCTIONS': 'Total Deductions',
      'SUMMARY': 'SUMMARY',
      'GROSS_SALARY': 'Gross Salary',
      'TOTAL_SOCIAL_DEDUCTIONS': 'Total Social Deductions',
      'NET_PAY': 'NET PAY',
      'EMPLOYEE_SIGNATURE': 'Employee Signature',
      'EMPLOYER_SIGNATURE': 'Employer Signature'
    }
  };

  setLanguage(lang: 'fr' | 'en') {
    this.currentLanguage = lang;
  }

  translate(key: TranslationKey): string {
    return this.translations[this.currentLanguage][key] || key;
  }

  getCurrentLanguage(): 'fr' | 'en' {
    return this.currentLanguage;
  }
}
