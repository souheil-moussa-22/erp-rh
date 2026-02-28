import {Component, OnInit, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
  time: string;
  confidence?: number;
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.html',
  standalone: true,
  styleUrls: ['./chatbot.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;
  @ViewChild('questionInput') private questionInput!: ElementRef;
  @Output() close = new EventEmitter<void>();

  messages: ChatMessage[] = [];
  quickQuestions = [
    'Comment demander un congé annuel ?',
    'Quand est versé le salaire ?',
    'Comment contacter le service RH ?',
    'Que faire en cas de maladie ?'
  ];

  faqSuggestions = [
    { icon: 'fa-calendar-alt', text: 'Jours de congé', question: 'Combien de jours de congé ai-je par an ?' },
    { icon: 'fa-heartbeat', text: 'Congé maladie', question: 'Que faire en cas de maladie ?' },
    { icon: 'fa-file-contract', text: 'Certificat travail', question: 'Comment obtenir un certificat de travail ?' },
    { icon: 'fa-exclamation-triangle', text: 'Problème paie', question: 'Comment signaler un problème de paie ?' }
  ];

  chatForm: FormGroup;
  isTyping = false;
  currentTime = '';

  constructor(private fb: FormBuilder) {
    this.chatForm = this.fb.group({
      question: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.updateCurrentTime();
    setInterval(() => this.updateCurrentTime(), 60000);

    // Focus sur l'input au démarrage
    setTimeout(() => {
      if (this.questionInput) {
        this.questionInput.nativeElement.focus();
      }
    }, 500);
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  updateCurrentTime(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  sendMessage(): void {
    if (this.chatForm.invalid) {
      // Shake animation pour indiquer une erreur
      const input = this.questionInput.nativeElement;
      input.style.animation = 'shake 0.5s';
      setTimeout(() => {
        input.style.animation = '';
      }, 500);
      return;
    }

    const question = this.chatForm.get('question')?.value.trim();
    if (!question) return;

    this.addUserMessage(question);
    this.chatForm.reset();

    this.isTyping = true;

    // Simulation de réponse
    setTimeout(() => {
      this.isTyping = false;
      const answer = this.getSimulatedResponse(question);
      this.addBotMessage(answer);
    }, 1000 + Math.random() * 1000); // Variation du temps de réponse

    // Remettre le focus sur l'input
    setTimeout(() => {
      if (this.questionInput) {
        this.questionInput.nativeElement.focus();
      }
    }, 100);
  }

  insertQuestion(question: string): void {
    // Mettre la question dans le formulaire
    this.chatForm.patchValue({ question });

    // Valider le formulaire
    this.chatForm.get('question')?.markAsTouched();

    // Envoyer après un court délai pour l'effet visuel
    setTimeout(() => {
      this.sendMessage();
    }, 200);
  }

  private addUserMessage(text: string): void {
    const newMessage: ChatMessage = {
      text,
      sender: 'user',
      time: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.messages.push(newMessage);
  }

  private addBotMessage(text: string): void {
    const newMessage: ChatMessage = {
      text,
      sender: 'bot',
      time: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    this.messages.push(newMessage);
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.chatMessagesContainer) {
          this.chatMessagesContainer.nativeElement.scrollTop =
            this.chatMessagesContainer.nativeElement.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Erreur lors du scroll:', err);
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private getSimulatedResponse(question: string): string {
    question = question.toLowerCase();

    if (question.includes('congé') || question.includes('vacance') || question.includes('repos')) {
      return 'Vous pouvez demander un congé via la plateforme RH ou en contactant votre responsable. Les congés doivent être posés avec un préavis de 15 jours minimum. Pour les congés payés, vous avez droit à 25 jours par an.';
    }

    if (question.includes('salaire') || question.includes('paie') || question.includes('paiement')) {
      return 'Le salaire est versé le 28 de chaque mois sur votre compte bancaire. Si vous constatez une anomalie, contactez le service paie à paie@entreprise.com dans les 48h suivant le versement.';
    }

    if (question.includes('maladie') || question.includes('santé') || question.includes('arrêt')) {
      return 'En cas de maladie, vous devez : 1) Informer votre responsable dans les 24h, 2) Fournir un certificat médical dans les 48h, 3) Envoyer l\'arrêt de travail au service RH. Pendant les 3 premiers jours, l\'entreprise paie 90% du salaire.';
    }

    if (question.includes('rh') || question.includes('ressource') || question.includes('contact')) {
      return 'Service RH disponible : 📧 Email : rh@entreprise.com 📞 Téléphone : 01 23 45 67 89 🏢 Bureau : Bâtiment A, 3ème étage, porte 302 📅 Rendez-vous : via l\'intranet > RH > Planning';
    }

    if (question.includes('télétravail') || question.includes('remote') || question.includes('domicile')) {
      return 'Le télétravail est possible 2 jours par semaine maximum, avec accord préalable du manager. Une charte de télétravail est disponible sur l\'intranet. Matériel fourni : ordinateur portable et casque.';
    }

    if (question.includes('formation') || question.includes('cours') || question.includes('apprentissage')) {
      return 'Chaque employé dispose d\'un budget formation de 1500€ par an. Les formations sont disponibles sur la plateforme "RH Learning". Pour une formation externe, soumettez une demande à votre manager avec devis.';
    }

    return `Merci pour votre question : "${question}".

Je ne trouve pas de réponse précise dans ma base de données. Pour une réponse personnalisée :
1. Contactez directement le service RH à rh@entreprise.com
2. Consultez le guide RH sur l'intranet
3. Prenez rendez-vous avec votre référent RH

Y a-t-il autre chose dont vous avez besoin ?`;
  }

  getQuickQuestionLabel(question: string): string {
    if (question.includes('congé')) return 'Congés';
    if (question.includes('salaire')) return 'Salaires';
    if (question.includes('RH')) return 'Contact RH';
    if (question.includes('maladie')) return 'Maladie';
    return 'Question';
  }

  closeChatbot(): void {
    this.close.emit();
  }
}
