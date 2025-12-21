import React, { useState, useEffect } from 'react';
import analyticsService from '../../services/analyticsService';
import {
  CustomBarChart,
  CustomPieChart,
  CustomLineChart,
  StatsCard,
  ChartLoading,
  ChartError,
  COLORS
} from '../charts/ChartComponents';

const DashboardAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchDashboardAnalytics();
  }, [period]);

  const fetchDashboardAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getDashboardAnalytics(period);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartLoading />
        <ChartLoading />
        <ChartLoading />
      </div>
    );
  }

  if (error) {
    return <ChartError message={error} />;
  }

  if (!data) {
    return <ChartError message="No data available" />;
  }

  // Transform data untuk charts
  const requestTypeData = [
    { name: 'Room Only', value: data.insights.roomVsZoomPreference.roomOnly, color: COLORS.primary },
    { name: 'Zoom Only', value: data.insights.roomVsZoomPreference.zoomOnly, color: COLORS.secondary },
    { name: 'Combined', value: data.insights.roomVsZoomPreference.combined, color: COLORS.accent }
  ];

  const topUsersData = data.topUsers.slice(0, 5).map(user => ({
    name: user.name.split(' ')[0], // First name only
    bookings: parseInt(user.booking_count),
    approved: parseInt(user.approved_count)
  }));

  const peakHoursData = data.peakHours.map(hour => ({
    hour: `${hour.hour}:00`,
    bookings: parseInt(hour.booking_count)
  }));

  const statusData = [
    { name: 'Approved', value: parseInt(data.summary.total_approved), color: COLORS.secondary },
    { name: 'Rejected', value: parseInt(data.summary.total_rejected), color: COLORS.danger },
    { name: 'Pending', value: parseInt(data.summary.total_pending), color: COLORS.accent }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-gray-600">Overview penggunaan sistem BRIRoom</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>7 Hari Terakhir</option>
          <option value={30}>30 Hari Terakhir</option>
          <option value={90}>90 Hari Terakhir</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Requests"
          value={data.summary.total_requests}
          subtitle={`dalam ${period} hari terakhir`}
          icon="📋"
          color={COLORS.primary}
        />
        <StatsCard
          title="Room Requests"
          value={data.summary.total_room_requests}
          subtitle="permintaan ruangan"
          icon="🏢"
          color={COLORS.secondary}
        />
        <StatsCard
          title="Zoom Requests"
          value={data.summary.total_zoom_requests}
          subtitle="permintaan zoom"
          icon="📹"
          color={COLORS.accent}
        />
        <StatsCard
          title="Approval Rate"
          value={`${data.insights.approvalRate}%`}
          subtitle="tingkat persetujuan"
          icon="✅"
          color={COLORS.teal}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Type Distribution */}
        <CustomPieChart
          data={requestTypeData}
          dataKey="value"
          nameKey="name"
          title="Distribusi Tipe Permintaan"
        />

        {/* Request Status Distribution */}
        <CustomPieChart
          data={statusData}
          dataKey="value"
          nameKey="name"
          title="Status Permintaan"
        />

        {/* Top Active Users */}
        <CustomBarChart
          data={topUsersData}
          dataKey="bookings"
          xAxisKey="name"
          title="Top 5 Users Paling Aktif"
          color={COLORS.purple}
        />

        {/* Peak Hours */}
        <CustomBarChart
          data={peakHoursData}
          dataKey="bookings"
          xAxisKey="hour"
          title="Jam Sibuk Booking"
          color={COLORS.indigo}
        />
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Behavior Analysis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📈 User Behavior Insights
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Preferensi Booking</h4>
              <p className="text-sm text-blue-700 mt-1">
                {requestTypeData.reduce((max, item) => 
                  item.value > max.value ? item : max
                ).name} adalah tipe permintaan yang paling populer
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Success Rate</h4>
              <p className="text-sm text-green-700 mt-1">
                {data.insights.approvalRate}% permintaan disetujui
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Peak Time</h4>
              <p className="text-sm text-purple-700 mt-1">
                Jam {peakHoursData[0]?.hour} adalah waktu tersibuk
              </p>
            </div>
          </div>
        </div>

        {/* Request Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 Breakdown Permintaan
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Combined (Room + Zoom)</span>
              <span className="font-semibold text-gray-900">
                {data.summary.combined_requests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Room Only</span>
              <span className="font-semibold text-gray-900">
                {data.insights.roomVsZoomPreference.roomOnly}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Zoom Only</span>
              <span className="font-semibold text-gray-900">
                {data.insights.roomVsZoomPreference.zoomOnly}
              </span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Requests</span>
              <span>{data.summary.total_requests}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🚀 Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/analytics/rooms'}
              className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-blue-900">Room Analytics</div>
              <div className="text-sm text-blue-700">Analisis detail ruangan</div>
            </button>
            <button 
              onClick={() => window.location.href = '/analytics/zoom'}
              className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-900">Zoom Analytics</div>
              <div className="text-sm text-green-700">Analisis detail zoom</div>
            </button>
            <button 
              onClick={() => fetchDashboardAnalytics()}
              className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-gray-900">Refresh Data</div>
              <div className="text-sm text-gray-700">Update data terbaru</div>
            </button>
          </div>
        </div>
      </div>

      {/* Top Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Active Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.topUsers.map((user, index) => {
                const successRate = user.booking_count > 0 
                  ? ((user.approved_count / user.booking_count) * 100).toFixed(1)
                  : 0;
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.booking_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.approved_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        successRate >= 80 
                          ? 'bg-green-100 text-green-800' 
                          : successRate >= 60
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {successRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;