import db from '../config/db.js';

// Analytics untuk ruangan
const getRoomAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // Default 30 hari terakhir
    
    // Query untuk mendapatkan data booking ruangan berdasarkan kapasitas
    const roomBookingStats = await db.query(`
      SELECT 
        r.capacity,
        COUNT(req.id) as booking_count,
        ROUND(AVG(req.capacity)) as avg_capacity_requested,
        COUNT(CASE WHEN req.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN req.status = 'rejected' THEN 1 END) as rejected_count
      FROM requests req
      JOIN rooms r ON req.room_id = r.id
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('room_only', 'both')
      GROUP BY r.capacity
      ORDER BY booking_count DESC
    `);

    // Query untuk mendapatkan ruangan paling populer
    const popularRooms = await db.query(`
      SELECT 
        r.room_name,
        r.capacity,
        r.location,
        COUNT(req.id) as booking_count,
        ROUND(
          COUNT(CASE WHEN req.status = 'approved' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(req.id), 0), 2
        ) as approval_rate
      FROM rooms r
      LEFT JOIN requests req ON r.id = req.room_id 
        AND req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('room_only', 'both')
      GROUP BY r.id, r.room_name, r.capacity, r.location
      ORDER BY booking_count DESC
      LIMIT 10
    `);

    // Query untuk trend booking per hari
    const dailyTrend = await db.query(`
      SELECT 
        DATE(req.created_at) as date,
        COUNT(req.id) as booking_count
      FROM requests req
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('room_only', 'both')
      GROUP BY DATE(req.created_at)
      ORDER BY date DESC
    `);

    // Query untuk utilization rate berdasarkan jam
    const hourlyUtilization = await db.query(`
      SELECT 
        EXTRACT(hour FROM req.start_time) as hour,
        COUNT(req.id) as booking_count
      FROM requests req
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('room_only', 'both')
        AND req.status = 'approved'
      GROUP BY EXTRACT(hour FROM req.start_time)
      ORDER BY hour
    `);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        roomCapacityStats: roomBookingStats.rows,
        popularRooms: popularRooms.rows,
        dailyTrend: dailyTrend.rows,
        hourlyUtilization: hourlyUtilization.rows,
        summary: {
          totalRoomBookings: roomBookingStats.rows.reduce((sum, row) => sum + parseInt(row.booking_count), 0),
          mostRequestedCapacity: roomBookingStats.rows[0]?.capacity || 0,
          averageApprovalRate: popularRooms.rows.length > 0 
            ? (popularRooms.rows.reduce((sum, room) => sum + parseFloat(room.approval_rate || 0), 0) / popularRooms.rows.length).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Room analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room analytics',
      error: error.message
    });
  }
};

// Analytics untuk Zoom
const getZoomAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // Default 30 hari terakhir
    
    // Query untuk mendapatkan data booking zoom berdasarkan kapasitas yang diminta
    const zoomCapacityStats = await db.query(`
      SELECT 
        CASE 
          WHEN req.capacity <= 50 THEN '1-50'
          WHEN req.capacity <= 100 THEN '51-100'
          WHEN req.capacity <= 200 THEN '101-200'
          WHEN req.capacity <= 500 THEN '201-500'
          ELSE '500+'
        END as capacity_range,
        COUNT(req.id) as booking_count,
        ROUND(AVG(req.capacity)) as avg_capacity_requested,
        COUNT(CASE WHEN req.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN req.status = 'rejected' THEN 1 END) as rejected_count
      FROM requests req
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('zoom_only', 'both')
      GROUP BY capacity_range
      ORDER BY booking_count DESC
    `);

    // Query untuk mendapatkan zoom link yang paling sering digunakan
    const popularZoomLinks = await db.query(`
      SELECT 
        zl.link_url,
        zl.host_email,
        COUNT(req.id) as usage_count,
        ROUND(
          COUNT(CASE WHEN req.status = 'approved' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(req.id), 0), 2
        ) as approval_rate
      FROM zoom_links zl
      LEFT JOIN requests req ON zl.id = req.zoom_link_id 
        AND req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('zoom_only', 'both')
      GROUP BY zl.id, zl.link_url, zl.host_email
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // Query untuk trend booking zoom per hari
    const dailyZoomTrend = await db.query(`
      SELECT 
        DATE(req.created_at) as date,
        COUNT(req.id) as booking_count,
        ROUND(AVG(req.capacity)) as avg_capacity
      FROM requests req
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('zoom_only', 'both')
      GROUP BY DATE(req.created_at)
      ORDER BY date DESC
    `);

    // Query untuk distribusi durasi meeting
    const meetingDurationStats = await db.query(`
      SELECT 
        CASE 
          WHEN EXTRACT(EPOCH FROM (req.end_time - req.start_time))/3600 <= 1 THEN '≤ 1 hour'
          WHEN EXTRACT(EPOCH FROM (req.end_time - req.start_time))/3600 <= 2 THEN '1-2 hours'
          WHEN EXTRACT(EPOCH FROM (req.end_time - req.start_time))/3600 <= 4 THEN '2-4 hours'
          ELSE '> 4 hours'
        END as duration_range,
        COUNT(req.id) as booking_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (req.end_time - req.start_time))/3600), 2) as avg_duration_hours
      FROM requests req
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND req.request_type IN ('zoom_only', 'both')
      GROUP BY duration_range
      ORDER BY booking_count DESC
    `);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        zoomCapacityStats: zoomCapacityStats.rows,
        popularZoomLinks: popularZoomLinks.rows,
        dailyTrend: dailyZoomTrend.rows,
        meetingDurationStats: meetingDurationStats.rows,
        summary: {
          totalZoomBookings: zoomCapacityStats.rows.reduce((sum, row) => sum + parseInt(row.booking_count), 0),
          mostRequestedCapacityRange: zoomCapacityStats.rows[0]?.capacity_range || 'N/A',
          averageCapacityRequested: zoomCapacityStats.rows.length > 0 
            ? Math.round(zoomCapacityStats.rows.reduce((sum, row) => sum + parseInt(row.avg_capacity_requested || 0), 0) / zoomCapacityStats.rows.length)
            : 0,
          averageApprovalRate: popularZoomLinks.rows.length > 0 
            ? (popularZoomLinks.rows.reduce((sum, link) => sum + parseFloat(link.approval_rate || 0), 0) / popularZoomLinks.rows.length).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Zoom analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get zoom analytics',
      error: error.message
    });
  }
};

// Combined analytics dashboard
const getDashboardAnalytics = async (req, res) => {
  try {
    const { period = '30' } = req.query;
    
    // Summary statistics
    const summary = await db.query(`
      SELECT 
        COUNT(CASE WHEN request_type IN ('room_only', 'both') THEN 1 END) as total_room_requests,
        COUNT(CASE WHEN request_type IN ('zoom_only', 'both') THEN 1 END) as total_zoom_requests,
        COUNT(CASE WHEN request_type = 'both' THEN 1 END) as combined_requests,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as total_approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as total_rejected,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending,
        COUNT(*) as total_requests
      FROM requests 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
    `);

    // Top users by booking frequency
    const topUsers = await db.query(`
      SELECT 
        u.name,
        u.email,
        COUNT(req.id) as booking_count,
        COUNT(CASE WHEN req.status = 'approved' THEN 1 END) as approved_count
      FROM users u
      JOIN requests req ON u.id = req.user_id
      WHERE req.created_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY u.id, u.name, u.email
      ORDER BY booking_count DESC
      LIMIT 10
    `);

    // Peak usage times
    const peakHours = await db.query(`
      SELECT 
        EXTRACT(hour FROM start_time) as hour,
        COUNT(*) as booking_count
      FROM requests 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'
        AND status = 'approved'
      GROUP BY EXTRACT(hour FROM start_time)
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        period: `${period} days`,
        summary: summary.rows[0],
        topUsers: topUsers.rows,
        peakHours: peakHours.rows,
        insights: {
          roomVsZoomPreference: {
            roomOnly: summary.rows[0].total_room_requests - summary.rows[0].combined_requests,
            zoomOnly: summary.rows[0].total_zoom_requests - summary.rows[0].combined_requests,
            combined: summary.rows[0].combined_requests
          },
          approvalRate: summary.rows[0].total_requests > 0 
            ? ((summary.rows[0].total_approved / summary.rows[0].total_requests) * 100).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard analytics',
      error: error.message
    });
  }
};

export {
  getRoomAnalytics,
  getZoomAnalytics,
  getDashboardAnalytics
};