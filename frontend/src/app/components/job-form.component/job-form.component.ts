import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobOfferService, JobOfferRequest } from '../../services/job-offer.service';
import { AuthService } from '../../services/auth.service';
import {AiService, AiSuggestionRequest, AiSuggestionType} from '../../services/ai.service';

@Component({
  selector: 'app-job-form',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './job-form.component.html',
  styleUrl: './job-form.component.css',
})
export class JobFormComponent implements OnInit {
  jobForm: FormGroup;
  isEdit = false;
  jobId: string | null = null;
  loading = false;
  submitting = false;
  aiGenerating = false; // AJOUTER
  errorMessage: string = '';

  contractTypes = ['CDI', 'CDD', 'FREELANCE', 'INTERNSHIP', 'PART_TIME'];
  experienceLevels = ['JUNIOR', 'MID', 'SENIOR'];
  educationLevels = ['BAC', 'BAC+2', 'BAC+3', 'BAC+5', 'DOCTORATE'];

  currentTags: string[] = [];
  tagInput: string = '';

  constructor(
    private fb: FormBuilder,
    private jobService: JobOfferService,
    private authService: AuthService,
    private aiService: AiService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.jobForm = this.createForm();
  }
// Dans ngOnInit(), ajoutez un écouteur pour le champ title
  ngOnInit(): void {
    console.log('🔐 JobFormComponent - Initialisation');
    this.detectFormMode();
    this.debugFormMode();

    // Écouter les changements du titre pour générer des suggestions
    this.jobForm.get('title')?.valueChanges.subscribe(() => {
      // Vous pouvez activer cette fonction si vous voulez des suggestions automatiques
      // this.onTitleChange();
    });
  }

  private detectFormMode(): void {
    this.jobId = this.route.snapshot.paramMap.get('id');
    const currentUrl = this.router.url;
    this.isEdit = currentUrl.includes('/edit') && !!this.jobId;

    if (this.isEdit && this.jobId) {
      console.log('🔄 Mode ÉDITION détecté - Chargement de l\'offre:', this.jobId);
      this.loadJobOffer();
    } else {
      console.log('🆕 Mode CRÉATION détecté');
      this.isEdit = false;
      this.jobId = null;
    }
  }

  private debugFormMode(): void {
    console.log('🔍 Debug Form Mode:');
    console.log('  - URL complète:', this.router.url);
    console.log('  - ID depuis route:', this.jobId);
    console.log('  - Mode Édition:', this.isEdit);
    console.log('  - User connecté:', this.authService.isLoggedIn());
    console.log('  - Rôles user:', this.authService.getUserRoles());
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
      console.error('❌ Impossible de charger l\'offre: jobId est null');
      this.errorMessage = 'ID d\'offre non valide';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    console.log('🔄 Chargement de l\'offre avec ID:', this.jobId);

    this.jobService.getJobOfferById(this.jobId).subscribe({
      next: (job) => {
        console.log('✅ Offre chargée avec succès:', job);

        // Méthode plus simple avec try-catch
        let closingDate = '';
        try {
          if (job.closingDate) {
            // Essayer de créer une Date à partir de la valeur
            const date = new Date(job.closingDate);
            if (!isNaN(date.getTime())) {
              closingDate = date.toISOString().split('T')[0];
            }
          }
        } catch (error) {
          console.warn('⚠️ Erreur lors du formatage de la date:', error);
        }

        console.log('🔍 Date formatée:', closingDate);

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
        console.log('✅ Formulaire rempli avec les données de l\'offre');
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'offre:', error);
        this.errorMessage = `Erreur lors du chargement: ${error.message}`;
        this.loading = false;
      }
    });
  }
  onSubmit(): void {
    console.log('📤 Soumission du formulaire:');
    console.log('  - Mode:', this.isEdit ? 'ÉDITION' : 'CRÉATION');
    console.log('  - ID:', this.jobId);
    console.log('  - Formulaire valide:', this.jobForm.valid);

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
        isActive: true
      };

      console.log('📦 Données à envoyer:', request);

      if (this.isEdit && this.jobId) {
        console.log('🔄 Mise à jour de l\'offre:', this.jobId);
        this.jobService.updateJobOffer(this.jobId, request).subscribe({
          next: (response) => {
            console.log('✅ Offre mise à jour avec succès:', response.title);
            this.submitting = false;
            alert('Offre mise à jour avec succès!');
            this.router.navigate(['/jobs']);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la mise à jour:', error);
            this.errorMessage = `Erreur lors de la mise à jour: ${error.message}`;
            this.submitting = false;
          }
        });
      } else {
        console.log('🆕 Création d\'une nouvelle offre');
        const publisherId = this.getCurrentUserId();
        if (!publisherId) {
          this.errorMessage = 'Utilisateur non connecté';
          this.submitting = false;
          return;
        }

        this.jobService.createJobOffer(request, publisherId).subscribe({
          next: (response) => {
            console.log('✅ Offre créée avec succès:', response.title);
            this.submitting = false;
            alert('Offre créée avec succès!');
            this.router.navigate(['/jobs']);
          },
          error: (error) => {
            console.error('❌ Erreur lors de la création:', error);
            this.errorMessage = `Erreur lors de la création: ${error.message}`;
            this.submitting = false;
          }
        });
      }
    } else {
      console.log('❌ Formulaire invalide');
      this.markFormGroupTouched();
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire';
      this.checkFormValidity();
    }
  }
// Ajoutez cette méthode pour générer des suggestions basées sur le titre
  onTitleChange(): void {
    const title = this.jobForm.get('title')?.value;
    if (title && title.length > 3) {
      // Optionnel: mettre en place un debounce pour éviter trop d'appels
      setTimeout(() => {
        this.generateDescriptionFromTitle();
      }, 500);
    }
  }

// Nouvelle méthode pour générer une description basée sur le titre
  generateDescriptionFromTitle(): void {
    const title = this.jobForm.get('title')?.value;
    if (!title) return;

    this.aiGenerating = true;

    // Utiliser le service AI avec un prompt spécifique
    const request: AiSuggestionRequest = {
      type: AiSuggestionType.JOB_DESCRIPTION,
      jobTitle: title,
      language: 'fr'
    };

    this.aiService.generateSuggestion(request).subscribe({
      next: (response) => {
        if (response.success && response.suggestion) {
          this.jobForm.patchValue({
            description: response.suggestion
          });
        }
        this.aiGenerating = false;
      },
      error: (error) => {
        console.error('Erreur AI:', error);
        this.aiGenerating = false;
      }
    });
  }


  checkFormValidity(): void {
    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      if (control?.invalid) {
        console.log(`Champ invalide: ${key}`, {
          errors: control.errors,
          value: control.value
        });
      }
    });
  }

  private getCurrentUserId(): string {
    const currentUser = this.authService.getUser();
    if (currentUser && currentUser.id) {
      console.log('🔑 ID utilisateur trouvé:', currentUser.id);
      return currentUser.id;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔑 ID utilisateur depuis localStorage:', user.id);
        return user.id;
      } catch (error) {
        console.error('❌ Erreur parsing user data:', error);
      }
    }

    throw new Error('Aucun utilisateur connecté. Veuillez vous connecter d\'abord.');
  }

  markFormGroupTouched(): void {
    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.jobForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'Ce champ est requis';
      if (field.errors['minlength']) return `Longueur minimale: ${field.errors['minlength'].requiredLength} caractères`;
      if (field.errors['pastDate']) return 'La date doit être dans le futur';
    }
    return '';
  }

  checkFormStatus(): void {
    console.log('🔍 État du formulaire:');
    console.log('  - Mode:', this.isEdit ? 'ÉDITION' : 'CRÉATION');
    console.log('  - ID:', this.jobId);
    console.log('  - Formulaire valide:', this.jobForm.valid);
    console.log('  - Formulaire touché:', this.jobForm.touched);
    console.log('  - Formulaire modifié:', this.jobForm.dirty);

    Object.keys(this.jobForm.controls).forEach(key => {
      const control = this.jobForm.get(key);
      console.log(`  - ${key}: valide=${control?.valid}, touché=${control?.touched}, valeur=`, control?.value);
    });
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

  // ========== MÉTHODES AI ==========

  generateDescriptionAI(): void {
    const title = this.jobForm.get('title')?.value;
    const department = this.jobForm.get('department')?.value;
    const location = this.jobForm.get('location')?.value;

    if (!title || !department || !location) {
      this.errorMessage = 'Veuillez d\'abord remplir le titre, département et localisation';
      return;
    }

    this.aiGenerating = true;
    this.errorMessage = '';

    this.aiService.generateJobDescription(title, department, location)
      .subscribe({
        next: (response) => {
          if (response.success && response.suggestion) {
            this.jobForm.patchValue({
              description: response.suggestion
            });
          } else {
            this.errorMessage = response.errorMessage || 'Erreur lors de la génération AI';
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
