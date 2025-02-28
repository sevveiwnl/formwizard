/*
 * formwizard-tracker.js
 * 
 * Tracks how users interact with forms on the page.
 * Records things like:
 * - When users start/finish filling out fields
 * - How long they take on each field
 * - If they leave without submitting
 */

(function() {
  document.addEventListener('DOMContentLoaded', function() {
    // Each form visit gets a unique ID
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    
    // Find forms on the page
    const forms = document.querySelectorAll('form');
    
    // Keep track of when users start filling out fields
    const focusTimestamps = {};

    // Save an event to storage and server
    function saveEvent(eventData) {
      const enrichedData = {
        ...eventData,
        timestamp: new Date().toISOString()
      };

      // Save to localStorage
      const existingEvents = JSON.parse(localStorage.getItem('formwizard_events') || '[]');
      existingEvents.push(enrichedData);
      localStorage.setItem('formwizard_events', JSON.stringify(existingEvents));
      
      // Also send to server if we're online
      if (navigator.onLine) {
        fetch('http://localhost:5001/api/tracker/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enrichedData)
        })
        .catch(error => console.error('Error sending to server:', error));
      }
    }

    // Set up tracking for each form
    forms.forEach(form => {
      const formId = form.getAttribute('id') || 'form_' + Math.random().toString(36).substr(2, 9);
      const fields = form.querySelectorAll('input, select, textarea');
      let interactionSequence = 0;

      // Track form submissions
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        saveEvent({
          sessionId,
          formId,
          eventType: 'formSubmit',
          metadata: {
            interactionSequence: ++interactionSequence,
            // Don't store actual values, just lengths (for privacy)
            formData: Object.fromEntries(
              Array.from(new FormData(form))
                .filter(([key]) => !key.toLowerCase().includes('password'))
                .map(([key, value]) => [key, typeof value === 'string' ? value.length : value])
            )
          }
        });
        
        // Small delay to make sure event is saved
        setTimeout(() => {
          form.submit();
        }, 300);
      });

      // Track each field in the form
      fields.forEach(field => {
        const fieldId = field.id || field.name || 'unknown';

        // When user starts filling out a field
        field.addEventListener('focus', () => {
          focusTimestamps[fieldId] = Date.now();
          saveEvent({
            sessionId,
            formId,
            fieldId,
            eventType: 'fieldFocus',
            metadata: {
              fieldType: field.type,
              interactionSequence: ++interactionSequence
            }
          });
        });

        // When user finishes with a field
        field.addEventListener('blur', () => {
          const hesitationDuration = Date.now() - (focusTimestamps[fieldId] || Date.now());
          saveEvent({
            sessionId,
            formId,
            fieldId,
            eventType: 'fieldBlur',
            metadata: {
              hesitationDuration,
              fieldType: field.type,
              fieldValue: field.value.length,
              interactionSequence: ++interactionSequence,
              isEmpty: field.value.length === 0
            }
          });
        });
      });
    });

    // Track when users leave without submitting
    window.addEventListener('beforeunload', () => {
      saveEvent({
        sessionId,
        eventType: 'pageExit',
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
    });
  });
})();

