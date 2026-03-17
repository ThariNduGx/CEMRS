const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static HTML files from root

// Database setup
const dbPath = path.resolve(__dirname, 'cida_machinery.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Initialize tables
        db.run(`CREATE TABLE IF NOT EXISTS contractors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            company_name TEXT NOT NULL,
            cida_number TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            contact_details TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS rentals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contractor_id INTEGER NOT NULL,
            machine_id TEXT NOT NULL,
            status TEXT DEFAULT 'requested',
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (contractor_id) REFERENCES contractors(id) ON DELETE CASCADE
        )`);
    }
});

// Helper for promise-based queries
const dbAll = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// API: Register Contractor
app.post('/api/register_contractor.php', async (req, res) => {
    try {
        const { full_name, company_name, cida_number, email, password, contact_details } = req.body;
        
        if (!full_name || !company_name || !cida_number || !email || !password || !contact_details) {
            return res.json({ success: false, message: "Incomplete data provided." });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters." });
        }

        const existing = await dbAll("SELECT id FROM contractors WHERE email = ? LIMIT 1", [email]);
        if (existing.length > 0) {
            return res.json({ success: false, message: "Contractor account already exists for this email." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await dbRun(
            "INSERT INTO contractors (full_name, company_name, cida_number, email, password, contact_details) VALUES (?, ?, ?, ?, ?, ?)",
            [full_name, company_name, cida_number, email, hashedPassword, contact_details]
        );

        res.json({ success: true, message: "Registration successful. Please wait for CIDA admin approval." });
    } catch (error) {
        console.error("Registration error:", error);
        res.json({ success: false, message: "Database error occurred." });
    }
});

// API: Login Contractor
app.post('/api/login_contractor.php', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.json({ success: false, message: "Email and password are required." });
        }

        const users = await dbAll("SELECT id, full_name, company_name, email, password, status FROM contractors WHERE email = ? LIMIT 1", [email]);
        
        if (users.length === 0) {
            return res.json({ success: false, message: "Invalid email or password." });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({ success: false, message: "Invalid email or password." });
        }

        if (user.status === 'pending') {
            return res.json({ success: false, message: "Your account is still pending CIDA approval." });
        } else if (user.status === 'rejected') {
            return res.json({ success: false, message: "Your account registration was rejected." });
        } else if (user.status === 'approved') {
            delete user.password;
            user.role = 'contractor';
            return res.json({ success: true, message: "Login successful.", user });
        } else {
            return res.json({ success: false, message: "Unknown account status." });
        }

    } catch (error) {
        console.error("Login error:", error);
        res.json({ success: false, message: "Database error occurred." });
    }
});

// API: Admin Contractors
app.all('/api/admin_contractors.php', async (req, res) => {
    try {
        if (req.method === 'GET') {
            const contractors = await dbAll("SELECT id, full_name, company_name, cida_number, email, contact_details, status, created_at FROM contractors ORDER BY created_at DESC");
            res.json({ success: true, contractors });
        } else if (req.method === 'POST') {
            const { contractor_id, action } = req.body;
            
            if (!contractor_id || !action) {
                return res.json({ success: false, message: "Contractor ID and action are required." });
            }

            if (action !== 'approve' && action !== 'reject') {
                return res.json({ success: false, message: "Invalid action." });
            }

            const newStatus = action === 'approve' ? 'approved' : 'rejected';
            
            await dbRun("UPDATE contractors SET status = ? WHERE id = ?", [newStatus, contractor_id]);
            res.json({ success: true, message: `Contractor status updated to ${newStatus}.` });
        } else {
             res.json({ success: false, message: "Invalid method." });
        }
    } catch (error) {
        console.error("Admin API error:", error);
        res.json({ success: false, message: "Database error occurred." });
    }
});

// API: Rentals
app.all('/api/rentals.php', async (req, res) => {
    try {
        if (req.method === 'GET') {
            const rentals = await dbAll(`
                SELECT r.id, r.contractor_id, r.machine_id, r.status, r.start_date, r.end_date, r.created_at, c.company_name 
                FROM rentals r 
                JOIN contractors c ON r.contractor_id = c.id 
                ORDER BY r.created_at DESC
            `);
            res.json({ success: true, rentals });
        } else if (req.method === 'POST') {
            const { contractor_id, machine_id, start_date, end_date } = req.body;
            
            if (!contractor_id || !machine_id || !start_date || !end_date) {
                return res.json({ success: false, message: "Missing rental request details." });
            }

            const result = await dbRun(
                "INSERT INTO rentals (contractor_id, machine_id, start_date, end_date) VALUES (?, ?, ?, ?)",
                [contractor_id, machine_id, start_date, end_date]
            );

            res.json({ success: true, message: "Rental request submitted successfully.", rental_id: result.lastID });
        } else {
             res.json({ success: false, message: "Invalid method." });
        }
    } catch (error) {
        console.error("Rentals API error:", error);
        res.json({ success: false, message: "Database error occurred." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
