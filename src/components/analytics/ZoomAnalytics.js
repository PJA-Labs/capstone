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

const ZoomAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchZoomAnalytics();
  }, [period]);

  const fetchZoomAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getZoomAnalytics(period);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch zoom analytics');
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
  const capacityChartData = data.zoomCapacityStats.map(stat => ({
    range: stat.capacity_range,
    bookings: parseInt(stat.booking_count),
    approved: parseInt(stat.approved_count),
    rejected: parseInt(stat.rejected_count),
    avgCapacity: parseInt(stat.avg_capacity_requested)
  }));

  const popularLinksData = data.popularZoomLinks.slice(0, 5).map((link, index) => ({
    name: `Zoom ${index + 1}`,
    host: link.host_email,
    usage: parseInt(link.usage_count),
    approvalRate: parseFloat(link.approval_rate)
  }));

  const dailyTrendData = data.dailyTrend.slice(0, 7).map(day => ({
    date: new Date(day.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    bookings: parseInt(day.booking_count),
    avgCapacity: parseInt(day.avg_capacity)
  }));

  const durationData = data.meetingDurationStats.map(duration => ({
    duration: duration.duration_range,
    count: parseInt(duration.booking_count),
    avgHours: parseFloat(duration.avg_duration_hours)
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zoom Analytics</h1>
          <p className="text-gray-600">Analisis penggunaan akun Zoom</p>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Zoom Bookings"
          value={data.summary.totalZoomBookings}
          subtitle={`dalam ${period} hari terakhir`}
          icon="📹"
          color={COLORS.primary}
        />
        <StatsCard
          title="Range Kapasitas Populer"
          value={data.summary.mostRequestedCapacityRange}
          subtitle="paling sering diminta"
          icon="👥"
          color={COLORS.secondary}
        />
        <StatsCard
          title="Rata-rata Kapasitas"
          value={`${data.summary.averageCapacityRequested} pax`}
          subtitle="per meeting"
          icon="📊"
          color={COLORS.accent}
        />
        <StatsCard
          title="Approval Rate"
          value={`${data.summary.averageApprovalRate}%`}
          subtitle="rata-rata persetujuan"
          icon="✅"
          color={COLORS.teal}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zoom Capacity Distribution */}
        <CustomBarChart
          data={capacityChartData}
          dataKey="bookings"
          xAxisKey="range"
          title="Booking Berdasarkan Range Kapasitas"
          color={COLORS.primary}
        />

        {/* Meeting Duration Distribution */}
        <CustomPieChart
          data={durationData}
          dataKey="count"
          nameKey="duration"
          title="Distribusi Durasi Meeting"
        />

        {/* Daily Trend */}
        <CustomLineChart
          data={dailyTrendData}
          dataKey="bookings"
          xAxisKey="date"
          title="Trend Booking Zoom Harian"
          color={COLORS.secondary}
        />

        {/* Popular Zoom Links Usage */}
        <CustomBarChart
          data={popularLinksData}
          dataKey="usage"
          xAxisKey="name"
          title="Top 5 Akun Zoom Paling Sering Digunakan"
          color={COLORS.purple}
        />
      </div>

      {/* Capacity vs Duration Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Analisis Kapasitas yang Diminta
          </h3>
          <div className="space-y-4">
            {capacityChartData.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-900">{item.range} peserta</span>
                  <p className="text-sm text-gray-600">
                    Rata-rata: {item.avgCapacity} peserta
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-blue-600">{item.bookings}</span>
                  <p className="text-sm text-gray-600">booking</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Insight Durasi Meeting
          </h3>
          <div className="space-y-4">
            {durationData.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-gray-900">{item.duration}</span>
                  <p className="text-sm text-gray-600">
                    Rata-rata: {item.avgHours} jam
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-green-600">{item.count}</span>
                  <p className="text-sm text-gray-600">meeting</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detail Akun Zoom</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Host Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.popularZoomLinks.map((link, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {link.host_email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                    <a href={link.link_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {link.link_url.substring(0, 30)}...
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {link.usage_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(link.approval_rate) >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(link.approval_rate) >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {link.approval_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ZoomAnalytics;