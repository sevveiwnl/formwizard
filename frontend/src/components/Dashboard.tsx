import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks'; 
import { fetchFormAnalytics } from '../store/analyticsSlice';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

function Dashboard() {
  const dispatch = useAppDispatch();
  const { formStats, loading, error } = useAppSelector((state) => state.analytics);

  useEffect(() => {
    dispatch(fetchFormAnalytics('test-form-1'));
  }, [dispatch]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }
  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  // Basic calculations from formStats
  const totalSubmissions = formStats.find(stat => stat.event_type === 'complete')?.count || 0;
  const totalStarts = formStats.find(stat => stat.event_type === 'start')?.count || 1;
  const totalAbandons = formStats.find(stat => stat.event_type === 'abandon')?.count || 0;

  const abandonmentRate = ((totalAbandons / totalStarts) * 100).toFixed(1);
  const conversionRate = ((totalSubmissions / totalStarts) * 100).toFixed(1);

  // Example static data for chart
  const chartData = [
    { date: '2024-01', submissions: 45, abandons: 15 },
    { date: '2024-02', submissions: 52, abandons: 18 },
    { date: '2024-03', submissions: 58, abandons: 12 },
    { date: '2024-04', submissions: 63, abandons: 10 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Submissions</h3>
          <p className="mt-2 text-3xl font-semibold text-blue-600">
            {totalSubmissions}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Abandonment Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {abandonmentRate}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Conversion Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            {conversionRate}%
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-medium mb-4">Form Performance Over Time</h2>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="#3B82F6" 
                name="Submissions"
              />
              <Line 
                type="monotone" 
                dataKey="abandons" 
                stroke="#EF4444" 
                name="Abandons"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

