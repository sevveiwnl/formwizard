/**
 * backend/server.js
 */
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// In-memory storage for events
let eventStorage = [];

app.use(cors());
app.use(express.json());

// Serve static files (test.html, formwizard-tracker.js, analytics-service.js)
app.use(express.static(path.join(__dirname, 'public')));

// POST /api/tracker/event - store event in memory
app.post('/api/tracker/event', (req, res) => {
  const eventData = req.body;
  console.log('Received event:', eventData);

  if (!eventData.timestamp) {
    eventData.timestamp = new Date().toISOString();
  }

  eventStorage.push(eventData);
  // Keep the last 1000 events to avoid memory issues
  if (eventStorage.length > 1000) {
    eventStorage = eventStorage.slice(-1000);
  }

  res.status(200).json({ status: 'success', data: eventData });
});

// GET /api/analytics/:formId
app.get('/api/analytics/:formId', (req, res) => {
  const formId = req.params.formId;
  const formEvents = eventStorage.filter(e => e.formId === formId);

  // Build analytics similar to window.AnalyticsService
  // (Focus on basic hesitation, abandonment, etc.)
  const fieldIds = [...new Set(formEvents
    .filter(e => e.fieldId)
    .map(e => e.fieldId))];

  const analytics = fieldIds.map(fieldId => {
    const fieldEvents = formEvents.filter(e => e.fieldId === fieldId);
    const focusEvents = fieldEvents.filter(e => e.eventType === 'fieldFocus');
    const blurEvents = fieldEvents.filter(e => e.eventType === 'fieldBlur');

    // Average hesitation
    const hesitationTimes = blurEvents
      .filter(e => e.metadata?.hesitationDuration)
      .map(e => e.metadata.hesitationDuration);
    const avgHesitation = hesitationTimes.length > 0
      ? hesitationTimes.reduce((sum, t) => sum + t, 0) / hesitationTimes.length
      : 0;

    // Abandonment: fields with focus but never a formSubmit for that session
    const abandonmentCount = focusEvents.filter(evt => {
      return !formEvents.some(e => e.eventType === 'formSubmit' && e.sessionId === evt.sessionId);
    }).length;

    return {
      fieldId,
      metrics: {
        totalInteractions: focusEvents.length,
        avgHesitation: Math.round(avgHesitation),
        abandonmentCount,
        // If we want an integer percent
        abandonmentRate: focusEvents.length > 0
          ? Math.round((abandonmentCount / focusEvents.length) * 100)
          : 0
      }
    };
  });

  res.json(analytics);
});

// GET / - serve test.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
