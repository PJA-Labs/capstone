import db from '../config/db.js';

const getRequestsTest = async (req, res) => {
  try {
    console.log('🧪 Testing requests endpoint');
    console.log('👤 User data:', {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    });
    
    res.json({
      success: true,
      message: 'Request controller working',
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: error.message
    });
  }
};

// User Functions
const createRequest = async (req, res) => {
  try {
    console.log('🔍 Creating request for user:', req.user?.id);
    console.log('📝 Request body:', req.body);
    
    if (!req.user || !req.user.id) {
      console.log('❌ No user ID in request');
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }
    
    const {
      title,
      purpose,
      date,
      start_time,
      end_time,
      capacity,
      request_type,
      pic_name,
      pic_contact,
      whatsapp_number
    } = req.body;

    // Basic validation
    if (!title || !purpose || !date || !start_time || !end_time) {
      console.log('❌ Validation failed:', { title, purpose, date, start_time, end_time });
      return res.status(400).json({
        success: false,
        message: 'Title, purpose, date, start_time, and end_time are required',
        received: { title, purpose, date, start_time, end_time }
      });
    }

    // Insert dengan kolom yang benar saja
    const insertQuery = `
      INSERT INTO requests (
        user_id, title, purpose, date, start_time, end_time, 
        capacity, request_type, pic_name, pic_contact, whatsapp_number, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      req.user.id, title, purpose, date, start_time, end_time,
      capacity || 10, request_type || 'room', pic_name, pic_contact, whatsapp_number
    ];

    console.log('📝 Executing insert with values:', values.slice(0, 3), '...[more values]');
    const result = await db.query(insertQuery, values);
    console.log('✅ Insert successful:', result.rows[0]?.id);
    
    res.status(201).json({
      success: true,
      message: 'Permintaan berhasil dibuat',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error creating request:', {
      message: error.message,
      userId: req.user?.id,
      body: req.body,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create request',
      error: error.message
    });
  }
};

const getMyRequests = async (req, res) => {
  try {
    console.log('🔍 Getting requests for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.log('❌ No user ID in request');
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }
    
    // Query dengan JOIN ke users untuk mendapatkan informasi user dan PIC
    const query = `
      SELECT r.*, 
             rm.room_name, rm.location as room_location,
             u.name as user_name, u.email as user_email,
             za.name as zoom_approver_name, za.email as zoom_approver_email,
             ra.name as room_approver_name, ra.email as room_approver_email
      FROM requests r
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users za ON r.zoom_approved_by = za.id
      LEFT JOIN users ra ON r.room_approved_by = ra.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC
    `;
    
    console.log('📝 Executing getMyRequests query for user:', req.user.id);
    const result = await db.query(query, [req.user.id]);
    console.log('✅ getMyRequests result:', result.rows.length, 'rows for user', req.user.id);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Error getting user requests:', {
      message: error.message,
      userId: req.user?.id,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to get requests',
      error: error.message,
      userId: req.user?.id
    });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const query = `
      SELECT r.*, u.name as user_name, u.email as user_email,
             rm.room_name, rm.location as room_location, rm.capacity as room_capacity,
             zl.zoom_link, zl.zoom_email, zl.zoom_account_name, zl.max_capacity as zoom_capacity
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
      ORDER BY r.created_at DESC
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT r.*, u.name as user_name, u.email as user_email,
             rm.room_name, rm.location as room_location,
             zl.link_url as zoom_link, zl.host_email as zoom_host
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
      WHERE r.id = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getMyRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT r.*, rm.room_name, rm.location as room_location,
             zl.link_url as zoom_link, zl.host_email as zoom_host
      FROM requests r
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
      WHERE r.id = $1 AND r.user_id = $2
    `;
    
    const result = await db.query(query, [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const updateMyRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, purpose, date, start_time, end_time, capacity, pic_name, pic_phone } = req.body;

    // Check if request exists and belongs to user
    const checkQuery = 'SELECT * FROM requests WHERE id = $1 AND user_id = $2 AND status = $3';
    const checkResult = await db.query(checkQuery, [id, req.user.id, 'pending']);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan atau tidak dapat diubah'
      });
    }

    // Update request
    const updateQuery = `
      UPDATE requests 
      SET title = $1, purpose = $2, date = $3, start_time = $4, end_time = $5,
          capacity = $6, pic_name = $7, pic_phone = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9 AND user_id = $10
      RETURNING *
    `;

    const values = [title, purpose, date, start_time, end_time, capacity, pic_name, pic_phone, id, req.user.id];
    const result = await db.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Request berhasil diupdate',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if request exists and belongs to user
    const checkQuery = 'SELECT * FROM requests WHERE id = $1 AND user_id = $2';
    const checkResult = await db.query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }

    // Update status to cancelled
    const updateQuery = `
      UPDATE requests 
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id, req.user.id]);

    res.json({
      success: true,
      message: 'Request berhasil dibatalkan',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Schedule Functions
const getSchedule = async (req, res) => {
  try {
    console.log('🔍 Getting approved schedule...');
    
    const query = `
      SELECT r.id, r.title, r.date, r.start_time, r.end_time,
             r.request_type, r.status, rm.room_name
      FROM requests r
      LEFT JOIN rooms rm ON r.room_id = rm.id
      WHERE r.status = 'approved' 
        AND r.date >= CURRENT_DATE
      ORDER BY r.date, r.start_time
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: 'Schedule retrieved successfully'
    });
    
  } catch (error) {
    console.error('❌ Error getting schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule',
      error: error.message
    });
  }
};

// Admin/Logistik Functions
const getRoomRequests = async (req, res) => {
  try {
    // Check if we want all history or just pending
    const includeHistory = req.query.history === 'true';
    
    let whereClause = `WHERE (r.request_type = 'room' OR r.request_type = 'both')`;
    
    if (!includeHistory) {
      whereClause += ` AND r.room_status = 'pending'`;
    }
    
    const query = `
      SELECT r.*, u.name as user_name, u.email as user_email,
             rm.room_name, rm.location as room_location, rm.capacity as room_capacity
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      ${whereClause}
      ORDER BY r.created_at DESC
    `;
    
    console.log('🔍 getRoomRequests query:', { includeHistory, whereClause });
    
    const result = await db.query(query);
    
    console.log('✅ getRoomRequests found:', result.rows.length, 'requests');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting room requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getZoomRequests = async (req, res) => {
  try {
    const query = `
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM requests r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE (r.request_type = 'zoom' OR r.request_type = 'both')
      AND r.zoom_status = 'pending'
      ORDER BY r.created_at ASC
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting zoom requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const approveRoomRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { room_id, notes, admin_notes } = req.body;

    const updateQuery = `
      UPDATE requests 
      SET room_id = $1, room_status = 'approved', room_notes = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(updateQuery, [room_id, notes, admin_notes, id]);

    res.json({
      success: true,
      message: 'Room request berhasil disetujui',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error approving room request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const rejectRoomRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updateQuery = `
      UPDATE requests 
      SET room_status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Room request ditolak',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error rejecting room request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const adminApproveZoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { zoom_link_id, notes, admin_notes } = req.body;

    // Get zoom account information if zoom_link_id is provided
    let zoomAccountInfo = '';
    if (zoom_link_id) {
      const zoomResult = await db.query('SELECT zoom_account_name, capacity FROM zoom_links WHERE id = $1', [zoom_link_id]);
      if (zoomResult.rows.length > 0) {
        const zoom = zoomResult.rows[0];
        zoomAccountInfo = `Zoom ${zoom.zoom_account_name} (Kapasitas: ${zoom.capacity}) disetujui oleh admin IT`;
      }
    }

    // Use provided notes or generate from zoom account info
    const finalZoomNotes = notes || zoomAccountInfo || 'Zoom request disetujui oleh admin IT';

    const updateQuery = `
      UPDATE requests 
      SET zoom_link_id = $1, zoom_status = 'approved', zoom_notes = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const result = await db.query(updateQuery, [zoom_link_id, finalZoomNotes, admin_notes, id]);

    res.json({
      success: true,
      message: 'Zoom request berhasil disetujui',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error approving zoom request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const adminRejectZoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updateQuery = `
      UPDATE requests 
      SET zoom_status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Zoom request ditolak',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error rejecting zoom request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      notes, 
      admin_notes, 
      zoom_link_id,
      zoom_link_manual,
      zoom_meeting_id_manual,
      zoom_passcode_manual
    } = req.body;

    console.log('🔍 DEBUG approveRequest:', {
      id,
      notes,
      admin_notes,
      zoom_link_id,
      zoom_link_manual,
      zoom_meeting_id_manual,
      zoom_passcode_manual,
      body: req.body
    });

    // Get current request details
    const requestResult = await db.query('SELECT * FROM requests WHERE id = $1', [id]);
    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request tidak ditemukan'
      });
    }

    const request = requestResult.rows[0];

    // Build update query based on request type
    let updateQuery = '';
    let updateParams = [];

    if (request.request_type === 'zoom') {
      // Zoom only request
      if (!zoom_link_id && !zoom_link_manual) {
        return res.status(400).json({
          success: false,
          message: 'Zoom account harus dipilih atau informasi zoom manual harus diisi untuk request zoom'
        });
      }

      // Get zoom account information
      let zoomAccountInfo = '';
      if (zoom_link_id) {
        const zoomResult = await db.query('SELECT zoom_account_name, capacity FROM zoom_links WHERE id = $1', [zoom_link_id]);
        if (zoomResult.rows.length > 0) {
          const zoom = zoomResult.rows[0];
          zoomAccountInfo = `Zoom ${zoom.zoom_account_name} (Kapasitas: ${zoom.capacity}) disetujui oleh admin`;
        }
      } else if (zoom_link_manual) {
        zoomAccountInfo = `Zoom manual disetujui oleh admin`;
      }

      updateQuery = `
        UPDATE requests 
        SET status = 'approved', 
            zoom_status = 'approved',
            zoom_link_id = $1,
            zoom_notes = $2,
            admin_notes = $3,
            zoom_link_manual = $4,
            zoom_meeting_id_manual = $5,
            zoom_passcode_manual = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;
      updateParams = [zoom_link_id, notes || zoomAccountInfo, admin_notes, zoom_link_manual, zoom_meeting_id_manual, zoom_passcode_manual, id];

    } else if (request.request_type === 'room') {
      // Room only request
      updateQuery = `
        UPDATE requests 
        SET status = 'approved',
            room_status = 'approved', 
            admin_notes = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      updateParams = [admin_notes, id];

    } else if (request.request_type === 'both') {
      // Both zoom and room request - Admin IT only approves zoom part
      if (!zoom_link_id && (!zoom_link_manual || (typeof zoom_link_manual === 'string' && zoom_link_manual.trim() === ''))) {
        return res.status(400).json({
          success: false,
          message: 'Zoom account harus dipilih atau informasi zoom manual harus diisi untuk request zoom + ruangan'
        });
      }

      // Get zoom account information
      let zoomAccountInfo = '';
      if (zoom_link_id) {
        const zoomResult = await db.query('SELECT zoom_account_name, max_capacity FROM zoom_links WHERE id = $1', [zoom_link_id]);
        if (zoomResult.rows.length > 0) {
          const zoom = zoomResult.rows[0];
          zoomAccountInfo = `Zoom ${zoom.zoom_account_name} (Kapasitas: ${zoom.max_capacity}) disetujui oleh admin`;
        }
      } else if (zoom_link_manual) {
        zoomAccountInfo = `Zoom manual disetujui oleh admin`;
      }

      // Only update zoom status, room status remains pending for logistik
      updateQuery = `
        UPDATE requests 
        SET zoom_status = 'approved',
            zoom_link_id = $1,
            zoom_notes = $2,
            admin_notes = $3,
            zoom_link_manual = $4,
            zoom_meeting_id_manual = $5,
            zoom_passcode_manual = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `;
      updateParams = [zoom_link_id, notes || zoomAccountInfo, admin_notes, zoom_link_manual, zoom_meeting_id_manual, zoom_passcode_manual, id];
    }

    const result = await db.query(updateQuery, updateParams);

    res.json({
      success: true,
      message: 'Request berhasil disetujui',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const updateQuery = `
      UPDATE requests 
      SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id]);

    res.json({
      success: true,
      message: 'Request ditolak',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getRequestStatusLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT rsl.*, u.name as changed_by_name
      FROM request_status_logs rsl
      LEFT JOIN users u ON rsl.changed_by = u.id
      WHERE rsl.request_id = $1
      ORDER BY rsl.changed_at DESC
    `;

    const result = await db.query(query, [id]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting status logs:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

const getPublicRequests = async (req, res) => {
  try {
    // Get latest requests for landing page (public, no authentication required)
    const latestRequestsQuery = `
      SELECT r.id, r.title, r.user_id, r.request_type, r.status, r.date, r.start_time, r.end_time, r.capacity,
             u.name as user_name, u.email as user_email,
             rm.room_name, rm.location as room_location,
             zl.zoom_link, zl.zoom_account_name
      FROM requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN rooms rm ON r.room_id = rm.id
      LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
      WHERE r.status IN ('approved', 'pending', 'validated_by_admin')
      ORDER BY r.created_at DESC
      LIMIT 5
    `;
    
    const latestResult = await db.query(latestRequestsQuery);
    
    // Get user request history (if user is logged in)
    let userHistory = [];
    if (req.user && req.user.id) {
      const userHistoryQuery = `
        SELECT r.id, r.title, r.request_type, r.status, r.date, r.start_time, r.end_time, r.capacity,
               rm.room_name, rm.location as room_location,
               zl.zoom_link, zl.zoom_account_name
        FROM requests r
        LEFT JOIN rooms rm ON r.room_id = rm.id
        LEFT JOIN zoom_links zl ON r.zoom_link_id = zl.id
        WHERE r.user_id = $1
        ORDER BY r.created_at DESC
        LIMIT 10
      `;
      
      const userHistoryResult = await db.query(userHistoryQuery, [req.user.id]);
      userHistory = userHistoryResult.rows;
    }
    
    res.json({
      success: true,
      data: {
        latestRequests: latestResult.rows,
        userHistory: userHistory
      }
    });
    
  } catch (error) {
    console.error('Error getting public requests:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Export all functions
export {
  getRequestsTest,
  createRequest,
  getMyRequests,
  getAllRequests,
  getRequestById,
  getMyRequestById,
  updateMyRequest,
  cancelRequest,
  getSchedule,
  getRoomRequests,
  getZoomRequests,
  approveRoomRequest,
  rejectRoomRequest,
  adminApproveZoom,
  adminRejectZoom,
  approveRequest,
  rejectRequest,
  getRequestStatusLogs,
  getPublicRequests
};
