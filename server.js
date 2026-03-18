const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8000;
const DAY = 1000 * 60 * 60 * 24;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MySQL connection pool (XAMPP default settings)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',           // XAMPP default: empty password
    database: 'cida_machinery',
    waitForConnections: true,
    connectionLimit: 10
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseJson(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch (e) { return null; }
}

function generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
}

function mapUser(row) {
    return {
        id: row.id,
        name: row.name,
        companyName: row.company_name || null,
        email: row.email,
        role: row.role,
        contactDetails: row.contact_details || '',
        address: row.address || ''
    };
}

function mapMachinery(row) {
    return {
        id: row.id,
        ownerId: row.owner_id,
        type: row.type,
        makeModel: row.make_model,
        countryOfOrigin: row.country_of_origin || '',
        location: row.location || '',
        status: row.status,
        registrationNumber: row.registration_number || null,
        registrationDate: row.registration_date ? Number(row.registration_date) : null,
        expiryDate: row.expiry_date ? Number(row.expiry_date) : null,
        rejectionReason: row.rejection_reason || '',
        feeAtSubmission: row.fee_at_submission || 0,
        renewalCount: row.renewal_count || 0,
        renewalRequestedAt: row.renewal_requested_at ? Number(row.renewal_requested_at) : null,
        certificateIssuedAt: row.certificate_issued_at ? Number(row.certificate_issued_at) : null,
        submittedAt: row.submitted_at ? Number(row.submitted_at) : null,
        documents: parseJson(row.documents) || {},
        appeal: parseJson(row.appeal) || null
    };
}

function mapMaintenance(row) {
    return {
        id: row.id,
        ownerId: row.owner_id || null,
        equipmentId: row.equipment_id,
        equipmentName: row.equipment_name,
        maintenanceDate: row.maintenance_date,
        status: row.status,
        maintenanceType: row.maintenance_type,
        location: row.location || '',
        site: row.site || '',
        documents: parseJson(row.documents) || {},
        createdAt: row.created_at ? Number(row.created_at) : null
    };
}

// Field maps for PATCH (camelCase JS key → snake_case DB column)
const machineryFieldMap = {
    ownerId: 'owner_id',
    type: 'type',
    makeModel: 'make_model',
    countryOfOrigin: 'country_of_origin',
    location: 'location',
    status: 'status',
    registrationNumber: 'registration_number',
    registrationDate: 'registration_date',
    expiryDate: 'expiry_date',
    rejectionReason: 'rejection_reason',
    feeAtSubmission: 'fee_at_submission',
    renewalCount: 'renewal_count',
    renewalRequestedAt: 'renewal_requested_at',
    certificateIssuedAt: 'certificate_issued_at',
    submittedAt: 'submitted_at',
    documents: 'documents',
    appeal: 'appeal'
};

const maintenanceFieldMap = {
    ownerId: 'owner_id',
    equipmentId: 'equipment_id',
    equipmentName: 'equipment_name',
    maintenanceDate: 'maintenance_date',
    status: 'status',
    maintenanceType: 'maintenance_type',
    location: 'location',
    site: 'site',
    documents: 'documents',
    createdAt: 'created_at'
};

const jsonFields = new Set(['documents', 'appeal']);

function buildPatchQuery(table, fieldMap, updates) {
    const setClauses = [];
    const params = [];

    for (const [jsKey, dbCol] of Object.entries(fieldMap)) {
        if (!(jsKey in updates)) continue;
        setClauses.push('`' + dbCol + '` = ?');
        const val = updates[jsKey];
        params.push(jsonFields.has(jsKey) && val !== null ? JSON.stringify(val) : val);
    }

    return { setClauses, params };
}

// ─── Seed data ───────────────────────────────────────────────────────────────

async function seedDatabase(conn) {
    const [[{ count }]] = await conn.execute('SELECT COUNT(*) AS count FROM users');
    if (Number(count) > 0) return;

    console.log('Seeding demo data...');
    const now = Date.now();

    const seedUsers = [
        { id: 'u_admin_001',  name: 'Maintenance Administrator', companyName: null,                      email: 'admin@cida.gov.lk',   password: 'Admin@123',     role: 'admin',            contactDetails: '0112345678', address: 'CIDA Headquarters, Colombo 07' },
        { id: 'u_dg_001',     name: 'Director General',          companyName: null,                      email: 'dg@cida.gov.lk',      password: 'Director@123',  role: 'director_general', contactDetails: '0112456789', address: 'CIDA Headquarters, Colombo 07' },
        { id: 'u_owner_001',  name: 'Kamal Perera',              companyName: 'Perera Earth Movers',     email: 'owner@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0771234567', address: '14 Lake Road, Colombo 03' },
        { id: 'u_owner_002',  name: 'Nadeesha Fernando',         companyName: 'Fernando Heavy Works',    email: 'nadeesha@test.com',   password: 'Owner@123',     role: 'owner',            contactDetails: '0772345678', address: '118 Negombo Road, Wattala' },
        { id: 'u_owner_003',  name: 'Ishan Silva',               companyName: 'Silva Civil Equipment',   email: 'ishan@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0773456789', address: '42 Kandy Road, Kadawatha' },
        { id: 'u_owner_004',  name: 'Malsha Jayawardena',        companyName: 'Jayawardena Infra Rentals', email: 'malsha@test.com',   password: 'Owner@123',     role: 'owner',            contactDetails: '0774567890', address: '22 Temple Street, Galle' },
        { id: 'u_owner_005',  name: 'Ruwan Wijesinghe',          companyName: 'Ruwan Construction Plant', email: 'ruwan@test.com',     password: 'Owner@123',     role: 'owner',            contactDetails: '0775678901', address: '7 Kurunegala Road, Dambulla' },
        { id: 'u_owner_006',  name: 'Dinithi Gunasekara',        companyName: 'DG Road Tech',            email: 'dinithi@test.com',    password: 'Owner@123',     role: 'owner',            contactDetails: '0776789012', address: '85 Matara Road, Matara' },
        { id: 'u_owner_007',  name: 'Tharindu Ranatunga',        companyName: 'Ranatunga Aggregates',    email: 'tharindu@test.com',   password: 'Owner@123',     role: 'owner',            contactDetails: '0777890123', address: '56 Main Street, Anuradhapura' },
        { id: 'u_owner_008',  name: 'Sahan de Alwis',            companyName: 'SDA Plant Hire',          email: 'sahan@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0778901234', address: '91 Galle Road, Kalutara' },
        { id: 'u_owner_009',  name: 'Ayesha Samarasinghe',       companyName: 'Ayesha Build Systems',    email: 'ayesha@test.com',     password: 'Owner@123',     role: 'owner',            contactDetails: '0779012345', address: '34 New Town, Ratnapura' },
    ];

    for (const u of seedUsers) {
        const hashed = await bcrypt.hash(u.password, 10);
        await conn.execute(
            'INSERT INTO users (id, name, company_name, email, password, role, contact_details, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.companyName, u.email, hashed, u.role, u.contactDetails, u.address]
        );
    }

    const seedMachinery = [
        { id: 'm_001', ownerId: 'u_owner_001', type: 'WL',  makeModel: 'Caterpillar 950M',     countryOfOrigin: 'USA',     location: 'Colombo 03',    status: 'approved',        registrationNumber: 'CIDA-WL-2026-001',  registrationDate: now - DAY*340, expiryDate: now + DAY*25,  rejectionReason: '', feeAtSubmission: 1000, renewalCount: 1, renewalRequestedAt: null, certificateIssuedAt: now - DAY*340, submittedAt: now - DAY*350, documents: { revenueLicense: 'revenue-license-950m.pdf', motorTrafficCertificate: 'motor-traffic-950m.pdf', affidavit: 'owner-affidavit.pdf', engineerReport: 'engineer-report-950m.pdf' }, appeal: null },
        { id: 'm_002', ownerId: 'u_owner_001', type: 'EX',  makeModel: 'Komatsu PC210',        countryOfOrigin: 'Japan',   location: 'Gampaha',       status: 'pending',         registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null,          submittedAt: now - DAY*2,   documents: { revenueLicense: 'komatsu-license.pdf', motorTrafficCertificate: 'komatsu-traffic.pdf', affidavit: 'komatsu-affidavit.pdf', engineerReport: 'komatsu-engineer-report.pdf' }, appeal: null },
        { id: 'm_003', ownerId: 'u_owner_001', type: 'RLR', makeModel: 'Dynapac CA250',        countryOfOrigin: 'Sweden',  location: 'Kurunegala',    status: 'revoked',         registrationNumber: 'CIDA-RLR-2025-014', registrationDate: now - DAY*420, expiryDate: now - DAY*54,  rejectionReason: 'Certificate revoked due to repeated compliance breaches.', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*420, submittedAt: now - DAY*430, documents: { revenueLicense: 'dynapac-license.pdf', motorTrafficCertificate: 'dynapac-traffic.pdf', affidavit: 'dynapac-affidavit.pdf', engineerReport: 'dynapac-engineer.pdf' }, appeal: null },
        { id: 'm_004', ownerId: 'u_owner_002', type: 'BHL', makeModel: 'JCB 3CX',             countryOfOrigin: 'UK',      location: 'Wattala',       status: 'approved',        registrationNumber: 'CIDA-BHL-2026-002', registrationDate: now - DAY*180, expiryDate: now + DAY*185, rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*180, submittedAt: now - DAY*188, documents: { revenueLicense: 'jcb-license.pdf', motorTrafficCertificate: 'jcb-traffic.pdf', affidavit: 'jcb-affidavit.pdf', engineerReport: 'jcb-engineer.pdf' }, appeal: null },
        { id: 'm_005', ownerId: 'u_owner_003', type: 'CRN', makeModel: 'Kobelco CKE900',      countryOfOrigin: 'Japan',   location: 'Kadawatha',     status: 'rejected',        registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: 'Supporting documents were incomplete at the time of review.', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null, submittedAt: now - DAY*6, documents: { revenueLicense: 'kobelco-license.pdf', motorTrafficCertificate: 'kobelco-traffic.pdf', affidavit: 'kobelco-affidavit.pdf', engineerReport: 'kobelco-engineer.pdf' }, appeal: { status: 'submitted', message: 'Updated engineer report has been attached for reconsideration.', submittedAt: now - DAY*1, reviewedAt: null, adminNotes: '' } },
        { id: 'm_006', ownerId: 'u_owner_004', type: 'CNM', makeModel: 'SANY SY306C-8',       countryOfOrigin: 'China',   location: 'Galle',         status: 'approved',        registrationNumber: 'CIDA-CNM-2026-003', registrationDate: now - DAY*120, expiryDate: now + DAY*245, rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*120, submittedAt: now - DAY*127, documents: { revenueLicense: 'sany-license.pdf', motorTrafficCertificate: 'sany-traffic.pdf', affidavit: 'sany-affidavit.pdf', engineerReport: 'sany-engineer.pdf' }, appeal: null },
        { id: 'm_007', ownerId: 'u_owner_005', type: 'DMP', makeModel: 'Isuzu CXZ Dump Truck',countryOfOrigin: 'Japan',   location: 'Dambulla',      status: 'pending_renewal', registrationNumber: 'CIDA-DMP-2025-021', registrationDate: now - DAY*353, expiryDate: now + DAY*12,  rejectionReason: '', feeAtSubmission: 1000, renewalCount: 1, renewalRequestedAt: now - DAY*2, certificateIssuedAt: now - DAY*353, submittedAt: now - DAY*361, documents: { revenueLicense: 'isuzu-license.pdf', motorTrafficCertificate: 'isuzu-traffic.pdf', affidavit: 'isuzu-affidavit.pdf', engineerReport: 'isuzu-engineer.pdf' }, appeal: null },
        { id: 'm_008', ownerId: 'u_owner_006', type: 'MG',  makeModel: 'Caterpillar 140K',    countryOfOrigin: 'USA',     location: 'Matara',        status: 'rejected',        registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: 'Inspection identified unsafe braking components.', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null, submittedAt: now - DAY*28, documents: { revenueLicense: 'grader-license.pdf', motorTrafficCertificate: 'grader-traffic.pdf', affidavit: 'grader-affidavit.pdf', engineerReport: 'grader-engineer.pdf' }, appeal: { status: 'dismissed', message: 'Repair work was completed after the first inspection.', submittedAt: now - DAY*20, reviewedAt: now - DAY*16, adminNotes: 'Appeal dismissed until a fresh inspection report is provided.' } },
        { id: 'm_009', ownerId: 'u_owner_007', type: 'PIL', makeModel: 'Bauer BG 28',         countryOfOrigin: 'Germany', location: 'Anuradhapura',  status: 'approved',        registrationNumber: 'CIDA-PIL-2026-004', registrationDate: now - DAY*351, expiryDate: now + DAY*14,  rejectionReason: '', feeAtSubmission: 1000, renewalCount: 2, renewalRequestedAt: null, certificateIssuedAt: now - DAY*351, submittedAt: now - DAY*360, documents: { revenueLicense: 'bauer-license.pdf', motorTrafficCertificate: 'bauer-traffic.pdf', affidavit: 'bauer-affidavit.pdf', engineerReport: 'bauer-engineer.pdf' }, appeal: null },
        { id: 'm_010', ownerId: 'u_owner_008', type: 'CPM', makeModel: 'Schwing SP 2800',     countryOfOrigin: 'Germany', location: 'Kalutara',      status: 'approved',        registrationNumber: 'CIDA-CPM-2026-005', registrationDate: now - DAY*90,  expiryDate: now + DAY*275, rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*90,  submittedAt: now - DAY*97,  documents: { revenueLicense: 'schwing-license.pdf', motorTrafficCertificate: 'schwing-traffic.pdf', affidavit: 'schwing-affidavit.pdf', engineerReport: 'schwing-engineer.pdf' }, appeal: null },
    ];

    for (const m of seedMachinery) {
        await conn.execute(
            `INSERT INTO machinery (id, owner_id, type, make_model, country_of_origin, location, status,
             registration_number, registration_date, expiry_date, rejection_reason, fee_at_submission,
             renewal_count, renewal_requested_at, certificate_issued_at, submitted_at, documents, appeal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                m.id, m.ownerId, m.type, m.makeModel, m.countryOfOrigin, m.location, m.status,
                m.registrationNumber, m.registrationDate, m.expiryDate, m.rejectionReason,
                m.feeAtSubmission, m.renewalCount, m.renewalRequestedAt, m.certificateIssuedAt,
                m.submittedAt, JSON.stringify(m.documents), m.appeal ? JSON.stringify(m.appeal) : null
            ]
        );
    }

    const seedMaintenance = [
        { id: 'mt_001', ownerId: 'u_owner_001', equipmentId: 'CIDA-EX-2026-PC210',  equipmentName: 'Komatsu PC210',    maintenanceDate: new Date(now - DAY*3).toISOString().slice(0,10), status: 'completed', maintenanceType: 'service', location: 'Colombo',    site: 'Site A',             documents: { motorTrafficRegistrationCertificate: 'pc210-motor-traffic.pdf', revenueLicense: 'pc210-revenue-license.pdf', revenueReport: 'pc210-revenue-report.pdf' }, createdAt: now - DAY*3 },
        { id: 'mt_002', ownerId: 'u_owner_001', equipmentId: 'CIDA-WL-2026-001',    equipmentName: 'Caterpillar 950M', maintenanceDate: new Date(now + DAY*2).toISOString().slice(0,10), status: 'scheduled', maintenanceType: 'repair',  location: 'Gampaha',    site: 'Depot 2',            documents: { motorTrafficRegistrationCertificate: '950m-motor-traffic.pdf', revenueLicense: '950m-revenue-license.pdf', revenueReport: '950m-revenue-report.pdf' }, createdAt: now - DAY*1 },
        { id: 'mt_003', ownerId: 'u_owner_001', equipmentId: 'CIDA-RLR-2025-014',   equipmentName: 'Dynapac CA250',    maintenanceDate: new Date(now - DAY*1).toISOString().slice(0,10), status: 'overdue',   maintenanceType: 'service', location: 'Kurunegala', site: 'Road Project North', documents: { motorTrafficRegistrationCertificate: 'ca250-motor-traffic.pdf', revenueLicense: 'ca250-revenue-license.pdf', revenueReport: 'ca250-revenue-report.pdf' }, createdAt: now - DAY*8 },
    ];

    for (const mt of seedMaintenance) {
        await conn.execute(
            `INSERT INTO maintenance (id, owner_id, equipment_id, equipment_name, maintenance_date, status, maintenance_type, location, site, documents, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [mt.id, mt.ownerId, mt.equipmentId, mt.equipmentName, mt.maintenanceDate, mt.status, mt.maintenanceType, mt.location, mt.site, JSON.stringify(mt.documents), mt.createdAt]
        );
    }

    console.log('Demo data seeded successfully.');
}

// ─── Startup: create tables + seed ──────────────────────────────────────────

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MySQL database.');

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS contractors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(100) NOT NULL,
                company_name VARCHAR(150) NOT NULL,
                cida_number VARCHAR(50) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                contact_details VARCHAR(50) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS rentals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                contractor_id INT NOT NULL,
                machine_id VARCHAR(100) NOT NULL,
                status ENUM('requested', 'approved', 'completed', 'rejected') DEFAULT 'requested',
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) NOT NULL,
                name VARCHAR(100) NOT NULL,
                company_name VARCHAR(150) DEFAULT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('admin','director_general','owner') NOT NULL,
                contact_details VARCHAR(50) DEFAULT '',
                address TEXT DEFAULT '',
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS machinery (
                id VARCHAR(50) NOT NULL,
                owner_id VARCHAR(50) NOT NULL,
                type VARCHAR(20) NOT NULL,
                make_model VARCHAR(150) NOT NULL,
                country_of_origin VARCHAR(100) DEFAULT '',
                location VARCHAR(150) DEFAULT '',
                status VARCHAR(30) DEFAULT 'pending',
                registration_number VARCHAR(50) DEFAULT NULL,
                registration_date BIGINT DEFAULT NULL,
                expiry_date BIGINT DEFAULT NULL,
                rejection_reason TEXT DEFAULT '',
                fee_at_submission INT DEFAULT 0,
                renewal_count INT DEFAULT 0,
                renewal_requested_at BIGINT DEFAULT NULL,
                certificate_issued_at BIGINT DEFAULT NULL,
                submitted_at BIGINT DEFAULT NULL,
                documents JSON DEFAULT NULL,
                appeal JSON DEFAULT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS maintenance (
                id VARCHAR(50) NOT NULL,
                owner_id VARCHAR(50) DEFAULT NULL,
                equipment_id VARCHAR(100) NOT NULL,
                equipment_name VARCHAR(150) NOT NULL,
                maintenance_date VARCHAR(10) NOT NULL,
                status VARCHAR(30) DEFAULT 'scheduled',
                maintenance_type VARCHAR(20) DEFAULT 'service',
                location VARCHAR(150) DEFAULT '',
                site VARCHAR(150) DEFAULT '',
                documents JSON DEFAULT NULL,
                created_at BIGINT DEFAULT NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Migrate existing maintenance table to add owner_id if missing
        try {
            await conn.execute('ALTER TABLE maintenance ADD COLUMN owner_id VARCHAR(50) DEFAULT NULL AFTER id');
        } catch (e) { /* column already exists */ }

        await seedDatabase(conn);
        conn.release();
        console.log('Database tables ready.');
    } catch (err) {
        console.error('Database connection error:', err.message);
        console.error('Make sure XAMPP MySQL is running and the database "cida_machinery" exists.');
        console.error('Run the SQL in database.sql to create it, or create it manually in phpMyAdmin.');
    }
})();

// ─── Users API ───────────────────────────────────────────────────────────────

// POST /api/users/login
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required.' });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE email = ? LIMIT 1',
            [email.trim().toLowerCase()]
        );

        if (!rows.length) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }

        res.json({ success: true, data: mapUser(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/users/register
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, companyName, email, password, contactDetails, address } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Name, email, and password are required.' });
        }

        const [existing] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
        if (existing.length) {
            return res.json({ success: false, message: 'An account already exists for that email.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        const id = generateId('u');

        await pool.execute(
            'INSERT INTO users (id, name, company_name, email, password, role, contact_details, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name.trim(), companyName || null, email.trim().toLowerCase(), hashed, 'owner', contactDetails || '', address || '']
        );

        const [[newUser]] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        res.json({ success: true, data: mapUser(newUser) });
    } catch (err) {
        console.error('Register error:', err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/users
app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users');
        res.json({ success: true, data: rows.map(mapUser) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/users/:id
app.get('/api/users/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [req.params.id]);
        if (!rows.length) return res.json({ success: false, data: null });
        res.json({ success: true, data: mapUser(rows[0]) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Machinery API ────────────────────────────────────────────────────────────

// GET /api/machinery   (optional ?ownerId=)
app.get('/api/machinery', async (req, res) => {
    try {
        let query = 'SELECT * FROM machinery ORDER BY submitted_at DESC';
        let params = [];
        if (req.query.ownerId) {
            query = 'SELECT * FROM machinery WHERE owner_id = ? ORDER BY submitted_at DESC';
            params = [req.query.ownerId];
        }
        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows.map(mapMachinery) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/machinery/:id
app.get('/api/machinery/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [req.params.id]);
        if (!rows.length) return res.json({ success: false, data: null });
        res.json({ success: true, data: mapMachinery(rows[0]) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/machinery
app.post('/api/machinery', async (req, res) => {
    try {
        const m = req.body;
        const id = generateId('m');
        await pool.execute(
            `INSERT INTO machinery (id, owner_id, type, make_model, country_of_origin, location, status,
             registration_number, registration_date, expiry_date, rejection_reason, fee_at_submission,
             renewal_count, renewal_requested_at, certificate_issued_at, submitted_at, documents, appeal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, m.ownerId, m.type, m.makeModel || '', m.countryOfOrigin || '', m.location || '',
                m.status || 'pending', m.registrationNumber || null, m.registrationDate || null,
                m.expiryDate || null, m.rejectionReason || '', m.feeAtSubmission || 0,
                m.renewalCount || 0, m.renewalRequestedAt || null, m.certificateIssuedAt || null,
                m.submittedAt || Date.now(),
                JSON.stringify(m.documents || {}), m.appeal ? JSON.stringify(m.appeal) : null
            ]
        );
        const [[row]] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [id]);
        res.json({ success: true, data: mapMachinery(row) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// PATCH /api/machinery/:id
app.patch('/api/machinery/:id', async (req, res) => {
    try {
        const { setClauses, params } = buildPatchQuery('machinery', machineryFieldMap, req.body);
        if (!setClauses.length) return res.json({ success: false, message: 'No fields to update.' });

        params.push(req.params.id);
        await pool.execute(`UPDATE machinery SET ${setClauses.join(', ')} WHERE id = ?`, params);
        const [[row]] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [req.params.id]);
        res.json({ success: true, data: row ? mapMachinery(row) : null });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Maintenance API ──────────────────────────────────────────────────────────

// GET /api/maintenance   (optional ?ownerId=)
app.get('/api/maintenance', async (req, res) => {
    try {
        let query = 'SELECT * FROM maintenance ORDER BY created_at DESC';
        let params = [];
        if (req.query.ownerId) {
            query = 'SELECT * FROM maintenance WHERE owner_id = ? ORDER BY created_at DESC';
            params = [req.query.ownerId];
        }
        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows.map(mapMaintenance) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/maintenance
app.post('/api/maintenance', async (req, res) => {
    try {
        const mt = req.body;
        const id = generateId('mt');
        await pool.execute(
            `INSERT INTO maintenance (id, owner_id, equipment_id, equipment_name, maintenance_date, status, maintenance_type, location, site, documents, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, mt.ownerId || null, mt.equipmentId || '', mt.equipmentName || '',
                mt.maintenanceDate || '', mt.status || 'scheduled', mt.maintenanceType || 'service',
                mt.location || '', mt.site || '',
                JSON.stringify(mt.documents || {}), mt.createdAt || Date.now()
            ]
        );
        const [[row]] = await pool.execute('SELECT * FROM maintenance WHERE id = ? LIMIT 1', [id]);
        res.json({ success: true, data: mapMaintenance(row) });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Stats API ────────────────────────────────────────────────────────────────

// GET /api/stats
app.get('/api/stats', async (req, res) => {
    try {
        const [[{ totalRegistered }]] = await pool.execute('SELECT COUNT(*) AS totalRegistered FROM machinery');
        const [[{ totalApproved }]]   = await pool.execute('SELECT COUNT(*) AS totalApproved FROM machinery WHERE status = "approved"');
        const [[{ totalRevoked }]]    = await pool.execute('SELECT COUNT(*) AS totalRevoked FROM machinery WHERE status = "revoked"');
        const [[{ totalOwners }]]     = await pool.execute('SELECT COUNT(*) AS totalOwners FROM users WHERE role = "owner"');
        res.json({
            success: true,
            data: {
                totalRegistered: Number(totalRegistered),
                totalApproved: Number(totalApproved),
                totalRevoked: Number(totalRevoked),
                totalOwners: Number(totalOwners)
            }
        });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// PATCH /api/maintenance/:id
app.patch('/api/maintenance/:id', async (req, res) => {
    try {
        const { setClauses, params } = buildPatchQuery('maintenance', maintenanceFieldMap, req.body);
        if (!setClauses.length) return res.json({ success: false, message: 'No fields to update.' });

        params.push(req.params.id);
        await pool.execute(`UPDATE maintenance SET ${setClauses.join(', ')} WHERE id = ?`, params);
        const [[row]] = await pool.execute('SELECT * FROM maintenance WHERE id = ? LIMIT 1', [req.params.id]);
        res.json({ success: true, data: row ? mapMaintenance(row) : null });
    } catch (err) {
        console.error(err);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Contractors API (existing) ───────────────────────────────────────────────

// API: Register Contractor
app.post('/api/register_contractor.php', async (req, res) => {
    try {
        const { full_name, company_name, cida_number, email, password, contact_details } = req.body;

        if (!full_name || !company_name || !cida_number || !email || !password || !contact_details) {
            return res.json({ success: false, message: 'Incomplete data provided.' });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters.' });
        }

        const [existing] = await pool.execute('SELECT id FROM contractors WHERE email = ? LIMIT 1', [email]);
        if (existing.length > 0) {
            return res.json({ success: false, message: 'Contractor account already exists for this email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.execute(
            'INSERT INTO contractors (full_name, company_name, cida_number, email, password, contact_details) VALUES (?, ?, ?, ?, ?, ?)',
            [full_name, company_name, cida_number, email, hashedPassword, contact_details]
        );

        res.json({ success: true, message: 'Registration successful. Please wait for CIDA admin approval.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// API: Login Contractor
app.post('/api/login_contractor.php', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required.' });
        }

        const [users] = await pool.execute(
            'SELECT id, full_name, company_name, email, password, status FROM contractors WHERE email = ? LIMIT 1',
            [email]
        );

        if (users.length === 0) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }

        if (user.status === 'pending') {
            return res.json({ success: false, message: 'Your account is still pending CIDA approval.' });
        } else if (user.status === 'rejected') {
            return res.json({ success: false, message: 'Your account registration was rejected.' });
        } else if (user.status === 'approved') {
            delete user.password;
            user.role = 'contractor';
            return res.json({ success: true, message: 'Login successful.', user });
        } else {
            return res.json({ success: false, message: 'Unknown account status.' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// API: Admin Contractors (GET = list, POST = approve/reject)
app.all('/api/admin_contractors.php', async (req, res) => {
    try {
        if (req.method === 'GET') {
            const [contractors] = await pool.execute(
                'SELECT id, full_name, company_name, cida_number, email, contact_details, status, created_at FROM contractors ORDER BY created_at DESC'
            );
            res.json({ success: true, contractors });
        } else if (req.method === 'POST') {
            const { contractor_id, action } = req.body;

            if (!contractor_id || !action) {
                return res.json({ success: false, message: 'Contractor ID and action are required.' });
            }

            if (action !== 'approve' && action !== 'reject') {
                return res.json({ success: false, message: 'Invalid action.' });
            }

            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            await pool.execute('UPDATE contractors SET status = ? WHERE id = ?', [newStatus, contractor_id]);
            res.json({ success: true, message: `Contractor status updated to ${newStatus}.` });
        } else {
            res.json({ success: false, message: 'Invalid method.' });
        }
    } catch (error) {
        console.error('Admin API error:', error);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// API: Rentals (GET = list, POST = create)
app.all('/api/rentals.php', async (req, res) => {
    try {
        if (req.method === 'GET') {
            const [rentals] = await pool.execute(`
                SELECT r.id, r.contractor_id, r.machine_id, r.status, r.start_date, r.end_date, r.created_at, c.company_name, c.full_name
                FROM rentals r
                JOIN contractors c ON r.contractor_id = c.id
                ORDER BY r.created_at DESC
            `);
            res.json({ success: true, rentals });
        } else if (req.method === 'POST') {
            const { contractor_id, machine_id, start_date, end_date } = req.body;

            if (!contractor_id || !machine_id || !start_date || !end_date) {
                return res.json({ success: false, message: 'Missing rental request details.' });
            }

            const [result] = await pool.execute(
                'INSERT INTO rentals (contractor_id, machine_id, start_date, end_date) VALUES (?, ?, ?, ?)',
                [contractor_id, machine_id, start_date, end_date]
            );

            res.json({ success: true, message: 'Rental request submitted successfully.', rental_id: result.insertId });
        } else {
            res.json({ success: false, message: 'Invalid method.' });
        }
    } catch (error) {
        console.error('Rentals API error:', error);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

// PATCH /api/rentals/:id  — update rental status (admin)
app.patch('/api/rentals/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const allowed = ['requested', 'approved', 'completed', 'rejected'];
        if (!status || !allowed.includes(status)) {
            return res.json({ success: false, message: 'Invalid or missing status value.' });
        }
        await pool.execute('UPDATE rentals SET status = ? WHERE id = ?', [status, req.params.id]);
        res.json({ success: true, message: 'Rental status updated.' });
    } catch (error) {
        console.error('Rental PATCH error:', error);
        res.json({ success: false, message: 'Database error occurred.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
