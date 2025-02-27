/**
 * FormWizard Tracking script 
 * 
 * Tracks user interactions with forms and stores the data in local Storage
 * Monitors events such as field focus, blur, and form submissions
 * Operates as a immediately invoked funciton expression 
 */

(function() {
  document.addEventListener('DOMContentLoaded', function() {

    //generate unique session ID
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    
    //find all the forms on the page
    const forms = document.querySelectorAll('form');
    
    //Store timestamps when users focus on fields to measure hesitation time
    const focusTimestamps = {};

    /**
     * Collects information about the user's device
     * @returns {Object} Device information including screen size, device type, and browser
     */
    function getDeviceInfo() {
      return {
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        browser: navigator.userAgent
      };
    }

    /**
     * Saves an event to localStorage
     * @param {Object} eventData - Data about the form interaction event
     */
    function saveEvent(eventData) {
      // Enrich the event data with device information
      const enrichedData = {
        ...eventData,
        metadata: {
          ...eventData.metadata,
          deviceInfo: getDeviceInfo()
        },
        timestamp: new Date().toISOString() // Add timestamp
      };

      console.log('Saving event:', enrichedData);

      // Get existing events from localStorage or initialize empty array
      const existingEvents = JSON.parse(localStorage.getItem('formwizard_events') || '[]');
      
      // Add new event to array
      existingEvents.push(enrichedData);
      
      // Save back to localStorage
      localStorage.setItem('formwizard_events', JSON.stringify(existingEvents));
      
      // Optionally send event to server if online
      if (navigator.onLine) {
        fetch('http://localhost:5001/api/tracker/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(enrichedData)
        })
        .catch(error => console.error('Error sending to server:', error));
      }
    }

    // Track cursor position for heatmap data
    let cursorPosition = { x: 0, y: 0 };
    document.addEventListener('mousemove', (e) => {
      cursorPosition = { x: e.clientX, y: e.clientY };
    });

    // Add event listeners to each form
    forms.forEach(form => {
      // Generate or get form ID
      const formId = form.getAttribute('id') || 'form_' + Math.random().toString(36).substr(2, 9);
      
      // Find all input elements in the form
      const fields = form.querySelectorAll('input, select, textarea');
      
      // Track interaction sequence for analyzing user flow
      let interactionSequence = 0;

      // Add form submit event listener
      form.addEventListener('submit', (e) => {
        // Prevent default form submission to capture data first
        e.preventDefault();
        console.log('Form submitted');
        
        // Record form submission event
        saveEvent({
          sessionId,
          formId,
          eventType: 'formSubmit',
          metadata: {
            interactionSequence: ++interactionSequence,
            // Capture form data (excluding sensitive fields)
            formData: Object.fromEntries(
              Array.from(new FormData(form))
                .filter(([key]) => !key.toLowerCase().includes('password'))
                .map(([key, value]) => [key, typeof value === 'string' ? value.length : value])
            )
          }
        });
        
        // Allow form submission after short delay to ensure data is saved
        setTimeout(() => {
          // form.submit(); // Uncomment to actually submit the form
          console.log('Form would be submitted now');
        }, 300);
      });

      // Add event listeners to each field in the form
      fields.forEach(field => {
        const fieldId = field.id || field.name || 'unknown';

        // Track when users focus on a field
        field.addEventListener('focus', () => {
          console.log('Field focus:', fieldId);
          focusTimestamps[fieldId] = Date.now();
          saveEvent({
            sessionId,
            formId,
            fieldId,
            eventType: 'fieldFocus',
            metadata: {
              fieldType: field.type,
              cursorPosition,
              interactionSequence: ++interactionSequence
            }
          });
        });

        // Track when users leave a field
        field.addEventListener('blur', () => {
          console.log('Field blur:', fieldId);
          // Calculate how long the user spent on this field
          const hesitationDuration = Date.now() - (focusTimestamps[fieldId] || Date.now());
          saveEvent({
            sessionId,
            formId,
            fieldId,
            eventType: 'fieldBlur',
            metadata: {
              hesitationDuration,
              fieldType: field.type,
              // Store only the length of values for privacy
              fieldValue: field.value.length,
              cursorPosition,
              interactionSequence: ++interactionSequence,
              // Detect if field was left empty
              isEmpty: field.value.length === 0
            }
          });
        });

        // Track changes to detect corrections
        let changeCount = 0;
        field.addEventListener('input', () => {
          // Only track the change count, not every keystroke
          changeCount++;
          // Update change count every 5 changes to avoid excessive events
          if (changeCount % 5 === 0) {
            saveEvent({
              sessionId,
              formId,
              fieldId,
              eventType: 'fieldChanged',
              metadata: {
                changeCount,
                interactionSequence: ++interactionSequence
              }
            });
          }
        });
      });
    });

    // Track when users abandon the form by leaving the page
    window.addEventListener('beforeunload', () => {
      // Record form abandonment
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

