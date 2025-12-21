import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bpmnAPI, logistikAPI, adminAPI } from '../../services/api';

const RoomBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    requestType: 'all',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('🔄 [ROOM BOOKINGS] Fetching room bookings history for logistik...');
      
      let requests = [];

      try {
        console.log('🔍 [ROOM BOOKINGS] Fetching all requests for history...');
        const requestsResponse = await adminAPI.getAllRequests();
        console.log('✅ [ROOM BOOKINGS] Admin API success:', requestsResponse);
        
        let allRequests = [];
        if (requestsResponse.data && requestsResponse.data.success && requestsResponse.data.data) {
          allRequests = requestsResponse.data.data;
        } else if (Array.isArray(requestsResponse.data)) {
          allRequests = requestsResponse.data;
        } else {
          allRequests = [];
        }
        
        // Filter for room-related requests only (room dan both)
        requests = allRequests.filter(req => 
          req.request_type === 'room' || req.request_type === 'both'
        );
        
      } catch (adminError) {
        console.log('⚠️ [ROOM BOOKINGS] Admin API failed:', adminError);
        requests = [];
      }

      // Sort by date (newest first) 
      const sortedRequests = requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setBookings(sortedRequests);
      
      console.log('✅ [ROOM BOOKINGS] Bookings loaded successfully:', sortedRequests.length, 'items');
      
    } catch (error) {
      console.error('❌ [ROOM BOOKINGS] Error fetching bookings:', error);
      setBookings([]);
      toast.error('Gagal memuat data booking');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(booking => {
        const status = booking.room_status || booking.status;
        return status === filters.status;
      });
    }

    // Request type filter
    if (filters.requestType !== 'all') {
      filtered = filtered.filter(booking => booking.request_type === filters.requestType);
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(booking => 
        new Date(booking.date) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(booking => 
        new Date(booking.date) <= new Date(filters.dateTo)
      );
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.title?.toLowerCase().includes(searchLower) ||
        booking.purpose?.toLowerCase().includes(searchLower) ||
        booking.user_name?.toLowerCase().includes(searchLower) ||
        booking.user_email?.toLowerCase().includes(searchLower) ||
        booking.room_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBookings(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      requestType: 'all',
      search: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getStatusBadge = (booking) => {
    const status = booking.room_status || booking.status;
    const statusConfig = {
      pending: {
        bg: 'bg-gradient-to-r from-amber-400 to-orange-500',
        text: 'text-white',
        icon: '⏳',
        label: 'PENDING'
      },
      approved: {
        bg: 'bg-gradient-to-r from-emerald-400 to-green-500',
        text: 'text-white',
        icon: '✅',
        label: 'APPROVED'
      },
      rejected: {
        bg: 'bg-gradient-to-r from-rose-400 to-red-500',
        text: 'text-white',
        icon: '❌',
        label: 'REJECTED'
      },
      completed: {
        bg: 'bg-gradient-to-r from-blue-400 to-indigo-500',
        text: 'text-white',
        icon: '🎉',
        label: 'COMPLETED'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} shadow-lg`}>
        <span className="mr-1.5">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      room: { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🏢', text: 'Ruangan' },
      both: { bg: 'bg-green-50 text-green-700 border-green-200', icon: '🔗', text: 'Ruangan + Zoom' }
    };

    const config = typeConfig[type] || { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: '📝', text: type };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${config.bg}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDetail = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  const StatCard = ({ icon, title, value, subtitle, gradient, delay = 0 }) => (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 group relative overflow-hidden animate-fade-in`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-14 h-14 ${gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
        
        <div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-300">
            {value}
          </h3>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-green-200 border-t-green-600 mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-green-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg">Memuat history booking...</p>
          <p className="text-gray-500 text-sm mt-2">Tunggu sebentar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-[6rem] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    History Booking Ruangan
                  </h1>
                  <p className="text-gray-600 font-medium">Riwayat semua pengajuan ruangan yang masuk ke logistik</p>
                  <p className="text-sm text-gray-500">
                    Total: {filteredBookings.length} dari {bookings.length} booking
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/logistik/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300 hover:shadow-lg group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Link>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-6 py-3 ${showFilters ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200'} font-semibold rounded-xl transition-all duration-300 hover:shadow-lg group`}
              >
                <svg className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="📋"
            title="Total Filtered"
            value={filteredBookings.length}
            subtitle="Dari {bookings.length} total"
            gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
            delay={0}
          />
          <StatCard
            icon="⏳"
            title="Pending"
            value={filteredBookings.filter(b => (b.room_status || b.status) === 'pending').length}
            subtitle="Menunggu approval"
            gradient="bg-gradient-to-r from-amber-500 to-orange-500"
            delay={100}
          />
          <StatCard
            icon="✅"
            title="Approved"
            value={filteredBookings.filter(b => (b.room_status || b.status) === 'approved').length}
            subtitle="Sudah disetujui"
            gradient="bg-gradient-to-r from-emerald-500 to-green-500"
            delay={200}
          />
          <StatCard
            icon="❌"
            title="Rejected"
            value={filteredBookings.filter(b => (b.room_status || b.status) === 'rejected').length}
            subtitle="Ditolak"
            gradient="bg-gradient-to-r from-rose-500 to-red-500"
            delay={300}
          />
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 p-6 mb-8 animate-slide-down">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Filter & Search</h2>
                  <p className="text-gray-600 text-sm">Saring data booking sesuai kebutuhan</p>
                </div>
              </div>
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-300 text-sm group"
              >
                <svg className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset Filter
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Request Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Jenis Request</label>
                <select
                  value={filters.requestType}
                  onChange={(e) => handleFilterChange('requestType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="all">Semua Jenis</option>
                  <option value="room">Ruangan Only</option>
                  <option value="both">Ruangan + Zoom</option>
                </select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Dari Tanggal</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                />
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                />
              </div>

              {/* Search */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Cari berdasarkan judul, user, purpose, atau ruangan..."
                    className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">History Booking</h2>
                  <p className="text-green-100 text-sm">
                    Menampilkan {filteredBookings.length} dari {bookings.length} booking
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {filteredBookings.length > 0 ? (
              <div className="space-y-4">
                {filteredBookings.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="bg-gradient-to-r from-gray-50 to-green-50/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-200/50 hover:border-green-200 group transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
                      <div className="flex-1 mb-4 xl:mb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center mb-2">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 mr-3">
                                #{booking.id}
                              </span>
                              {getTypeBadge(booking.request_type)}
                              <div className="ml-3">
                                {getStatusBadge(booking)}
                              </div>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-green-600 transition-colors duration-300">
                              {booking.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              <span className="font-medium">Purpose:</span> {booking.purpose}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="font-medium mr-2">User:</span>
                              <span className="mr-4">{booking.user_name}</span>
                              <span className="text-gray-400">({booking.user_email})</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <span className="font-medium">{formatDate(booking.date)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                              {booking.start_time} - {booking.end_time}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                            <span className="font-medium">{booking.capacity} orang</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <span className="font-medium">
                              {booking.room_name ? (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                                  {booking.room_name}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-800 text-xs font-medium">
                                  Belum dialokasi
                                </span>
                              )}
                            </span>
                          </div>
                        </div>

                        {booking.room_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-200">
                            <p className="text-sm text-green-700">
                              <span className="font-medium">📝 Notes:</span> {booking.room_notes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDetail(booking)}
                          className="inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-all duration-300 text-sm group"
                          title="Lihat Detail"
                        >
                          <svg className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-r from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">📋</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {bookings.length === 0 ? 'Belum Ada History Booking' : 'Tidak Ada Data Sesuai Filter'}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {bookings.length === 0 
                    ? 'Belum ada history booking ruangan dan zoom+ruangan'
                    : 'Tidak ada data yang sesuai dengan filter yang dipilih'
                  }
                </p>
                {bookings.length > 0 && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Detail Booking</h2>
                    <p className="text-green-100 text-sm">ID: #{selectedBooking.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-300 group"
                >
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Informasi Request
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-semibold text-gray-900">#{selectedBooking.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Judul:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Purpose:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.purpose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jenis:</span>
                      <span>{getTypeBadge(selectedBooking.request_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span>{getStatusBadge(selectedBooking)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Informasi Waktu & User
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">User:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.user_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.user_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal:</span>
                      <span className="font-semibold text-gray-900">{formatDate(selectedBooking.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Waktu:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kapasitas:</span>
                      <span className="font-semibold text-gray-900">{selectedBooking.capacity} orang</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                  Informasi Ruangan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ruangan:</span>
                    <span className="font-semibold text-gray-900">{selectedBooking.room_name || 'Belum dialokasi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diproses:</span>
                    <span className="font-semibold text-gray-900">{formatDateTime(selectedBooking.room_approved_at)}</span>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {(selectedBooking.admin_notes || selectedBooking.zoom_notes || selectedBooking.room_notes) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">
                    Catatan
                  </h3>
                  
                  {selectedBooking.admin_notes && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-blue-800">📝 Catatan dari Admin</h4>
                          <p className="text-sm text-blue-700 mt-1">{selectedBooking.admin_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.zoom_notes && (
                    <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-purple-800">🔗 Catatan Zoom</h4>
                          <p className="text-sm text-purple-700 mt-1">{selectedBooking.zoom_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.room_notes && selectedBooking.room_notes !== 'Tidak ada catatan' && (
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                      <div className="flex">
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">🏢 Catatan Ruangan</h4>
                          <p className="text-sm text-green-700 mt-1">{selectedBooking.room_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-3xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="inline-flex items-center px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomBookings;