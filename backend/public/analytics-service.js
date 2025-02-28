/*
 * analytics-service.js
 * 
 * A simple browser script that processes form analytics data from localStorage.
 * Used by the dashboard to show stats about form usage and problem areas.
 */

// Create a global AnalyticsService object that can be accessed by the dashboard
window.AnalyticsService = {
  /**
   * Retrieves all form events from localStorage
   * @returns {Array} Array of form events
   */
  getEvents: function() {
    try {
      return JSON.parse(localStorage.getItem('formwizard_events') || '[]');
    } catch (error) {
      console.error('Error parsing events from localStorage:', error);
      return [];
    }
  },

  /**
   * Gets events for a specific form
   * @param {string} formId - ID of the form to analyze
   * @returns {Array} Events filtered for the specific form
   */
  getFormEvents: function(formId) {
    const events = this.getEvents();
    return events.filter(event => event.formId === formId);
  },

  /**
   * Generates analytics for a specific form
   * @param {string} formId - ID of the form to analyze
   * @returns {Object} Form analytics including field metrics and completion rates
   */
  getFormAnalytics: function(formId) {
    const events = this.getFormEvents(formId);
    
    // If no events, return empty array
    if (events.length === 0) return [];
    
    // Extract unique field IDs
    const fieldIds = [...new Set(events
      .filter(event => event.fieldId)
      .map(event => event.fieldId))];
    
    // Calculate metrics for each field
    const fieldMetrics = fieldIds.map(fieldId => {
      const fieldEvents = events.filter(event => event.fieldId === fieldId);
      
      // Focus/blur events for this field
      const focusEvents = fieldEvents.filter(event => event.eventType === 'fieldFocus');
      const blurEvents = fieldEvents.filter(event => event.eventType === 'fieldBlur');
      
      // Calculate average hesitation time
      const hesitationTimes = blurEvents
        .filter(event => event.metadata?.hesitationDuration)
        .map(event => event.metadata.hesitationDuration);
      
      const avgHesitation = hesitationTimes.length > 0 
        ? hesitationTimes.reduce((sum, time) => sum + time, 0) / hesitationTimes.length 
        : 0;
      
      // Calculate abandonment count (fields with focus but no submission)
      const abandonmentCount = fieldEvents.filter(event => {
        return event.eventType === 'fieldFocus' && 
               !events.some(e => e.eventType === 'formSubmit' && 
                            e.sessionId === event.sessionId);
      }).length;
      
      return {
        fieldId,
        metrics: {
          totalInteractions: focusEvents.length,
          avgHesitation: Math.round(avgHesitation * 100) / 100,
          abandonmentCount: abandonmentCount,
          abandonmentRate: focusEvents.length > 0 
            ? Math.round((abandonmentCount / focusEvents.length) * 100) 
            : 0
        }
      };
    });
    
    return fieldMetrics;
  },

  /**
   * Identifies problematic fields in a form
   * @param {string} formId - ID of the form to analyze
   * @returns {Array} List of problematic fields with reasons
   */
  identifyProblematicFields: function(formId) {
    const analytics = this.getFormAnalytics(formId);
    
    // Find fields with high abandonment or hesitation
    return analytics
      .filter(field => {
        return field.metrics.abandonmentRate > 30 || // High abandonment
               field.metrics.avgHesitation > 5000;   // Long hesitation (5s+)
      })
      .map(field => ({
        fieldId: field.fieldId,
        issues: {
          highAbandonment: field.metrics.abandonmentRate > 30,
          longHesitation: field.metrics.avgHesitation > 5000
        },
        metrics: field.metrics
      }));
  },

  /**
   * Clears all stored events (for testing/privacy)
   */
  clearEvents: function() {
    localStorage.removeItem('formwizard_events');
    console.log('FormWizard events cleared from localStorage');
  }
};

console.log('Analytics service ready');