import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  organizationId: string;
}

export interface IndeedConfig {
  publisherId: string;
  apiKey: string;
}

export interface LinkedInPostResponse {
  id: string;
  activity: string;
  created: {
    actor: string;
    time: number;
  };
}

export interface IndeedPostResponse {
  jobKey: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExternalApisService {
  private linkedInApiUrl = 'https://api.linkedin.com/v2';
  private indeedApiUrl = 'https://api.indeed.com/ads/apisearch';

  private linkedInConfig: LinkedInConfig = {
    clientId: '',
    clientSecret: '',
    accessToken: '',
    organizationId: ''
  };

  private indeedConfig: IndeedConfig = {
    publisherId: '',
    apiKey: ''
  };

  constructor(private http: HttpClient) { }

  // Configuration methods
  setLinkedInConfig(config: LinkedInConfig): void {
    this.linkedInConfig = config;
    localStorage.setItem('linkedin_config', JSON.stringify(config));
  }

  setIndeedConfig(config: IndeedConfig): void {
    this.indeedConfig = config;
    localStorage.setItem('indeed_config', JSON.stringify(config));
  }

  loadConfigFromStorage(): void {
    const linkedinConfig = localStorage.getItem('linkedin_config');
    const indeedConfig = localStorage.getItem('indeed_config');
    
    if (linkedinConfig) {
      this.linkedInConfig = JSON.parse(linkedinConfig);
    }
    if (indeedConfig) {
      this.indeedConfig = JSON.parse(indeedConfig);
    }
  }

  // LinkedIn API Methods
  postToLinkedIn(jobOffer: any): Observable<LinkedInPostResponse> {
    if (!this.linkedInConfig.accessToken) {
      return throwError(() => new Error('LinkedIn access token not configured'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.linkedInConfig.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0'
    });

    const postData = {
      author: `urn:li:organization:${this.linkedInConfig.organizationId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: this.formatLinkedInPost(jobOffer)
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };

    return this.http.post<LinkedInPostResponse>(
      `${this.linkedInApiUrl}/ugcPosts`,
      postData,
      { headers }
    ).pipe(catchError(this.handleError));
  }

  private formatLinkedInPost(jobOffer: any): string {
    return `🎯 Nous recrutons ! ${jobOffer.title}

📍 ${jobOffer.location}
📝 ${jobOffer.contractType}
🏢 ${jobOffer.department}

${jobOffer.description.substring(0, 200)}...

📋 Responsabilités:
${jobOffer.responsibilities.substring(0, 150)}...

🎯 Profil recherché:
${jobOffer.requirements.substring(0, 150)}...

📅 Date de clôture: ${new Date(jobOffer.closingDate).toLocaleDateString('fr-FR')}

👉 Postulez maintenant !

#recrutement #emploi #${jobOffer.department?.replace(/\s+/g, '')} #${jobOffer.contractType}`
  }

  // Indeed API Methods
  postToIndeed(jobOffer: any): Observable<IndeedPostResponse> {
    if (!this.indeedConfig.publisherId || !this.indeedConfig.apiKey) {
      return throwError(() => new Error('Indeed configuration incomplete'));
    }

    const params = {
      publisher: this.indeedConfig.publisherId,
      v: '2',
      format: 'json',
      jobtitle: jobOffer.title,
      company: 'Votre Entreprise',
      location: jobOffer.location,
      description: this.formatIndeedDescription(jobOffer),
      salary: '',
      start: 0,
      limit: 1,
      fromage: '',
      highlight: '',
      filter: '',
      latlong: '',
      co: 'fr',
      chnl: '',
      userip: '1.2.3.4',
      useragent: 'Mozilla/5.0'
    };

    return this.http.get<IndeedPostResponse>(this.indeedApiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  private formatIndeedDescription(jobOffer: any): string {
    return `
      <h3>Description du poste</h3>
      <p>${jobOffer.description}</p>
      
      <h3>Responsabilités</h3>
      <p>${jobOffer.responsibilities}</p>
      
      <h3>Exigences</h3>
      <p>${jobOffer.requirements}</p>
      
      <h3>Avantages</h3>
      <p>${jobOffer.benefits}</p>
      
      <h3>Type de contrat</h3>
      <p>${jobOffer.contractType}</p>
      
      <h3>Niveau d'expérience</h3>
      <p>${jobOffer.experienceLevel}</p>
    `;
  }

  // Test connection methods
  testLinkedInConnection(): Observable<any> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.linkedInConfig.accessToken}`
    });

    return this.http.get(`${this.linkedInApiUrl}/me`, { headers })
      .pipe(catchError(this.handleError));
  }

  testIndeedConnection(): Observable<any> {
    return this.postToIndeed({
      title: 'Test Connection',
      location: 'Paris',
      description: 'Test',
      responsibilities: 'Test',
      requirements: 'Test',
      benefits: 'Test',
      contractType: 'CDI'
    });
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    let errorMessage = 'Erreur de connexion avec la plateforme externe';
    
    if (error.error && error.error.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Token d\'accès invalide ou expiré';
    } else if (error.status === 403) {
      errorMessage = 'Permissions insuffisantes';
    }
    
    return throwError(() => new Error(errorMessage));
  }
}