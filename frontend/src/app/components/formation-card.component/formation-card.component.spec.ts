import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormationCardComponent } from './formation-card.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('FormationCardComponent', () => {
  let component: FormationCardComponent;
  let fixture: ComponentFixture<FormationCardComponent>;

  // Données MOCK
  const mockTraining = {
    id: '1',
    title: 'Angular Advanced Training',
    description: 'Advanced Angular concepts and best practices',
    status: 'PLANIFIED',
    startDate: '2024-01-15T00:00:00.000Z',
    endDate: '2024-01-20T00:00:00.000Z',
    location: 'Online',
    instructor: 'John Doe',
    category: 'Web Development',
    maxParticipants: 20,
    currentParticipants: 15,
    skills: 'Angular,TypeScript,RxJS,State Management',
    createdAt: '2023-12-01T00:00:00.000Z',
    updatedAt: '2023-12-01T00:00:00.000Z'
  } as any;

  // Mock CRITIQUE pour ActivatedRoute
  const mockActivatedRoute = {
    snapshot: {
      paramMap: {
        get: (key: string) => '1'
      }
    },
    params: of({ id: '1' }),
    queryParams: of({}),
    fragment: of(null),
    data: of({}),
    outlet: '',
    component: null,
    routeConfig: null,
    root: null as any,
    parent: null,
    firstChild: null,
    children: [],
    pathFromRoot: [],
    paramMap: of(new Map([['id', '1']])),
    queryParamMap: of(new Map())
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormationCardComponent, // standalone component
        HttpClientTestingModule,
        RouterTestingModule // <-- AJOUTEZ CE MODULE
      ],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute } // <-- FOURNISSEZ ActivatedRoute
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FormationCardComponent);
    component = fixture.componentInstance;
    component.training = mockTraining;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have training data with status', () => {
    expect(component.training).toBeDefined();
    expect(component.training.status).toBe('PLANIFIED');
  });

  it('should calculate progress percentage', () => {
    const progress = component.getProgressPercentage();
    expect(progress).toBe(75); // (15/20)*100 = 75
  });

  it('should parse skills string into array', () => {
    const skills = component.getSkillsArray();
    expect(skills).toEqual(['Angular', 'TypeScript', 'RxJS', 'State Management']);
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2024-01-15T00:00:00.000Z');
    expect(formatted).toBeTruthy();
  });
});
