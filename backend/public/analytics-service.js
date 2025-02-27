/**
 * FormWizard Analytics Service (Browser Version)
 * 
 * This script should be included in the browser before the dashboard loads
 * to provide analytics capabilities for localStorage data.
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
   * Filters events by time range
   * @param {Array} events - Events to filter
   * @param {string} timeRange - Time range (e.g., '24h', '7d', '30d')
   * @returns {Array} Events within the specified time range
   */
  filterByTimeRange: function(events, timeRange = '24h') {
    const cutoffTime = new Date(Date.now() - this.getTimeRangeMs(timeRange));
    return events.filter(event => {
      return new Date(event.timestamp) >= cutoffTime;
    });
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
            : 0,
          changeCount: fieldEvents.filter(event => event.eventType === 'fieldChanged').length
        }
      };
    });
    
    return fieldMetrics;
  },

  /**
   * Generates heatmap data from cursor positions
   * @param {string} formId - ID of the form to analyze
   * @param {string} timeRange - Time range to filter events
   * @returns {Array} Heatmap data points with x, y coordinates and intensity values
   */
  generateHeatmap: function(formId, timeRange = '24h') {
    // Get events for the form
    let events = this.getFormEvents(formId);
    
    // Apply time range filter
    events = this.filterByTimeRange(events, timeRange);
    
    return this.processHeatmapData(events);
  },

  /**
   * Processes events to extract heatmap data points
   * @param {Array} events - Form interaction events
   * @returns {Array} Processed heatmap data
   */
  processHeatmapData: function(events) {
    // Reduce events to count occurrences at each position
    const heatmapData = events.reduce((acc, event) => {
      if (event.metadata?.cursorPosition) {
        const { x, y } = event.metadata.cursorPosition;
        // Skip invalid positions
        if (!isNaN(x) && !isNaN(y)) {
          const key = `${Math.floor(x)},${Math.floor(y)}`;
          acc[key] = (acc[key] || 0) + 1;
        }
      }
      return acc;
    }, {});

    // Convert to format expected by heatmap.js
    return Object.entries(heatmapData).map(([pos, value]) => {
      const [x, y] = pos.split(',').map(Number);
      return { x, y, value };
    });
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
          longHesitation: field.metrics.avgHesitation > 5000,
          excessiveChanges: field.metrics.changeCount > 10
        },
        metrics: field.metrics
      }));
  },

  /**
   * Converts a time range string to milliseconds
   * @param {string} range - Time range (e.g., '24h', '7d', '30d')
   * @returns {number} Time range in milliseconds
   */
  getTimeRangeMs: function(range) {
    const ranges = {
      '24h': 86400000,     // 24 hours in ms
      '7d': 604800000,     // 7 days in ms
      '30d': 2592000000    // 30 days in ms
    };
    return ranges[range] || ranges['24h'];
  },

  /**
   * Clears all stored events (for testing/privacy)
   */
  clearEvents: function() {
    localStorage.removeItem('formwizard_events');
    console.log('FormWizard events cleared from localStorage');
  },
  
  /**
   * Generate sample data for testing
   */
  generateSampleData: function(formId = 'testForm') {
    const sessionId = 'sample_' + Math.random().toString(36).substr(2, 9);
    const fieldIds = ['username', 'email', 'password', 'role', 'bio'];
    const now = new Date();
    
    // Clear existing events
    this.clearEvents();
    
    // Create sample events
    const events = [];
    
    // Focus and blur events for each field
    fieldIds.forEach((fieldId, index) => {
      // Focus event
      events.push({
        sessionId,
        formId,
        fieldId,
        eventType: 'fieldFocus',
        timestamp: new Date(now.getTime() - (10000 * (fieldIds.length - index))).toISOString(),
        metadata: {
          fieldType: fieldId === 'role' ? 'select' : fieldId === 'bio' ? 'textarea' : 'text',
          cursorPosition: { x: 100 + Math.random() * 400, y: 100 + index * 80 + Math.random() * 20 },
          interactionSequence: index * 2 + 1
        }
      });
      
      // Blur event with hesitation
      events.push({
        sessionId,
        formId,
        fieldId,
        eventType: 'fieldBlur',
        timestamp: new Date(now.getTime() - (10000 * (fieldIds.length - index)) + 3000).toISOString(),
        metadata: {
          hesitationDuration: 3000 + Math.random() * 4000,
          fieldType: fieldId === 'role' ? 'select' : fieldId === 'bio' ? 'textarea' : 'text',
          fieldValue: 10,
          cursorPosition: { x: 100 + Math.random() * 400, y: 100 + index * 80 + Math.random() * 20 },
          interactionSequence: index * 2 + 2
        }
      });
    });
    
    for (let i = 0; i < 100; i++) {  // Increase from 50 to 100
      events.push({
        sessionId,
        formId,
        eventType: 'mouseMove',
        timestamp: new Date(now.getTime() - (Math.random() * 20000)).toISOString(),
        metadata: {
          cursorPosition: { 
            x: Math.random() * 600,  // Cover more of the screen
            y: Math.random() * 500   // Cover more of the screen
          }
        }
      });
    }

    
    // Add form submission
    events.push({
      sessionId,
      formId,
      eventType: 'formSubmit',
      timestamp: new Date().toISOString(),
      metadata: {
        interactionSequence: fieldIds.length * 2 + 1
      }
    });
    
    // Store in localStorage
    localStorage.setItem('formwizard_events', JSON.stringify(events));
    console.log('Generated sample data for FormWizard:', events.length, 'events');
    
    return events;
  }
};

console.log('FormWizard Analytics Service loaded in browser');