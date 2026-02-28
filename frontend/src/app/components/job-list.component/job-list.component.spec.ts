import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobListComponent } from './job-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';


describe('JobListComponent', () => {
  let component: JobListComponent;
  let fixture: ComponentFixture<JobListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        JobListComponent, // Pour les standalone components
        HttpClientTestingModule, // <-- AJOUTEZ CE MODULE
        RouterTestingModule // <-- AJOUTEZ CE MODULE (si le composant utilise le router)
      ]
      // Si JobListComponent utilise JobOfferService dans son constructeur,
      // vous devrez peut-être aussi le fournir ici
    })
      .compileComponents();

    fixture = TestBed.createComponent(JobListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
