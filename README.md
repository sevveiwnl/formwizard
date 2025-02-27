# FormWizard

A lightweight analytics tool that tracks user interactions on forms (focus, blur, submission, etc.) and displays basic insights in a simple React dashboard. This project does not require a database—it uses localStorage (client-side) or an in-memory store on the server.

## Key Features

- **Client-Side Tracking**: Monitors field focus, blur, and input changes.
- **Local Storage or In-Memory Storage**: Choose between storing data in the browser or sending it to a lightweight Express server.
- **Analytics Dashboard**: View total interactions, average hesitation times, and abandonment rates via simple charts.
- **Problematic Fields**: Quickly identify which fields have high abandonment or long hesitation.

## How It Works

1. **Tracking**

   - Include `formwizard-tracker.js` on any page containing a form.
   - This script listens for focus, blur, input, and submit events.
   - Events are stored in localStorage (and optionally sent to the Express server at `/api/tracker/event`).

2. **Analytics**

   - A React dashboard fetches data from either:
     - **LocalStorage** (via `window.AnalyticsService`), or
     - **Server** (`/api/analytics/:formId`) which stores events in memory.
   - It calculates average hesitation, total interactions, and abandonment counts per form field.

3. **Demo Form**
   - `test.html` (served from `backend/public/`) is a sample form that includes `analytics-service.js` and `formwizard-tracker.js`.
   - Interact with it, then visit your React app to see analytics.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Setup

1. **Clone this repository**:

   ```bash
   git clone https://github.com/sevveiwnl/FormWizard.git
   cd FormWizard

   # In the backend folder
   cd backend
   npm install

   # Then in the frontend folder
   cd ../frontend
   npm install

   # from /FormWizard/backend
   npm start
   This typically runs on http://localhost:5001.

   # from /FormWizard/frontend
   npm start
   This typically runs on http://localhost:3000.
   ```

Usage
Local Mode
In the React dashboard, switch “Data Source” to Local if you want to read data directly from your browser’s localStorage.

Server Mode
Switch “Data Source” to Server if you want to fetch analytics from the Express server.

Technologies Used
Frontend: React, Chart.js
Backend: Node.js / Express
Storage: LocalStorage (client) or in-memory array (server)
