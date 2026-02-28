import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobOfferService, JobOfferRequest } from '../../services/job-offer.service';
import { AuthService } from '../../services/auth.service';
import { AiService, AiSuggestionRequest, AiSuggestionType } from '../../services/ai.service';
import { LinkedInService } from '../../services/linkedin.service'; // AJOUTER

@Component({
  selector: 'app-job-form',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './job-form.component.html',
  styleUrl: './job-form.component.css',
})
export class JobFormComponent implements OnInit {
  jobForm: FormGroup;
  isEdit = false;
  jobId: string | null = null;
  loading = false;
  submitting = false;
  aiGenerating = false;
  linkedInPublishing = false; // AJOUTER
  errorMessage: string = '';

  contractTypes = ['CDI', 'CDD', 'FREELANCE', 'INTERNSHIP', 'PART_TIME'];
  experienceLevels = ['JUNIOR', 'MID', 'SENIOR'];
  educationLevels = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'DOCTORATE'];

  currentTags: string[] = [];
  tagInput: string = '';

  // Option pour publier sur LinkedIn automatiquement
  publishToLinkedIn = false; // AJOUTER

  constructor(
    private fb: FormBuilder,
    private jobService: JobOfferService,
    private authService: AuthService,
    private aiService: AiService,
    private linkedInService: LinkedInService, // AJOUTER
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.jobForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('🔐 JobFormComponent - Initialisation');
    this.detectFormMode();
    this.checkLinkedInIntegration(); // AJOUTER
  }

  // NOUVELLE MÉTHODE : Vérifier si LinkedIn est connecté
  checkLinkedInIntegration(): void {
    this.linkedInService.checkIntegrationStatus().subscribe({
      next: (status) => {
        console.log('📘 LinkedIn Integration Status:', status);
        if (status.connected) {
          console.log('✅ LinkedIn est connecté');
        } else {
          console.log('❌ LinkedIn n\'est pas connecté');
        }
      },
      error: (error) => {
        console.warn('⚠️ Impossible de vérifier le statut LinkedIn:', error);
      }
    });
  }

  private detectFormMode(): void {
    this.jobId = this.route.snapshot.paramMap.get('id');
    const currentUrl = this.router.url;
    this.isEdit = currentUrl.includes('/edit') && !!this.jobId;

    if (this.isEdit && this.jobId) {
      console.log('🔄 Mode ÉDITION détecté');
      this.loadJobOffer();
    } else {
      console.log('🆕 Mode CRÉATION détecté');
      this.isEdit = false;
      this.jobId = null;
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      department: ['', [Validators.required, Validators.minLength(2)]],
      location: ['', [Validators.required, Validators.minLength(2)]],
      contractType: ['', Validators.required],
      requirements: ['', [Validators.required, Validators.minLength(10)]],
      responsibilities: ['', [Validators.required, Validators.minLength(10)]],
      benefits: ['', [Validators.required, Validators.minLength(10)]],
      closingDate: ['', [Validators.required, this.futureDateValidator]],
      experienceLevel: ['', Validators.required],
      educationRequired: ['', Validators.required],
      tags: ['']
    });
  }

  private futureDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate >= today ? null : { pastDate: true };
  }

  loadJobOffer(): void {
    if (!this.jobId) {
      console.error('❌ Impossible de charger l\'offre');
      return;
    }

    this.loading = true;
    this.jobService.getJobOfferById(this.jobId).subscribe({
      next: (job) => {
        console.log('✅ Offre chargée:', job);
        
        let closingDate = '';
        try {
          if (job.closingDate) {
            const date = new Date(job.closingDate);
            if (!isNaN(date.getTime())) {
              closingDate = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur date:', error);
        }

        this.currentTags = job.tags || [];

        this.jobForm.patchValue({
          title: job.title || '',
          description: job.description || '',
          department: job.department || '',
          location: job.location || '',
          contractType: job.contractType || '',
          requirements: job.requirements || '',
          responsibilities: job.responsibilities || '',
          benefits: job.benefits || '',
          closingDate: closingDate,
          experienceLevel: job.experienceLevel || '',
          educationRequired: job.educationRequired || '',
          tags: this.currentTags.join(', ') || ''
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement:', error);
        this.errorMessage = `Erreur: ${error.message}`;
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.jobForm.valid) {
      this.submitting = true;
      this.errorMessage = '';

      const formValue = this.jobForm.value;
      const tags = this.currentTags.length > 0 ? this.currentTags :
        (formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : []);

      const request: JobOfferRequest = {
        title: formValue.title,
        description: formValue.description,
        department: formValue.department,
        location: formValue.location,
        contractType: formValue.contractType,
        requirements: formValue.requirements,
        responsibilities: formValue.responsibilities,
        benefits: formValue.benefits,
        closingDate: formValue.closingDate,
        experienceLevel: formValue.experienceLevel,
        educationRequired: formValue.educationRequired,
        tags: tags,
        isActive: true,
        publishToLinkedIn: this.publishToLinkedIn
      };

      if (this.isEdit && this.jobId) {
        this.updateJobOffer(request);
      } else {
        this.createJobOffer(request);
      }
    } else {
      this.markFormGroupTouched();
      this.errorMessage = 'Veuillez corriger les erreurs';
    }
  }

  private createJobOffer(request: JobOfferRequest): void {
    const publisherId = this.getCurrentUserId();
    if (!publisherId) {
      this.errorMessage = 'Utilisateur non connecté';
      this.submitting = false;
      return;
    }

    this.jobService.createJobOffer(request, publisherId).subscribe({
      next: (response) => {
        console.log('✅ Offre créée:', response.title);
        
        // MODIFICATION : Publier automatiquement sur LinkedIn si l'option est cochée
        if (this.publishToLinkedIn && response.id) {
          this.publishJobToLinkedIn(response.id);
        } else {
          this.submitting = false;
          alert('Offre créée avec succès!');
          this.router.navigate(['/jobs']);
        }
      },
      error: (error) => {
        console.error('❌ Erreur création:', error);
        this.errorMessage = `Erreur: ${error.message}`;
        this.submitting = false;
      }
    });
  }

  private updateJobOffer(request: JobOfferRequest): void {
    if (!this.jobId) return;
    
    this.jobService.updateJobOffer(this.jobId, request).subscribe({
      next: (response) => {
        console.log('✅ Offre mise à jour:', response.title);
        this.submitting = false;
        alert('Offre mise à jour avec succès!');
        this.router.navigate(['/jobs']);
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour:', error);
        this.errorMessage = `Erreur: ${error.message}`;
        this.submitting = false;
      }
    });
  }

  // NOUVELLE MÉTHODE : Publier sur LinkedIn
  publishJobToLinkedIn(jobId: string): void {
    this.linkedInPublishing = true;
    console.log('📘 Publication sur LinkedIn...');

    this.linkedInService.publishJobToLinkedIn(jobId).subscribe({
      next: (response) => {
        console.log('✅ Publié sur LinkedIn:', response);
        this.linkedInPublishing = false;
        this.submitting = false;
        
        if (response.success) {
          alert('Offre créée et publiée sur LinkedIn avec succès!');
        } else {
          alert('Offre créée, mais erreur LinkedIn: ' + response.errorMessage);
        }
        
        this.router.navigate(['/jobs']);
      },
      error: (error) => {
        console.error('❌ Erreur publication LinkedIn:', error);
        this.linkedInPublishing = false;
        this.submitting = false;
        alert('Offre créée, mais échec de publication LinkedIn');
        this.router.navigate(['/jobs']);
      }
    });
  }

  private getCurrentUserId(): string {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.id) {
      return currentUser.id;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id;
      } catch (error) {
        console.error('Erreur parsing user:', error);
      }
    }

    throw new Error('Utilisateur non connecté');
  }

  markFormGroupTouched(): void {
    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return `Longueur minimale: ${field.errors['minlength'].requiredLength}`;
      if (field.errors['pastDate']) return 'La date doit être dans le futur';
    }
    return '';
  }

  goBack(): void {
    this.router.navigate(['/jobs']);
  }

  addTag(tag: string): void {
    const trimmedTag = tag.trim();
    if (trimmedTag && !this.currentTags.includes(trimmedTag)) {
      this.currentTags.push(trimmedTag);
      this.updateTagsFormControl();
    }
  }

  removeTag(tag: string): void {
    this.currentTags = this.currentTags.filter(t => t !== tag);
    this.updateTagsFormControl();
  }

  onTagKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCurrentTag();
    }
  }

  onTagInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.tagInput = input.value;
  }

  addCurrentTag(): void {
    if (this.tagInput.trim()) {
      this.addTag(this.tagInput.trim());
      this.tagInput = '';
    }
  }

  updateTagsFormControl(): void {
    this.jobForm.patchValue({
      tags: this.currentTags.join(', ')
    });
  }

  // Méthodes AI existantes...
  generateDescriptionAI(): void {
    const title = this.jobForm.get('title')?.value;
    const department = this.jobForm.get('department')?.value;
    const location = this.jobForm.get('location')?.value;

    if (!title || !department || !location) {
      this.errorMessage = 'Veuillez remplir titre, département et localisation';
      return;
    }

    this.aiGenerating = true;
    this.aiService.generateJobDescription(title, department, location)
      .subscribe({
        next: (response) => {
          if (response.success && response.suggestion) {
            this.jobForm.patchValue({ description: response.suggestion });
          }
          this.aiGenerating = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur AI: ' + error.message;
          this.aiGenerating = false;
        }
      });
  }

// Méthode principale pour générer n'importe quel champ
  generateFieldAI(fieldName: string): void {
    const jobTitle = this.jobForm.get('title')?.value;
    const department = this.jobForm.get('department')?.value;
    const location = this.jobForm.get('location')?.value;

    // Vérifier les champs requis
    if (!jobTitle || !department || !location) {
      this.errorMessage = 'Veuillez d\'abord remplir le titre, département et localisation';
      return;
    }

    this.aiGenerating = true;
    this.errorMessage = '';

    // Déterminer le type de suggestion basé sur le champ
    let aiType: AiSuggestionType;
    let promptContext = '';

    switch (fieldName) {
      case 'description':
        aiType = AiSuggestionType.JOB_DESCRIPTION;
        promptContext = `Titre: ${jobTitle}, Département: ${department}, Localisation: ${location}`;
        break;
      case 'responsibilities':
        aiType = AiSuggestionType.RESPONSIBILITIES;
        promptContext = `Poste: ${jobTitle}, Département: ${department}`;
        break;
      case 'requirements':
        aiType = AiSuggestionType.REQUIREMENTS;
        promptContext = `Poste: ${jobTitle}, Département: ${department}`;
        break;
      case 'benefits':
        aiType = AiSuggestionType.BENEFITS;
        promptContext = `Poste: ${jobTitle}, Département: ${department}, Localisation: ${location}`;
        break;
      default:
        this.errorMessage = 'Champ non supporté';
        this.aiGenerating = false;
        return;
    }

    // Appeler le service AI
    this.aiService.generateSuggestion({
      type: aiType,
      jobTitle: jobTitle,
      context: promptContext,
      language: 'fr'
    }).subscribe({
      next: (response) => {
        if (response.success && response.suggestion) {
          this.jobForm.patchValue({
            [fieldName]: response.suggestion
          });
          // Animation pour indiquer que le champ a été généré
          this.animateField(fieldName);
        } else {
          this.errorMessage = response.errorMessage || `Erreur lors de la génération du ${fieldName}`;
        }
        this.aiGenerating = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur AI: ' + error.message;
        this.aiGenerating = false;
      }
    });
  }

// Méthode pour améliorer un champ existant
  improveFieldAI(fieldName: string): void {
    const fieldValue = this.jobForm.get(fieldName)?.value;
    const jobTitle = this.jobForm.get('title')?.value;

    if (!fieldValue || fieldValue.trim().length < 10) {
      this.errorMessage = `Le champ ${fieldName} doit contenir au moins 10 caractères`;
      return;
    }

    this.aiGenerating = true;
    this.errorMessage = '';

    const context = jobTitle ? `Poste: ${jobTitle}, Champ à améliorer: ${fieldName}` : `Champ: ${fieldName}`;

    this.aiService.improveText(fieldValue, context)
      .subscribe({
        next: (response) => {
          if (response.success && response.suggestion) {
            this.jobForm.patchValue({
              [fieldName]: response.suggestion
            });
            this.animateField(fieldName);
          } else {
            this.errorMessage = response.errorMessage || 'Erreur lors de l\'amélioration';
          }
          this.aiGenerating = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur AI: ' + error.message;
          this.aiGenerating = false;
        }
      });
  }

// Animation pour indiquer qu'un champ a été généré
  private animateField(fieldName: string): void {
    const fieldElement = document.getElementById(fieldName);
    if (fieldElement) {
      fieldElement.classList.add('ai-generated');
      setTimeout(() => {
        fieldElement.classList.remove('ai-generated');
      }, 2000);
    }
  }

// Méthode pour suggérer des titres (optionnel)
  suggestTitlesAI(): void {
    const description = this.jobForm.get('description')?.value;

    if (!description || description.trim().length < 20) {
      this.errorMessage = 'Veuillez d\'abord écrire une description (min 20 caractères)';
      return;
    }

    this.aiGenerating = true;
    this.errorMessage = '';

    this.aiService.suggestJobTitles(description)
      .subscribe({
        next: (titles) => {
          if (titles && titles.length > 0) {
            this.showTitleSuggestions(titles);
          } else {
            this.errorMessage = 'Aucun titre suggéré';
          }
          this.aiGenerating = false;
        },
        error: (error) => {
          this.errorMessage = 'Erreur: ' + error.message;
          this.aiGenerating = false;
        }
      });
  }

  private showTitleSuggestions(titles: string[]): void {
    // Créer une fenêtre modale simple
    const modal = document.createElement('div');
    modal.className = 'ai-modal';
    modal.innerHTML = `
    <div class="modal-content">
      <h3>Sélectionnez un titre suggéré</h3>
      <ul>
        ${titles.map((title, i) => `<li><button onclick="selectTitle(${i})">${title}</button></li>`).join('')}
      </ul>
      <button onclick="closeModal()">Annuler</button>
    </div>
  `;

    document.body.appendChild(modal);

    // Fonctions globales temporaires
    (window as any).selectTitle = (index: number) => {
      this.jobForm.patchValue({ title: titles[index] });
      this.closeModal();
    };

    (window as any).closeModal = () => {
      document.body.removeChild(modal);
      delete (window as any).selectTitle;
      delete (window as any).closeModal;
    };
  }

  private closeModal(): void {
    const modal = document.querySelector('.ai-modal');
    if (modal) {
      document.body.removeChild(modal);
    }
  }
// Dans job-form.component.ts - CORRIGEZ CETTE MÉTHODE
  generateRequirementsAI(): void {
    const responsibilities = this.jobForm.get('responsibilities')?.value;
    const title = this.jobForm.get('title')?.value;

    if (!responsibilities || responsibilities.trim().length < 20) {
      this.errorMessage = 'Les responsabilités doivent contenir au moins 20 caractères';
      return;
    }

    if (!title) {
      this.errorMessage = 'Le titre est requis';
      return;
    }

    this.aiGenerating = true;
    this.errorMessage = '';

    // CORRECTION : Utilisez AiSuggestionType.REQUIREMENTS
    this.aiService.generateSuggestion({
      type: AiSuggestionType.REQUIREMENTS, // CHANGEMENT ICI
      jobTitle: title,
      input: responsibilities,
      language: 'fr'
    }).subscribe({
      next: (response) => {
        if (response.success && response.suggestion) {
          this.jobForm.patchValue({
            requirements: response.suggestion
          });
        } else {
          this.errorMessage = response.errorMessage || 'Erreur lors de la génération des exigences';
        }
        this.aiGenerating = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur AI: ' + error.message;
        this.aiGenerating = false;
      }
    });
  }
}
