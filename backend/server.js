/*
 * server.js
 * 
 * Simple Express server that:
 * 1. Serves the test form page
 * 2. Collects form tracking data
 * 3. Provides analytics API for the dashboard
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Store the last 1000 form events in memory
let eventStorage = [];

app.use(cors());
app.use(express.json());

// Serve our static files (test form, tracking script, etc)
app.use(express.static(path.join(__dirname, 'public')));

// Save form events sent from the tracker
app.post('/api/tracker/event', (req, res) => {
  const eventData = req.body;
  console.log('Received event:', eventData);

  if (!eventData.timestamp) {
    eventData.timestamp = new Date().toISOString();
  }

  eventStorage.push(eventData);
  
  // Keep memory usage in check
  if (eventStorage.length > 1000) {
    eventStorage = eventStorage.slice(-1000);
  }

  res.status(200).json({ status: 'success', data: eventData });
});

// Process analytics data for the dashboard
function aggregateAnalytics(formId) {
  return new Promise((resolve, reject) => {
    setImmediate(() => {
      // Get all events for this form
      const formEvents = eventStorage.filter(e => e.formId === formId);
      const fieldIds = [...new Set(formEvents.filter(e => e.fieldId).map(e => e.fieldId))];

      // Calculate stats for each field
      const analytics = fieldIds.map(fieldId => {
        const fieldEvents = formEvents.filter(e => e.fieldId === fieldId);
        const focusEvents = fieldEvents.filter(e => e.eventType === 'fieldFocus');
        const blurEvents = fieldEvents.filter(e => e.eventType === 'fieldBlur');

        // How long do users pause on this field?
        const hesitationTimes = blurEvents
          .filter(e => e.metadata?.hesitationDuration)
          .map(e => e.metadata.hesitationDuration);
        const avgHesitation = hesitationTimes.length > 0
          ? hesitationTimes.reduce((sum, t) => sum + t, 0) / hesitationTimes.length
          : 0;

        // How often do users give up here?
        const abandonmentCount = focusEvents.filter(evt => {
          return !formEvents.some(e => e.eventType === 'formSubmit' && e.sessionId === evt.sessionId);
        }).length;

        return {
          fieldId,
          metrics: {
            totalInteractions: focusEvents.length,
            avgHesitation: Math.round(avgHesitation),
            abandonmentCount,
            abandonmentRate: focusEvents.length > 0
              ? Math.round((abandonmentCount / focusEvents.length) * 100)
              : 0
          }
        };
      });

      resolve(analytics);
    });
  });
}

// Get analytics for a specific form
app.get('/api/analytics/:formId', async (req, res) => {
  const formId = req.params.formId;
  try {
    const analytics = await aggregateAnalytics(formId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Show the test form by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
