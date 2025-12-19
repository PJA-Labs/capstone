-- Table: users (untuk pegawai, IT admin, logistik)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'it_admin', 'logistik')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: rooms (ruangan rapat)
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    location TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: zoom_links (akun zoom yang tersedia)
CREATE TABLE IF NOT EXISTS zoom_links (
    id SERIAL PRIMARY KEY,
    link_url TEXT NOT NULL,
    host_email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: requests (permintaan utama)
CREATE TABLE IF NOT EXISTS requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(100) NOT NULL,
    purpose TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    request_type VARCHAR(20) CHECK (request_type IN ('zoom_only', 'room_only', 'both')),
    room_id INTEGER REFERENCES rooms(id),
    zoom_link_id INTEGER REFERENCES zoom_links(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'partial')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: request_status_logs (history perubahan status)
CREATE TABLE IF NOT EXISTS request_status_logs (
    id SERIAL PRIMARY KEY,
    request_id INTEGER REFERENCES requests(id),
    changed_by INTEGER REFERENCES users(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    notes TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: notifications (notifikasi untuk user)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    request_id INTEGER REFERENCES requests(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert data sample untuk testing
INSERT INTO users (name, email, password, role) VALUES
('John Doe', 'john@bri.co.id', '$2b$10$hashedpassword', 'user'),
('IT Admin', 'itadmin@bri.co.id', '$2b$10$hashedpassword', 'it_admin'),
('Logistik Team', 'logistik@bri.co.id', '$2b$10$hashedpassword', 'logistik'),
('Jane Smith', 'jane@bri.co.id', '$2b$10$hashedpassword', 'user'),
('Admin BRI', 'admin@bri.co.id', '$2b$10$hashedpassword', 'it_admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO rooms (room_name, capacity, location) VALUES
('Ruang Meeting A', 10, 'Lantai 2'),
('Ruang Meeting B', 20, 'Lantai 3'),
('Ruang Meeting C', 50, 'Lantai 3'),
('Ruang Boardroom', 100, 'Lantai 4'),
('Ruang Conference', 200, 'Lantai 5'),
('Ruang Training', 30, 'Lantai 2')
ON CONFLICT DO NOTHING;

INSERT INTO zoom_links (link_url, host_email) VALUES
('https://zoom.us/j/123456789', 'zoom1@bri.co.id'),
('https://zoom.us/j/987654321', 'zoom2@bri.co.id'),
('https://zoom.us/j/456789123', 'zoom3@bri.co.id'),
('https://zoom.us/j/789123456', 'zoom4@bri.co.id'),
('https://zoom.us/j/321654987', 'zoom5@bri.co.id')
ON CONFLICT DO NOTHING;

-- Sample data untuk testing analytics (menggunakan berbagai tanggal dalam 30 hari terakhir)
INSERT INTO requests (user_id, title, purpose, date, start_time, end_time, capacity, request_type, room_id, zoom_link_id, status, created_at) VALUES
-- Room bookings dengan berbagai kapasitas
(1, 'Team Meeting', 'Monthly team sync', CURRENT_DATE, '09:00:00', '10:00:00', 15, 'room_only', 2, NULL, 'approved', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 'Department Review', 'Quarterly review', CURRENT_DATE - INTERVAL '2 days', '14:00:00', '16:00:00', 45, 'room_only', 3, NULL, 'approved', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(2, 'Training Session', 'New employee orientation', CURRENT_DATE + INTERVAL '1 day', '10:00:00', '12:00:00', 80, 'room_only', 4, NULL, 'approved', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, 'Board Meeting', 'Strategic planning', CURRENT_DATE + INTERVAL '2 days', '13:00:00', '17:00:00', 150, 'room_only', 5, NULL, 'pending', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 'Workshop', 'Technical training', CURRENT_DATE - INTERVAL '1 day', '08:00:00', '17:00:00', 25, 'room_only', 6, NULL, 'rejected', CURRENT_TIMESTAMP - INTERVAL '10 days'),

-- Zoom bookings dengan berbagai kapasitas
(1, 'Client Call', 'Weekly client sync', CURRENT_DATE, '11:00:00', '12:00:00', 25, 'zoom_only', NULL, 1, 'approved', CURRENT_TIMESTAMP - INTERVAL '2 days'),
(4, 'Product Demo', 'Demo for stakeholders', CURRENT_DATE - INTERVAL '3 days', '15:00:00', '16:00:00', 75, 'zoom_only', NULL, 2, 'approved', CURRENT_TIMESTAMP - INTERVAL '8 days'),
(2, 'All Hands Meeting', 'Company update', CURRENT_DATE + INTERVAL '3 days', '09:00:00', '10:30:00', 180, 'zoom_only', NULL, 3, 'approved', CURRENT_TIMESTAMP - INTERVAL '12 days'),
(5, 'Interview Session', 'Candidate interviews', CURRENT_DATE - INTERVAL '5 days', '14:00:00', '15:00:00', 5, 'zoom_only', NULL, 4, 'approved', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(3, 'Training Webinar', 'Skills development', CURRENT_DATE + INTERVAL '5 days', '13:00:00', '16:00:00', 120, 'zoom_only', NULL, 5, 'pending', CURRENT_TIMESTAMP - INTERVAL '4 days'),

-- Combined bookings (both room and zoom)
(1, 'Hybrid Workshop', 'Mixed attendance workshop', CURRENT_DATE + INTERVAL '1 day', '10:00:00', '15:00:00', 60, 'both', 4, 1, 'approved', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(4, 'Client Presentation', 'Q4 Review with remote participants', CURRENT_DATE - INTERVAL '1 day', '14:00:00', '16:00:00', 90, 'both', 5, 2, 'approved', CURRENT_TIMESTAMP - INTERVAL '9 days'),
(2, 'Project Kickoff', 'New project launch', CURRENT_DATE + INTERVAL '4 days', '09:00:00', '11:00:00', 40, 'both', 3, 3, 'pending', CURRENT_TIMESTAMP - INTERVAL '11 days')
ON CONFLICT DO NOTHING;