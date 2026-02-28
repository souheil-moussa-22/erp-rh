// src/app/components/ai-assistant/ai-assistant.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService, AiSuggestionType, AiStatusResponse, AiSuggestionResponse } from '../../services/ai.service';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.css']
})
export class AiAssistantComponent implements OnInit {
  private aiService = inject(AiService);

  // États
  loading = false;
  aiAvailable = false;
  statusMessage = '';

  // Inputs pour génération de description
  jobTitle = '';
  department = '';
  location = '';

  // Inputs pour suggestion de titres
  jobDescription = '';

  // Inputs pour amélioration de texte
  textToImprove = '';
  improvementContext = '';

  // Options
  selectedAction: 'description' | 'titles' | 'improve' = 'description';
  tone = 'professional';
  language = 'fr';

  // Résultats
  aiResult = '';
  aiSuggestions: string[] = [];
  errorMessage = '';

  ngOnInit(): void {
    this.checkAiStatus();
  }

  checkAiStatus(): void {
    this.loading = true;
    this.aiService.getStatus().subscribe({
      next: (status: AiStatusResponse) => {
        this.aiAvailable = status.available;
        this.statusMessage = status.available
          ? `✅ Service AI disponible (${status.modelInfo})`
          : '❌ Service AI indisponible';
        this.loading = false;
      },
      error: () => {
        this.aiAvailable = false;
        this.statusMessage = '❌ Erreur de connexion au service AI';
        this.loading = false;
      }
    });
  }

  generateDescription(): void {
    if (!this.jobTitle || !this.department || !this.location) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.aiService.generateJobDescription(this.jobTitle, this.department, this.location)
      .subscribe({
        next: (response: AiSuggestionResponse) => {
          if (response.success && response.suggestion) {
            this.aiResult = response.suggestion;
          } else {
            this.errorMessage = response.errorMessage || 'Erreur lors de la génération';
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.loading = false;
        }
      });
  }

  suggestTitles(): void {
    if (!this.jobDescription.trim()) {
      this.errorMessage = 'Veuillez entrer une description';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.aiService.suggestJobTitles(this.jobDescription)
      .subscribe({
        next: (titles: string[]) => { // CORRECTION: typer 'titles'
          this.aiSuggestions = titles || [];
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.loading = false;
        }
      });
  }

  improveText(): void {
    if (!this.textToImprove.trim()) {
      this.errorMessage = 'Veuillez entrer un texte à améliorer';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.aiService.improveText(this.textToImprove, this.improvementContext)
      .subscribe({
        next: (response: AiSuggestionResponse) => {
          if (response.success && response.suggestion) {
            this.aiResult = response.suggestion;
          } else {
            this.errorMessage = response.errorMessage || 'Erreur lors de l\'amélioration';
          }
          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.loading = false;
        }
      });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      alert('Texte copié dans le presse-papier!');
    }).catch(err => {
      console.error('Erreur lors de la copie:', err);
    });
  }

  clearResults(): void {
    this.aiResult = '';
    this.aiSuggestions = [];
    this.errorMessage = '';
  }

  setAction(action: 'description' | 'titles' | 'improve'): void {
    this.selectedAction = action;
    this.clearResults();
  }
}
