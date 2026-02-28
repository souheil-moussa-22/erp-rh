import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormationListComponent } from './formation-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('FormationListComponent', () => {
  let component: FormationListComponent;
  let fixture: ComponentFixture<FormationListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormationListComponent
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FormationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
