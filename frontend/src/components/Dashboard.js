/**
 * src/components/Dashboard.js
 */
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [analytics, setAnalytics] = useState([]);
  const [selectedForm, setSelectedForm] = useState('testForm'); 
  const [formList, setFormList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('server'); 
    // "server" = fetch from Express
    // "local"  = use window.AnalyticsService if available

  useEffect(() => {
    // On mount, check if we have a global AnalyticsService
    // and if dataSource is "local", we might generate sample data
    if (window.AnalyticsService && dataSource === 'local') {
      const events = window.AnalyticsService.getEvents();
      if (events.length === 0) {
        window.AnalyticsService.generateSampleData(selectedForm);
      }
    }
  }, [dataSource, selectedForm]);

  // Load analytics data from either server or local
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (dataSource === 'local' && window.AnalyticsService) {
          // Use localStorage data
          const analyticsData = window.AnalyticsService.getFormAnalytics(selectedForm);
          
          // Gather form IDs from localStorage events
          const events = window.AnalyticsService.getEvents();
          const forms = [...new Set(events
            .filter(e => e.formId)
            .map(e => e.formId))];
          
          setAnalytics(analyticsData);
          setFormList(forms);
        } else {
          // Fetch from server endpoints
          const analyticsRes = await fetch(`http://localhost:5001/api/analytics/${selectedForm}`);
          if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');
          const analyticsData = await analyticsRes.json();
          
          // If you had an endpoint for forms, you could fetch it here
          // For now, just assume there's only one or a few forms:
          setFormList([selectedForm]);
          setAnalytics(analyticsData);
        }
      } catch (err) {
        setError(`Failed to load data: ${err.message}`);
        setAnalytics([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedForm, dataSource]);

  if (loading) {
    return (
      <div className="dashboard loading">
        <h1>FormWizard Analytics Dashboard</h1>
        <p>Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard error">
        <h1>FormWizard Analytics Dashboard</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // If no analytics found
  if (!analytics || analytics.length === 0) {
    return (
      <div className="dashboard empty">
        <h1>FormWizard Analytics Dashboard</h1>
        <div className="data-source-toggle">
          <label>
            <input
              type="radio"
              value="server"
              checked={dataSource === 'server'}
              onChange={() => setDataSource('server')}
            />
            Server Data
          </label>
          <label>
            <input
              type="radio"
              value="local"
              checked={dataSource === 'local'}
              onChange={() => setDataSource('local')}
            />
            Local Data
          </label>
        </div>
        <p>No data available for this form.</p>
        {window.AnalyticsService && dataSource === 'local' && (
          <button onClick={() => {
            window.AnalyticsService.generateSampleData(selectedForm);
            window.location.reload();
          }}>
            Generate Sample Data
          </button>
        )}
      </div>
    );
  }

  // Prepare data for a line chart of average hesitation
  const lineData = {
    labels: analytics.map(a => a.fieldId),
    datasets: [
      {
        label: 'Avg Hesitation (ms)',
        data: analytics.map(a => a.metrics?.avgHesitation || 0),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }
    ]
  };

  // Prepare data for a bar chart: total interactions vs. total abandonments
  const totalInteractions = analytics.reduce((acc, f) => acc + (f.metrics?.totalInteractions || 0), 0);
  const totalAbandonments = analytics.reduce((acc, f) => {
    // If you track a separate "abandonmentCount", you could use that.
    // Or compute from "abandonmentRate" * "focusEvents" if needed.
    // For simplicity, let's sum up all 'fieldFocus' that never lead to submit:
    return acc + (f.metrics?.abandonmentCount || 0);
  }, 0);

  const barData = {
    labels: ['Total Interactions', 'Abandonments'],
    datasets: [
      {
        label: 'Form Stats',
        data: [totalInteractions, totalAbandonments],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 99, 132, 0.6)'],
        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      }
    ]
  };

  // Identify problematic fields (optional)
  const problematicFields = analytics.filter(f => 
    (f.metrics?.abandonmentRate > 30) || (f.metrics?.avgHesitation > 5000)
  );

  return (
    <div className="dashboard">
      <h1>FormWizard Analytics Dashboard</h1>

      {/* Data source toggle */}
      <div className="data-source-toggle">
        <label>
          <input
            type="radio"
            value="server"
            checked={dataSource === 'server'}
            onChange={() => setDataSource('server')}
          />
          Server Data
        </label>
        <label>
          <input
            type="radio"
            value="local"
            checked={dataSource === 'local'}
            onChange={() => setDataSource('local')}
          />
          Local Data
        </label>
      </div>

      {/* Form selector (if you have multiple forms) */}
      {formList.length > 1 && (
        <div>
          <label>Select Form:</label>
          <select value={selectedForm} onChange={(e) => setSelectedForm(e.target.value)}>
            {formList.map(form => <option key={form} value={form}>{form}</option>)}
          </select>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3>Average Hesitation by Field</h3>
          <div style={{ height: '300px' }}>
            <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3>Overall Form Interactions</h3>
          <div style={{ height: '300px' }}>
            <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      {/* Problematic Fields Table */}
      <div style={{ marginTop: '2rem' }}>
        <h3>Problematic Fields</h3>
        {problematicFields.length > 0 ? (
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Field</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Abandonment Rate</th>
                <th style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>Avg Hesitation (ms)</th>
              </tr>
            </thead>
            <tbody>
              {problematicFields.map((field) => (
                <tr key={field.fieldId}>
                  <td style={{ padding: '8px' }}>{field.fieldId}</td>
                  <td style={{ padding: '8px' }}>{field.metrics.abandonmentRate}%</td>
                  <td style={{ padding: '8px' }}>{field.metrics.avgHesitation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No significant issues detected.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
