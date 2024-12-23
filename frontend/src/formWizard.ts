// frontend/src/tracking/formWizard.ts
export class FormWizard {
  private formId: string;
  private apiUrl: string;

  constructor(formId: string, apiUrl: string = 'http://localhost:3001') {
    this.formId = formId;
    this.apiUrl = apiUrl;
    this.init();
  }

  private init() {
    // Find all forms in the document
    document.querySelectorAll('form').forEach(form => {
      if (form.id === this.formId) {
        this.attachFormListeners(form);
      }
    });
  }

  private attachFormListeners(form: HTMLFormElement) {
    // Track form start
    form.addEventListener('focusin', () => {
      this.trackEvent('start');
    }, { once: true });

    // Track form submission
    form.addEventListener('submit', (e) => {
      this.trackEvent('complete');
    });

    // Track form abandonment
    window.addEventListener('beforeunload', () => {
      if (form.querySelector(':focus')) {
        this.trackEvent('abandon');
      }
    });
  }

  private async trackEvent(eventType: 'start' | 'complete' | 'abandon') {
    try {
      await fetch(`${this.apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: this.formId,
          eventType,
          timestamp: new Date(),
          metadata: {
            url: window.location.href,
            userAgent: navigator.userAgent
          }
        })
      });
    } catch (error) {
      console.error('FormWizard tracking error:', error);
    }
  }
}