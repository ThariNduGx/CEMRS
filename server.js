const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 8000;
const DAY = 1000 * 60 * 60 * 24;
const JWT_SECRET = process.env.JWT_SECRET || 'cida-cemrs-jwt-secret-2026';

// ─── File upload configuration ────────────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, crypto.randomUUID() + ext);
    }
});

const ALLOWED_MIMETYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];

const documentUpload = multer({
    storage: documentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        // Validate both extension AND mimetype (#10 - MIME spoofing prevention)
        if (ALLOWED_EXTENSIONS.includes(ext) && ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and image files (JPG, PNG) are allowed.'));
        }
    }
});

// Rate limiter for document uploads — max 20 uploads per hour per IP (#12)
const uploadRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many uploads. Please try again later.' }
});

// Rate limiter for auth endpoints — max 20 attempts per 15 min per IP
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Too many requests. Please try again later.' }
});

// #5 - Restrict CORS to same origin in production; allow localhost in dev
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [`http://localhost:${8000}`, 'http://127.0.0.1:8000'];

app.use(cors({
    origin: (origin, cb) => {
        // allow same-origin requests (no origin header) and whitelisted origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
        else cb(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

// #13 - Security headers via helmet
app.use(helmet({
    contentSecurityPolicy: false, // disabled to avoid breaking inline scripts/styles in the prototype
    crossOriginEmbedderPolicy: false
}));

// #46 - Support form-urlencoded bodies
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MySQL connection pool (XAMPP default settings)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cida_machinery',
    waitForConnections: true,
    connectionLimit: 10
});

// ─── Auth middleware ──────────────────────────────────────────────────────────

function authenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    try {
        req.user = jwt.verify(auth.slice(7), JWT_SECRET);
        next();
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
}

// Like authenticate, but does not block unauthenticated requests — req.user is set only when a valid token is present
function optionalAuthenticate(req, res, next) {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
        try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); } catch (e) { /* ignore invalid token */ }
    }
    next();
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions.' });
        }
        next();
    };
}

// #3 - Re-check contractor status on every protected contractor request
async function requireActiveContractor(req, res, next) {
    if (req.user.role !== 'contractor') return next();
    try {
        const [rows] = await pool.execute(
            'SELECT status FROM contractors WHERE user_id = ? LIMIT 1',
            [req.user.userId]
        );
        if (!rows.length || rows[0].status !== 'approved') {
            return res.status(403).json({ success: false, message: 'Contractor account is not active.' });
        }
        next();
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Seed data ────────────────────────────────────────────────────────────────

async function seedDatabase(conn) {
    const [[{ count }]] = await conn.execute('SELECT COUNT(*) AS count FROM users');
    if (Number(count) > 0) return;

    console.log('Seeding demo data...');
    const now = Date.now();

    const seedUsers = [
        { id: 'u_admin_001',  name: 'Maintenance Administrator', companyName: null,                        email: 'admin@cida.gov.lk',   password: 'Admin@123',     role: 'admin',            contactDetails: '0112345678', address: 'CIDA Headquarters, Colombo 07' },
        { id: 'u_dg_001',     name: 'Director General',          companyName: null,                        email: 'dg@cida.gov.lk',      password: 'Director@123',  role: 'director_general', contactDetails: '0112456789', address: 'CIDA Headquarters, Colombo 07' },
        { id: 'u_owner_001',  name: 'Kamal Perera',              companyName: 'Perera Earth Movers',       email: 'owner@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0771234567', address: '14 Lake Road, Colombo 03' },
        { id: 'u_owner_002',  name: 'Nadeesha Fernando',         companyName: 'Fernando Heavy Works',      email: 'nadeesha@test.com',   password: 'Owner@123',     role: 'owner',            contactDetails: '0772345678', address: '118 Negombo Road, Wattala' },
        { id: 'u_owner_003',  name: 'Ishan Silva',               companyName: 'Silva Civil Equipment',     email: 'ishan@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0773456789', address: '42 Kandy Road, Kadawatha' },
        { id: 'u_owner_004',  name: 'Malsha Jayawardena',        companyName: 'Jayawardena Infra Rentals', email: 'malsha@test.com',     password: 'Owner@123',     role: 'owner',            contactDetails: '0774567890', address: '22 Temple Street, Galle' },
        { id: 'u_owner_005',  name: 'Ruwan Wijesinghe',          companyName: 'Ruwan Construction Plant',  email: 'ruwan@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0775678901', address: '7 Kurunegala Road, Dambulla' },
        { id: 'u_owner_006',  name: 'Dinithi Gunasekara',        companyName: 'DG Road Tech',              email: 'dinithi@test.com',    password: 'Owner@123',     role: 'owner',            contactDetails: '0776789012', address: '85 Matara Road, Matara' },
        { id: 'u_owner_007',  name: 'Tharindu Ranatunga',        companyName: 'Ranatunga Aggregates',      email: 'tharindu@test.com',   password: 'Owner@123',     role: 'owner',            contactDetails: '0777890123', address: '56 Main Street, Anuradhapura' },
        { id: 'u_owner_008',  name: 'Sahan de Alwis',            companyName: 'SDA Plant Hire',            email: 'sahan@test.com',      password: 'Owner@123',     role: 'owner',            contactDetails: '0778901234', address: '91 Galle Road, Kalutara' },
        { id: 'u_owner_009',  name: 'Ayesha Samarasinghe',       companyName: 'Ayesha Build Systems',      email: 'ayesha@test.com',     password: 'Owner@123',     role: 'owner',            contactDetails: '0779012345', address: '34 New Town, Ratnapura' },
    ];

    for (const u of seedUsers) {
        const hashed = await bcrypt.hash(u.password, 10);
        await conn.execute(
            'INSERT INTO users (id, name, company_name, email, password, role, contact_details, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [u.id, u.name, u.companyName, u.email, hashed, u.role, u.contactDetails, u.address]
        );
    }

    const seedMachinery = [
        { id: 'm_001', ownerId: 'u_owner_001', type: 'WL',  makeModel: 'Caterpillar 950M',      countryOfOrigin: 'USA',     location: 'Colombo 03',    status: 'approved',        registrationNumber: 'CIDA-WL-2026-001',  registrationDate: now - DAY*340, expiryDate: now + DAY*25,  rejectionReason: '', feeAtSubmission: 1000, renewalCount: 1, renewalRequestedAt: null, certificateIssuedAt: now - DAY*340, submittedAt: now - DAY*350, documents: { revenueLicense: 'revenue-license-950m.pdf', motorTrafficCertificate: 'motor-traffic-950m.pdf', affidavit: 'owner-affidavit.pdf', engineerReport: 'engineer-report-950m.pdf' }, appeal: null },
        { id: 'm_002', ownerId: 'u_owner_001', type: 'EX',  makeModel: 'Komatsu PC210',         countryOfOrigin: 'Japan',   location: 'Gampaha',       status: 'pending',         registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null,          submittedAt: now - DAY*2,   documents: { revenueLicense: 'komatsu-license.pdf', motorTrafficCertificate: 'komatsu-traffic.pdf', affidavit: 'komatsu-affidavit.pdf', engineerReport: 'komatsu-engineer-report.pdf' }, appeal: null },
        { id: 'm_003', ownerId: 'u_owner_001', type: 'RLR', makeModel: 'Dynapac CA250',         countryOfOrigin: 'Sweden',  location: 'Kurunegala',    status: 'revoked',         registrationNumber: 'CIDA-RLR-2025-014', registrationDate: now - DAY*420, expiryDate: now - DAY*54,  rejectionReason: 'Certificate revoked due to repeated compliance breaches.', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*420, submittedAt: now - DAY*430, documents: { revenueLicense: 'dynapac-license.pdf', motorTrafficCertificate: 'dynapac-traffic.pdf', affidavit: 'dynapac-affidavit.pdf', engineerReport: 'dynapac-engineer.pdf' }, appeal: null },
        { id: 'm_004', ownerId: 'u_owner_002', type: 'BHL', makeModel: 'JCB 3CX',              countryOfOrigin: 'UK',      location: 'Wattala',       status: 'approved',        registrationNumber: 'CIDA-BHL-2026-002', registrationDate: now - DAY*180, expiryDate: now + DAY*185, rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*180, submittedAt: now - DAY*188, documents: { revenueLicense: 'jcb-license.pdf', motorTrafficCertificate: 'jcb-traffic.pdf', affidavit: 'jcb-affidavit.pdf', engineerReport: 'jcb-engineer.pdf' }, appeal: null },
        { id: 'm_005', ownerId: 'u_owner_003', type: 'CRN', makeModel: 'Kobelco CKE900',       countryOfOrigin: 'Japan',   location: 'Kadawatha',     status: 'rejected',        registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: 'Supporting documents were incomplete at the time of review.', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null, submittedAt: now - DAY*6, documents: { revenueLicense: 'kobelco-license.pdf', motorTrafficCertificate: 'kobelco-traffic.pdf', affidavit: 'kobelco-affidavit.pdf', engineerReport: 'kobelco-engineer.pdf' }, appeal: { status: 'submitted', message: 'Updated engineer report has been attached for reconsideration.', submittedAt: now - DAY*1, reviewedAt: null, adminNotes: '' } },
        { id: 'm_006', ownerId: 'u_owner_004', type: 'CNM', makeModel: 'SANY SY306C-8',        countryOfOrigin: 'China',   location: 'Galle',         status: 'approved',        registrationNumber: 'CIDA-CNM-2026-003', registrationDate: now - DAY*120, expiryDate: now + DAY*245, rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*120, submittedAt: now - DAY*127, documents: { revenueLicense: 'sany-license.pdf', motorTrafficCertificate: 'sany-traffic.pdf', affidavit: 'sany-affidavit.pdf', engineerReport: 'sany-engineer.pdf' }, appeal: null },
        { id: 'm_007', ownerId: 'u_owner_005', type: 'DMP', makeModel: 'Isuzu CXZ Dump Truck', countryOfOrigin: 'Japan',   location: 'Dambulla',      status: 'pending_renewal', registrationNumber: 'CIDA-DMP-2025-021', registrationDate: now - DAY*353, expiryDate: now + DAY*12,  rejectionReason: '', feeAtSubmission: 1000, renewalCount: 1, renewalRequestedAt: now - DAY*2, certificateIssuedAt: now - DAY*353, submittedAt: now - DAY*361, documents: { revenueLicense: 'isuzu-license.pdf', motorTrafficCertificate: 'isuzu-traffic.pdf', affidavit: 'isuzu-affidavit.pdf', engineerReport: 'isuzu-engineer.pdf' }, appeal: null },
        { id: 'm_008', ownerId: 'u_owner_006', type: 'MG',  makeModel: 'Caterpillar 140K',     countryOfOrigin: 'USA',     location: 'Matara',        status: 'rejected',        registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: 'Inspection identified unsafe braking components.', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null, submittedAt: now - DAY*28, documents: { revenueLicense: 'grader-license.pdf', motorTrafficCertificate: 'grader-traffic.pdf', affidavit: 'grader-affidavit.pdf', engineerReport: 'grader-engineer.pdf' }, appeal: { status: 'dismissed', message: 'Repair work was completed after the first inspection.', submittedAt: now - DAY*20, reviewedAt: now - DAY*16, adminNotes: 'Appeal dismissed until a fresh inspection report is provided.' } },
        { id: 'm_009', ownerId: 'u_owner_007', type: 'PIL', makeModel: 'Bauer BG 28',          countryOfOrigin: 'Germany', location: 'Anuradhapura',  status: 'approved',        registrationNumber: 'CIDA-PIL-2026-004', registrationDate: now - DAY*351, expiryDate: now + DAY*14,  rejectionReason: '', feeAtSubmission: 1000, renewalCount: 2, renewalRequestedAt: null, certificateIssuedAt: now - DAY*351, submittedAt: now - DAY*360, documents: { revenueLicense: 'bauer-license.pdf', motorTrafficCertificate: 'bauer-traffic.pdf', affidavit: 'bauer-affidavit.pdf', engineerReport: 'bauer-engineer.pdf' }, appeal: null },
        { id: 'm_010', ownerId: 'u_owner_008', type: 'CPM', makeModel: 'Schwing SP 2800',      countryOfOrigin: 'Germany', location: 'Kalutara',      status: 'approved',        registrationNumber: 'CIDA-CPM-2026-005', registrationDate: now - DAY*90,  expiryDate: now + DAY*275, rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: now - DAY*90,  submittedAt: now - DAY*97,  documents: { revenueLicense: 'schwing-license.pdf', motorTrafficCertificate: 'schwing-traffic.pdf', affidavit: 'schwing-affidavit.pdf', engineerReport: 'schwing-engineer.pdf' }, appeal: null },
        // Admin-approved and awaiting DG certification — demonstrates the new 2-step workflow
        { id: 'm_011', ownerId: 'u_owner_009', type: 'BDZ', makeModel: 'Komatsu D65PX',        countryOfOrigin: 'Japan',   location: 'Ratnapura',     status: 'admin_approved',  registrationNumber: null,                registrationDate: null,          expiryDate: null,          rejectionReason: '', feeAtSubmission: 1000, renewalCount: 0, renewalRequestedAt: null, certificateIssuedAt: null, submittedAt: now - DAY*4, documents: { revenueLicense: 'komatsu-d65-license.pdf', motorTrafficCertificate: 'komatsu-d65-traffic.pdf', affidavit: 'komatsu-d65-affidavit.pdf', engineerReport: 'komatsu-d65-engineer.pdf' }, appeal: null },
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

// ─── Startup: create tables + seed ───────────────────────────────────────────

(async () => {
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MySQL database.');

        await conn.execute(`
            CREATE TABLE IF NOT EXISTS contractors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) DEFAULT NULL,
                full_name VARCHAR(100) NOT NULL,
                company_name VARCHAR(150) NOT NULL,
                cida_number VARCHAR(50) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                contact_details VARCHAR(50) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
                role ENUM('admin','director_general','owner','contractor') NOT NULL,
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
                status ENUM('pending','admin_approved','approved','rejected','revoked','pending_renewal') DEFAULT 'pending',
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
                PRIMARY KEY (id),
                FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // ─── Schema migrations (idempotent) ───────────────────────────────────
        // Add 'contractor' to users.role ENUM if not present
        try {
            await conn.execute(`ALTER TABLE users MODIFY COLUMN role ENUM('admin','director_general','owner','contractor') NOT NULL`);
        } catch (e) { /* already up to date */ }

        // Add 'admin_approved' to machinery.status ENUM if not present
        try {
            await conn.execute(`ALTER TABLE machinery MODIFY COLUMN status ENUM('pending','admin_approved','approved','rejected','revoked','pending_renewal') DEFAULT 'pending'`);
        } catch (e) { /* already up to date */ }

        // Add user_id column to contractors if missing
        try {
            await conn.execute('ALTER TABLE contractors ADD COLUMN user_id VARCHAR(50) DEFAULT NULL AFTER id');
        } catch (e) { /* column already exists */ }

        // Add FK for contractors.user_id if not present
        try {
            await conn.execute('ALTER TABLE contractors ADD CONSTRAINT fk_contractor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL');
        } catch (e) { /* constraint already exists */ }

        // Add maintenance.owner_id FK if not present
        try {
            await conn.execute('ALTER TABLE maintenance ADD CONSTRAINT fk_maintenance_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL');
        } catch (e) { /* constraint already exists or column missing */ }

        // #9 - Make contractors.user_id NOT NULL after ensuring all rows have a value
        try {
            await conn.execute('UPDATE contractors SET user_id = CONCAT("c_legacy_", id) WHERE user_id IS NULL');
            await conn.execute('ALTER TABLE contractors MODIFY COLUMN user_id VARCHAR(50) NOT NULL');
        } catch (e) { /* already NOT NULL */ }

        // #19 - Add indexes on FK columns for query performance
        try { await conn.execute('ALTER TABLE machinery ADD INDEX idx_machinery_owner_id (owner_id)'); } catch (e) {}
        try { await conn.execute('ALTER TABLE rentals ADD INDEX idx_rentals_contractor_id (contractor_id)'); } catch (e) {}
        try { await conn.execute('ALTER TABLE maintenance ADD INDEX idx_maintenance_owner_id (owner_id)'); } catch (e) {}
        try { await conn.execute('ALTER TABLE contractors ADD INDEX idx_contractors_user_id (user_id)'); } catch (e) {}

        await seedDatabase(conn);
        conn.release();
        console.log('Database tables ready.');
    } catch (err) {
        console.error('Database connection error:', err.message);
        console.error('Make sure XAMPP MySQL is running and the database "cida_machinery" exists.');
        console.error('Run the SQL in database.sql to create it, or create it manually in phpMyAdmin.');
    }
})();

// ─── Users API ────────────────────────────────────────────────────────────────

// POST /api/users/login  (public)
app.post('/api/users/login', authRateLimit, async (req, res) => {
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

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ success: true, data: mapUser(user), token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/users/register  (public — owners only)
app.post('/api/users/register', async (req, res) => {
    try {
        const { name, companyName, email, password, contactDetails, address } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Name, email, and password are required.' });
        }

        // #31 - Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return res.json({ success: false, message: 'Invalid email format.' });
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
        const token = jwt.sign({ userId: newUser.id, role: 'owner' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, data: mapUser(newUser), token });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/users  (admin, director_general only)
app.get('/api/users', authenticate, authorize('admin', 'director_general'), async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users');
        res.json({ success: true, data: rows.map(mapUser) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/users/:id  (any authenticated user — needed for profile lookups)
app.get('/api/users/:id', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [req.params.id]);
        if (!rows.length) return res.json({ success: false, data: null });
        res.json({ success: true, data: mapUser(rows[0]) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Machinery API ────────────────────────────────────────────────────────────

// GET /api/machinery
// - public (no token): approved records only  ← public register
// - owner: their own machinery only
// - contractor: approved machinery only
// - admin / director_general: all records (optional ?ownerId filter)
app.get('/api/machinery', optionalAuthenticate, async (req, res) => {
    try {
        let query, params = [];
        const role = req.user ? req.user.role : null;

        if (!role || role === 'contractor') {
            // Public or contractor — approved only
            query = 'SELECT * FROM machinery WHERE status = "approved" ORDER BY submitted_at DESC';
        } else if (role === 'owner') {
            query = 'SELECT * FROM machinery WHERE owner_id = ? ORDER BY submitted_at DESC';
            params = [req.user.userId];
        } else {
            // admin / director_general — all records
            if (req.query.ownerId) {
                query = 'SELECT * FROM machinery WHERE owner_id = ? ORDER BY submitted_at DESC';
                params = [req.query.ownerId];
            } else {
                query = 'SELECT * FROM machinery ORDER BY submitted_at DESC';
            }
        }

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows.map(mapMachinery) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/machinery/expiring  — machines expiring within 30 days (admin / DG)
app.get('/api/machinery/expiring', authenticate, authorize('admin', 'director_general'), async (req, res) => {
    try {
        const now = Date.now();
        const cutoff = now + 30 * DAY;
        const [rows] = await pool.execute(
            'SELECT * FROM machinery WHERE status = "approved" AND expiry_date IS NOT NULL AND expiry_date <= ? AND expiry_date >= ? ORDER BY expiry_date ASC',
            [cutoff, now]
        );
        res.json({ success: true, data: rows.map(mapMachinery) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// GET /api/machinery/:id
app.get('/api/machinery/:id', authenticate, authorize('admin', 'director_general', 'owner', 'contractor'), async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [req.params.id]);
        if (!rows.length) return res.json({ success: false, data: null });

        const machine = mapMachinery(rows[0]);
        // Owner can only view their own machines
        if (req.user.role === 'owner' && machine.ownerId !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        // #1 - Contractor can only view approved machines
        if (req.user.role === 'contractor' && machine.status !== 'approved') {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        res.json({ success: true, data: machine });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/machinery  (owners only)
app.post('/api/machinery', authenticate, authorize('owner'), async (req, res) => {
    try {
        const m = req.body;

        // #26 - Validate machinery type code
        const VALID_TYPES = new Set(['EX','BHL','WL','BDZ','MG','RLR','CRN','TMC','FN','CNM','CBP','CPM','ASP-Cr','ASP-M','CPR','WTR','DMP','LBT','PIL','CMP','GEN','BLN','TWR']);
        if (!m.type || !VALID_TYPES.has(m.type)) {
            return res.status(400).json({ success: false, message: 'Invalid or missing machinery type.' });
        }

        const id = generateId('m');
        await pool.execute(
            `INSERT INTO machinery (id, owner_id, type, make_model, country_of_origin, location, status,
             registration_number, registration_date, expiry_date, rejection_reason, fee_at_submission,
             renewal_count, renewal_requested_at, certificate_issued_at, submitted_at, documents, appeal)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, req.user.userId, m.type, m.makeModel || '', m.countryOfOrigin || '', m.location || '',
                'pending', null, null, null, '', m.feeAtSubmission || 0,
                0, null, null, Date.now(),
                JSON.stringify(m.documents || {}), null
            ]
        );
        const [[row]] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [id]);
        res.json({ success: true, data: mapMachinery(row) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// PATCH /api/machinery/:id  — role-scoped field restrictions
app.patch('/api/machinery/:id', authenticate, authorize('admin', 'director_general', 'owner'), async (req, res) => {
    try {
        const [existing] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [req.params.id]);
        if (!existing.length) {
            return res.status(404).json({ success: false, message: 'Machinery record not found.' });
        }
        const current = mapMachinery(existing[0]);

        // ── Owner: may only request renewal or submit an appeal ──────────────
        if (req.user.role === 'owner') {
            if (current.ownerId !== req.user.userId) {
                return res.status(403).json({ success: false, message: 'Not authorised to modify this record.' });
            }
            const OWNER_ALLOWED = new Set(['status', 'appeal', 'renewalRequestedAt']);
            if (Object.keys(req.body).some(f => !OWNER_ALLOWED.has(f))) {
                return res.status(403).json({ success: false, message: 'Owners may only update renewal or appeal fields.' });
            }
            if (req.body.status && req.body.status !== 'pending_renewal') {
                return res.status(403).json({ success: false, message: 'Owners may only submit a renewal request.' });
            }
        }

        // ── Admin: may only approve (admin_approved) or reject pending items ─
        if (req.user.role === 'admin') {
            const ADMIN_ALLOWED = new Set(['status', 'rejectionReason', 'appeal']);
            if (Object.keys(req.body).some(f => !ADMIN_ALLOWED.has(f))) {
                return res.status(403).json({ success: false, message: 'Admin may only update status and rejection reason.' });
            }
            if (req.body.status && !['admin_approved', 'rejected'].includes(req.body.status)) {
                return res.status(403).json({ success: false, message: 'Admin may only set status to admin_approved or rejected.' });
            }
        }

        // ── Director General: may only set specific status values ────────────
        // (DG sets approved, rejected, revoked, or pending for accepted appeals)
        if (req.user.role === 'director_general' && req.body.status) {
            const DG_ALLOWED_STATUSES = new Set(['approved', 'rejected', 'revoked', 'pending']);
            if (!DG_ALLOWED_STATUSES.has(req.body.status)) {
                return res.status(403).json({ success: false, message: 'Invalid status transition for Director General.' });
            }
        }

        const { setClauses, params } = buildPatchQuery('machinery', machineryFieldMap, req.body);
        if (!setClauses.length) return res.json({ success: false, message: 'No fields to update.' });

        params.push(req.params.id);
        await pool.execute(`UPDATE machinery SET ${setClauses.join(', ')} WHERE id = ?`, params);
        const [[row]] = await pool.execute('SELECT * FROM machinery WHERE id = ? LIMIT 1', [req.params.id]);
        res.json({ success: true, data: row ? mapMachinery(row) : null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Maintenance API ──────────────────────────────────────────────────────────

// GET /api/maintenance — admin sees all; owner sees own
app.get('/api/maintenance', authenticate, authorize('admin', 'owner'), async (req, res) => {
    try {
        let query = 'SELECT * FROM maintenance ORDER BY created_at DESC';
        let params = [];

        if (req.user.role === 'owner') {
            query = 'SELECT * FROM maintenance WHERE owner_id = ? ORDER BY created_at DESC';
            params = [req.user.userId];
        } else if (req.query.ownerId) {
            // Admin can optionally filter by owner
            query = 'SELECT * FROM maintenance WHERE owner_id = ? ORDER BY created_at DESC';
            params = [req.query.ownerId];
        }

        const [rows] = await pool.execute(query, params);
        res.json({ success: true, data: rows.map(mapMaintenance) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/maintenance  (admin or owner)
app.post('/api/maintenance', authenticate, authorize('admin', 'owner'), async (req, res) => {
    try {
        const mt = req.body;
        const id = generateId('mt');
        const ownerId = req.user.role === 'owner' ? req.user.userId : (mt.ownerId || null);

        // #8 - Validate that the equipment belongs to the owner (owner role only)
        if (req.user.role === 'owner' && mt.equipmentId) {
            const [eqRows] = await pool.execute(
                'SELECT id FROM machinery WHERE owner_id = ? AND (id = ? OR registration_number = ?) LIMIT 1',
                [req.user.userId, mt.equipmentId, mt.equipmentId]
            );
            if (!eqRows.length) {
                return res.status(403).json({ success: false, message: 'Equipment does not belong to this owner.' });
            }
        }

        await pool.execute(
            `INSERT INTO maintenance (id, owner_id, equipment_id, equipment_name, maintenance_date, status, maintenance_type, location, site, documents, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, ownerId, mt.equipmentId || '', mt.equipmentName || '',
                mt.maintenanceDate || '', mt.status || 'scheduled', mt.maintenanceType || 'service',
                mt.location || '', mt.site || '',
                JSON.stringify(mt.documents || {}), mt.createdAt || Date.now()
            ]
        );
        const [[row]] = await pool.execute('SELECT * FROM maintenance WHERE id = ? LIMIT 1', [id]);
        res.json({ success: true, data: mapMaintenance(row) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// PATCH /api/maintenance/:id  (admin only)
app.patch('/api/maintenance/:id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { setClauses, params } = buildPatchQuery('maintenance', maintenanceFieldMap, req.body);
        if (!setClauses.length) return res.json({ success: false, message: 'No fields to update.' });

        params.push(req.params.id);
        await pool.execute(`UPDATE maintenance SET ${setClauses.join(', ')} WHERE id = ?`, params);
        const [[row]] = await pool.execute('SELECT * FROM maintenance WHERE id = ? LIMIT 1', [req.params.id]);
        res.json({ success: true, data: row ? mapMaintenance(row) : null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Stats API ────────────────────────────────────────────────────────────────

// GET /api/stats  (admin, director_general)
app.get('/api/stats', authenticate, authorize('admin', 'director_general'), async (req, res) => {
    try {
        const [[{ totalRegistered }]] = await pool.execute('SELECT COUNT(*) AS totalRegistered FROM machinery');
        const [[{ totalApproved }]]   = await pool.execute('SELECT COUNT(*) AS totalApproved FROM machinery WHERE status = "approved"');
        const [[{ totalRevoked }]]    = await pool.execute('SELECT COUNT(*) AS totalRevoked FROM machinery WHERE status = "revoked"');
        const [[{ totalOwners }]]     = await pool.execute('SELECT COUNT(*) AS totalOwners FROM users WHERE role = "owner"');
        const [[{ totalPending }]]    = await pool.execute('SELECT COUNT(*) AS totalPending FROM machinery WHERE status = "pending"');
        const [[{ totalAdminApproved }]] = await pool.execute('SELECT COUNT(*) AS totalAdminApproved FROM machinery WHERE status = "admin_approved"');
        const [[{ totalRejected }]]   = await pool.execute('SELECT COUNT(*) AS totalRejected FROM machinery WHERE status = "rejected"');
        const [[{ totalRenewal }]]    = await pool.execute('SELECT COUNT(*) AS totalRenewal FROM machinery WHERE status = "pending_renewal"');
        res.json({
            success: true,
            data: {
                totalRegistered: Number(totalRegistered),
                totalApproved: Number(totalApproved),
                totalRevoked: Number(totalRevoked),
                totalOwners: Number(totalOwners),
                totalPending: Number(totalPending),
                totalAdminApproved: Number(totalAdminApproved),
                totalRejected: Number(totalRejected),
                totalRenewal: Number(totalRenewal)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Contractors API ──────────────────────────────────────────────────────────

// POST /api/register_contractor.php  (public)
// Priority 2: Also creates a users record so contractor is a specialization of User
app.post('/api/register_contractor.php', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const { full_name, company_name, cida_number, email, password, contact_details } = req.body;

        if (!full_name || !company_name || !cida_number || !email || !password || !contact_details) {
            conn.release();
            return res.json({ success: false, message: 'Incomplete data provided.' });
        }
        if (password.length < 8) {
            conn.release();
            return res.json({ success: false, message: 'Password must be at least 8 characters.' });
        }

        // #31 - Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            conn.release();
            return res.json({ success: false, message: 'Invalid email format.' });
        }

        // #32 - Validate CIDA number format (e.g. CIDA/C/1234)
        const cidaRegex = /^CIDA\/[A-Za-z]\/\d+$/;
        if (!cidaRegex.test(cida_number.trim())) {
            conn.release();
            return res.json({ success: false, message: 'Invalid CIDA number format. Expected format: CIDA/C/1234' });
        }

        // Check both tables for duplicate email
        const [existingContractor] = await conn.execute('SELECT id FROM contractors WHERE email = ? LIMIT 1', [email]);
        const [existingUser]       = await conn.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email.trim().toLowerCase()]);
        if (existingContractor.length || existingUser.length) {
            conn.release();
            return res.json({ success: false, message: 'An account already exists for this email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = generateId('c');

        // #4 - Wrap dual INSERT in a transaction to ensure atomicity
        await conn.beginTransaction();

        // Create users record (contractor specialization — Priority 2)
        await conn.execute(
            'INSERT INTO users (id, name, company_name, email, password, role, contact_details, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, full_name, company_name, email.trim().toLowerCase(), hashedPassword, 'contractor', contact_details, '']
        );

        // Create contractors record with FK to users
        await conn.execute(
            'INSERT INTO contractors (user_id, full_name, company_name, cida_number, email, password, contact_details) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, full_name, company_name, cida_number, email, hashedPassword, contact_details]
        );

        await conn.commit();
        conn.release();
        res.json({ success: true, message: 'Registration successful. Please wait for CIDA admin approval.' });
    } catch (error) {
        await conn.rollback().catch(() => {});
        conn.release();
        console.error('Contractor registration error:', error);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// POST /api/login_contractor.php  (public — returns JWT using users.id)
app.post('/api/login_contractor.php', authRateLimit, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: 'Email and password are required.' });
        }

        const [rows] = await pool.execute(
            'SELECT c.id, c.user_id, c.full_name, c.company_name, c.email, c.password, c.status FROM contractors c WHERE c.email = ? LIMIT 1',
            [email]
        );

        if (!rows.length) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }

        const contractor = rows[0];
        const match = await bcrypt.compare(password, contractor.password);
        if (!match) {
            return res.json({ success: false, message: 'Invalid email or password.' });
        }

        if (contractor.status === 'pending') {
            return res.json({ success: false, message: 'Your account is still pending CIDA approval.' });
        }
        if (contractor.status === 'rejected') {
            return res.json({ success: false, message: 'Your account registration was rejected.' });
        }

        // Use user_id for JWT (Priority 2: contractor IS a user)
        const effectiveUserId = contractor.user_id || String(contractor.id);
        const token = jwt.sign(
            { userId: effectiveUserId, role: 'contractor', contractorId: contractor.id },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: effectiveUserId,
                contractorId: contractor.id,
                full_name: contractor.full_name,
                company_name: contractor.company_name,
                email: contractor.email,
                role: 'contractor'
            }
        });
    } catch (error) {
        console.error('Contractor login error:', error);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// GET/POST /api/admin_contractors.php  (admin only)
app.all('/api/admin_contractors.php', authenticate, authorize('admin'), async (req, res) => {
    try {
        if (req.method === 'GET') {
            const [contractors] = await pool.execute(
                'SELECT id, user_id, full_name, company_name, cida_number, email, contact_details, status, created_at FROM contractors ORDER BY created_at DESC'
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
        console.error('Admin contractors API error:', error);
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Rentals API ──────────────────────────────────────────────────────────────

// GET/POST /api/rentals.php  (admin sees all; contractor sees own + can create)
app.all('/api/rentals.php', authenticate, authorize('admin', 'contractor'), requireActiveContractor, async (req, res) => {
    try {
        if (req.method === 'GET') {
            let query, params = [];
            if (req.user.role === 'contractor') {
                query = `
                    SELECT r.id, r.contractor_id, r.machine_id, r.status, r.start_date, r.end_date, r.created_at,
                           c.company_name, c.full_name
                    FROM rentals r
                    JOIN contractors c ON r.contractor_id = c.id
                    WHERE r.contractor_id = ?
                    ORDER BY r.created_at DESC`;
                params = [req.user.contractorId];
            } else {
                query = `
                    SELECT r.id, r.contractor_id, r.machine_id, r.status, r.start_date, r.end_date, r.created_at,
                           c.company_name, c.full_name
                    FROM rentals r
                    JOIN contractors c ON r.contractor_id = c.id
                    ORDER BY r.created_at DESC`;
            }
            const [rentals] = await pool.execute(query, params);
            res.json({ success: true, rentals });
        } else if (req.method === 'POST') {
            if (req.user.role !== 'contractor') {
                return res.status(403).json({ success: false, message: 'Only contractors can submit rental requests.' });
            }
            const { machine_id, start_date, end_date } = req.body;
            const contractor_id = req.user.contractorId;

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
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// PATCH /api/rentals/:id  (admin only)
app.patch('/api/rentals/:id', authenticate, authorize('admin'), async (req, res) => {
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
        res.status(500).json({ success: false, message: 'Database error occurred.' });
    }
});

// ─── Document upload / serve ──────────────────────────────────────────────────

// POST /api/documents  (owners only — upload one file per call)
app.post('/api/documents', authenticate, authorize('owner'), uploadRateLimit, documentUpload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded or file type not allowed.' });
    }
    res.json({ success: true, filename: req.file.filename, originalName: req.file.originalname });
});

// GET /api/documents/:filename  (admin, director_general, owner — serves stored file)
app.get('/api/documents/:filename', authenticate, authorize('admin', 'director_general', 'owner'), (req, res) => {
    // path.basename prevents directory traversal
    const filename = path.basename(req.params.filename);
    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File not found.' });
    }
    res.sendFile(filePath);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
