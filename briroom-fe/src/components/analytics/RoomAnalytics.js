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

const RoomAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    fetchRoomAnalytics();
  }, [period]);

  const fetchRoomAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getRoomAnalytics(period);
      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch room analytics');
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
  const capacityChartData = data.roomCapacityStats.map(stat => ({
    capacity: `${stat.capacity} pax`,
    bookings: parseInt(stat.booking_count),
    approved: parseInt(stat.approved_count),
    rejected: parseInt(stat.rejected_count)
  }));

  const popularRoomsData = data.popularRooms.slice(0, 5).map(room => ({
    name: room.room_name,
    bookings: parseInt(room.booking_count),
    approvalRate: parseFloat(room.approval_rate)
  }));

  const dailyTrendData = data.dailyTrend.slice(0, 7).map(day => ({
    date: new Date(day.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
    bookings: parseInt(day.booking_count)
  }));

  const hourlyData = data.hourlyUtilization.map(hour => ({
    hour: `${hour.hour}:00`,
    bookings: parseInt(hour.booking_count)
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room Analytics</h1>
          <p className="text-gray-600">Analisis penggunaan ruangan rapat</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Room Bookings"
          value={data.summary.totalRoomBookings}
          subtitle={`dalam ${period} hari terakhir`}
          icon="🏢"
          color={COLORS.primary}
        />
        <StatsCard
          title="Kapasitas Paling Diminta"
          value={`${data.summary.mostRequestedCapacity} pax`}
          subtitle="ruangan paling populer"
          icon="👥"
          color={COLORS.secondary}
        />
        <StatsCard
          title="Approval Rate"
          value={`${data.summary.averageApprovalRate}%`}
          subtitle="rata-rata persetujuan"
          icon="✅"
          color={COLORS.accent}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Capacity Distribution */}
        <CustomBarChart
          data={capacityChartData}
          dataKey="bookings"
          xAxisKey="capacity"
          title="Booking Berdasarkan Kapasitas Ruangan"
          color={COLORS.primary}
        />

        {/* Popular Rooms */}
        <CustomBarChart
          data={popularRoomsData}
          dataKey="bookings"
          xAxisKey="name"
          title="Top 5 Ruangan Paling Popular"
          color={COLORS.secondary}
        />

        {/* Daily Trend */}
        <CustomLineChart
          data={dailyTrendData}
          dataKey="bookings"
          xAxisKey="date"
          title="Trend Booking Harian"
          color={COLORS.accent}
        />

        {/* Hourly Utilization */}
        <CustomBarChart
          data={hourlyData}
          dataKey="bookings"
          xAxisKey="hour"
          title="Utilizasi per Jam"
          color={COLORS.purple}
        />
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detail Ruangan Populer</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kapasitas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lokasi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.popularRooms.map((room, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {room.room_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.capacity} pax
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {room.booking_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parseFloat(room.approval_rate) >= 80 
                        ? 'bg-green-100 text-green-800' 
                        : parseFloat(room.approval_rate) >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {room.approval_rate}%
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

export default RoomAnalytics;