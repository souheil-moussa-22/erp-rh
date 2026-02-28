import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormationService, FormationRequest } from '../../services/formation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-formation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formation-form.component.html',
  styleUrls: ['./formation-form.component.css']
})
export class FormationFormComponent implements OnInit {
  formationForm: FormGroup;
  isEdit = false;
  formationId: string | null = null;
  loading = false;
  submitting = false;
  errorMessage: string = '';

  categories = [
    'TECHNICAL',
    'SOFT_SKILLS',
    'MANAGEMENT',
    'COMPLIANCE',
    'LANGUAGE',
    'LEADERSHIP',
    'DIGITAL_TRANSFORMATION'
  ];

  timeSlots: string[] = [];

  constructor(
    private fb: FormBuilder,
    private formationService: FormationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.formationForm = this.createForm();
    this.timeSlots = this.generateTimeSlots();
  }

  ngOnInit(): void {

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.formationId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.formationId;

    if (this.isEdit && this.formationId) {
      this.loadFormation();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      location: ['', [Validators.required, Validators.minLength(2)]],
      formateur: ['', [Validators.required, Validators.minLength(2)]],
      maxParticipants: ['', [Validators.required, Validators.min(1), Validators.max(100)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      endTime: ['17:00', Validators.required],
      cost: [0, [Validators.min(0), Validators.max(100000)]],
      category: ['', Validators.required],
      skills: ['', [Validators.maxLength(200)]]
    }, { validators: this.dateValidator });
  }

  private dateValidator(group: FormGroup) {
    const startDate = group.get('startDate')?.value;
    const endDate = group.get('endDate')?.value;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return { dateRange: true };
    }
    return null;
  }

  loadFormation(): void {
    if (!this.formationId) return;

    this.loading = true;
    this.formationService.getFormationById(this.formationId).subscribe({
      next: (formation) => {
        this.formationForm.patchValue({
          title: formation.title,
          description: formation.description,
          location: formation.location,
          formateur: formation.formateur,
          maxParticipants: formation.maxParticipants,
          startDate: formation.startDate,
          endDate: formation.endDate,
          startTime: formation.startTime,
          endTime: formation.endTime,
          cost: formation.cost,
          category: formation.category,
          skills: formation.skills
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading formation:', error);
        this.errorMessage = 'Error loading formation';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.formationForm.valid) {
      this.submitting = true;
      this.errorMessage = '';

      try {
        const formValue = this.formationForm.value;
        const request: FormationRequest = {
          title: formValue.title,
          description: formValue.description,
          location: formValue.location,
          formateur: formValue.formateur,
          maxParticipants: formValue.maxParticipants,
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          startTime: formValue.startTime,
          endTime: formValue.endTime,
          cost: formValue.cost,
          category: formValue.category,
          skills: formValue.skills
        };

        const createdById = this.getCurrentUserId();

        const observable = this.isEdit && this.formationId
          ? this.formationService.updateFormation(this.formationId, request)
          : this.formationService.createFormation(request, createdById);

        observable.subscribe({
          next: (response) => {
            this.submitting = false;
            alert(this.isEdit ? 'Formation updated successfully!' : 'Formation created successfully!');
            this.router.navigate(['/formations']);
          },
          error: (error) => {
            console.error('Error saving formation:', error);

            let errorMessage = `Error during ${this.isEdit ? 'update' : 'creation'}`;

            if (error?.error?.message) {
              errorMessage = error.error.message;
            } else if (error?.message) {
              errorMessage = error.message;
            } else if (error?.status === 401) {
              errorMessage = 'Non autorisé - Veuillez vous reconnecter';
              this.authService.logout();
            } else if (error?.status === 403) {
              errorMessage = 'Accès refusé - Vous n\'avez pas les permissions nécessaires';
            }

            this.errorMessage = errorMessage;
            this.submitting = false;
          }
        });
      } catch (error) {
        this.errorMessage = 'Error: User not logged in. Please log in again.';
        this.submitting = false;
      }
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Please correct errors in the form';
    }
  }

  private getCurrentUserId(): string {
    const currentUser = this.authService.getUser();

    if (currentUser?.id) {
      return currentUser.id;
    }

    this.router.navigate(['/login']);
    throw new Error('No user logged in');
  }

  goBack(): void {
    this.router.navigate(['/formations']);
  }

  markFormGroupTouched(): void {
    Object.keys(this.formationForm.controls).forEach(key => {
      this.formationForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.formationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length: ${field.errors['minlength'].requiredLength} characters`;
      if (field.errors['maxlength']) return `Maximum length: ${field.errors['maxlength'].requiredLength} characters`;
      if (field.errors['min']) return `Minimum value: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value: ${field.errors['max'].max}`;
      if (field.errors['email']) return 'Please enter a valid email';
    }
    return '';
  }

  getDescriptionLength(): number {
    return this.formationForm.get('description')?.value?.length || 0;
  }

  getDescriptionClass(): string {
    const length = this.getDescriptionLength();
    if (length > 450) return 'error';
    if (length > 400) return 'warning';
    return '';
  }

  private generateTimeSlots(): string[] {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  }

  // Méthode pour obtenir l'erreur de date range
  getDateRangeError(): string {
    if (this.formationForm.errors?.['dateRange'] &&
      this.formationForm.get('startDate')?.touched &&
      this.formationForm.get('endDate')?.touched) {
      return 'End date must be after start date';
    }
    return '';
  }
}
