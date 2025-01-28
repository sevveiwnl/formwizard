(function() {
  // Ensure the script runs after the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Connect to the Socket.io server
    const socket = io('http://localhost:5001', { path: '/socket.io' });

    // Generate a unique session ID
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);

    // Identify all forms on the page
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      const formId = form.getAttribute('id') || 'form_' + Math.random().toString(36).substr(2, 9);

      // Attach event listeners to form fields
      const fields = form.querySelectorAll('input, select, textarea');

      fields.forEach(field => {
        field.addEventListener('focus', () => {
          socket.emit('fieldFocus', {
            sessionId,
            formId,
            fieldId: field.id || field.name || 'unknown',
            timestamp: new Date().toISOString()
          });
        });

        field.addEventListener('blur', () => {
          socket.emit('fieldBlur', {
            sessionId,
            formId,
            fieldId: field.id || field.name || 'unknown',
            timestamp: new Date().toISOString()
          });
        });
      });

      // Track form submission
      form.addEventListener('submit', () => {
        socket.emit('formSubmit', {
          sessionId,
          formId,
          timestamp: new Date().toISOString()
        });
      });

      // Track form abandonment (when user navigates away without submitting)
      window.addEventListener('beforeunload', () => {
        socket.emit('formAbandon', {
          sessionId,
          formId,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
})();
