import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddEmployeeComponent } from './add-employee.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../../services/auth.service';

// === MOCK AUTH SERVICE ===
class MockAuthService {
  isHRorManager() { return true; }
  isLoggedIn() { return true; }
  isHR() { return false; }
  isHRManager() { return true; }
  getUserRoles() { return ['ROLE_HRMANAGER']; }
  getToken() { return 'fake-jwt-token'; }
}

describe('AddEmployeeComponent', () => {
  let component: AddEmployeeComponent;
  let fixture: ComponentFixture<AddEmployeeComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEmployeeComponent, HttpClientTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEmployeeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default role as ROLE_EMPLOYEE', () => {
    expect(component.employee.role).toBe('ROLE_EMPLOYEE');
  });

  it('should have available roles', () => {
    expect(component.availableRoles.length).toBe(3);
    expect(component.availableRoles[0].value).toBe('ROLE_EMPLOYEE');
    expect(component.availableRoles[1].value).toBe('ROLE_HR');
    expect(component.availableRoles[2].value).toBe('ROLE_HRMANAGER');
  });

  it('should open and close modal', () => {
    component.openModal();
    expect(component.isOpen).toBeTrue();
    expect(component.employee.role).toBe('ROLE_EMPLOYEE');

    component.closeModal();
    expect(component.isOpen).toBeFalse();
  });

  it('should show error if username missing', () => {
    component.employee.username = '';
    component.employee.email = 'test@mail.com';
    component.employee.password = 'Password@123';
    component.employee.cin = '1234';
    component.employee.cnssNumber = '1234';

    component.saveEmployee();

    expect(component.errorMessage).toBe('Le nom complet est obligatoire.');
  });

  it('should call API and close modal on success', () => {
    const closeSpy = spyOn(component, 'closeModal');

    // === Données valide ===
    component.employee = {
      username: 'John Doe',
      email: 'john@example.com',
      password: 'Password@123',
      phone: '99887766',
      gender: 'M',
      hireDate: '2024-01-01',
      salary: 1200,
      position: 'Developer',
      customPosition: '',
      status: 'ACTIVE',
      role: 'ROLE_HR',
      cin: '1234',
      cnssNumber: '5678',
      matricule: 'A001',
      workingDays: 22,
      address: 'Tunis',
      city: 'Tunis',
      rib: '123456',
      bankName: 'BIAT',
      transportAllowance: 50,
      familyAllowance: 20,
      otherBonuses: 10,
      actualWorkingDays: 20
    };

    component.saveEmployee();

    const req = httpMock.expectOne('http://localhost:8081/api/employees/Add-employee');
    expect(req.request.method).toBe('POST');

    // vérifier structure envoyée
    expect(req.request.body.username).toBe('John Doe');
    expect(req.request.body.roleNames).toEqual(['ROLE_HR']);

    req.flush({}, { status: 200, statusText: 'OK' });

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should show server error on API failure', () => {
    component.employee = {
      username: 'John Doe',
      email: 'john@example.com',
      password: 'Password@123',
      phone: '',
      gender: '',
      hireDate: '',
      salary: null,
      position: '',
      customPosition: '',
      status: 'ACTIVE',
      role: 'ROLE_EMPLOYEE',
      cin: '1234',
      cnssNumber: '1234',
      matricule: '',
      workingDays: null,
      address: '',
      city: '',
      rib: '',
      bankName: '',
      transportAllowance: 0,
      familyAllowance: 0,
      otherBonuses: 0,
      actualWorkingDays: null
    };

    component.saveEmployee();

    const req = httpMock.expectOne('http://localhost:8081/api/employees/Add-employee');
    req.flush('Erreur', { status: 500, statusText: 'Server Error' });

    expect(component.errorMessage).toBe('Erreur interne du serveur. Veuillez réessayer.');
  });

  it('should reset role when opening modal', () => {
    component.employee.role = 'ROLE_HR';

    component.openModal();

    expect(component.employee.role).toBe('ROLE_EMPLOYEE');
  });
});
