(function () {
  var DAY = 1000 * 60 * 60 * 24;

  function mergeSeedData(table, seedRows) {
    var existingRows = CIDA_DB.getData(table);
    var existingMap = existingRows.reduce(function (acc, row) {
      acc[row.id] = row;
      return acc;
    }, {});
    var incomingIds = {};
    var nextRows = seedRows.map(function (row) {
      incomingIds[row.id] = true;
      return existingMap[row.id] ? Object.assign({}, row, existingMap[row.id]) : row;
    });

    existingRows.forEach(function (row) {
      if (!incomingIds[row.id]) {
        nextRows.push(row);
      }
    });

    CIDA_DB.saveData(table, nextRows);
  }

  function buildSeedUsers() {
    return [
      {
        id: "u_admin_001",
        name: "Maintenance Administrator",
        email: "admin@cida.gov.lk",
        password: "Admin@123",
        role: "admin",
        contactDetails: "0112345678",
        address: "CIDA Headquarters, Colombo 07",
      },
      {
        id: "u_dg_001",
        name: "Director General",
        email: "dg@cida.gov.lk",
        password: "Director@123",
        role: "director_general",
        contactDetails: "0112456789",
        address: "CIDA Headquarters, Colombo 07",
      },
      {
        id: "u_owner_001",
        name: "Kamal Perera",
        companyName: "Perera Earth Movers",
        email: "owner@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0771234567",
        address: "14 Lake Road, Colombo 03",
      },
      {
        id: "u_owner_002",
        name: "Nadeesha Fernando",
        companyName: "Fernando Heavy Works",
        email: "nadeesha@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0772345678",
        address: "118 Negombo Road, Wattala",
      },
      {
        id: "u_owner_003",
        name: "Ishan Silva",
        companyName: "Silva Civil Equipment",
        email: "ishan@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0773456789",
        address: "42 Kandy Road, Kadawatha",
      },
      {
        id: "u_owner_004",
        name: "Malsha Jayawardena",
        companyName: "Jayawardena Infra Rentals",
        email: "malsha@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0774567890",
        address: "22 Temple Street, Galle",
      },
      {
        id: "u_owner_005",
        name: "Ruwan Wijesinghe",
        companyName: "Ruwan Construction Plant",
        email: "ruwan@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0775678901",
        address: "7 Kurunegala Road, Dambulla",
      },
      {
        id: "u_owner_006",
        name: "Dinithi Gunasekara",
        companyName: "DG Road Tech",
        email: "dinithi@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0776789012",
        address: "85 Matara Road, Matara",
      },
      {
        id: "u_owner_007",
        name: "Tharindu Ranatunga",
        companyName: "Ranatunga Aggregates",
        email: "tharindu@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0777890123",
        address: "56 Main Street, Anuradhapura",
      },
      {
        id: "u_owner_008",
        name: "Sahan de Alwis",
        companyName: "SDA Plant Hire",
        email: "sahan@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0778901234",
        address: "91 Galle Road, Kalutara",
      },
      {
        id: "u_owner_009",
        name: "Ayesha Samarasinghe",
        companyName: "Ayesha Build Systems",
        email: "ayesha@test.com",
        password: "Owner@123",
        role: "owner",
        contactDetails: "0779012345",
        address: "34 New Town, Ratnapura",
      },
    ];
  }

  function buildSeedMaintenance(now) {
    return [
      {
        id: "mt_001",
        equipmentId: "EQ-EX-001",
        equipmentName: "Komatsu PC210",
        maintenanceDate: new Date(now - DAY * 3).toISOString().slice(0, 10),
        status: "completed",
        maintenanceType: "service",
        location: "Colombo",
        site: "Site A",
        documents: {
          motorTrafficRegistrationCertificate: "pc210-motor-traffic.pdf",
          revenueLicense: "pc210-revenue-license.pdf",
          revenueReport: "pc210-revenue-report.pdf",
        },
        createdAt: now - DAY * 3,
      },
      {
        id: "mt_002",
        equipmentId: "EQ-WL-004",
        equipmentName: "Caterpillar 950M",
        maintenanceDate: new Date(now + DAY * 2).toISOString().slice(0, 10),
        status: "scheduled",
        maintenanceType: "repair",
        location: "Gampaha",
        site: "Depot 2",
        documents: {
          motorTrafficRegistrationCertificate: "950m-motor-traffic.pdf",
          revenueLicense: "950m-revenue-license.pdf",
          revenueReport: "950m-revenue-report.pdf",
        },
        createdAt: now - DAY * 1,
      },
      {
        id: "mt_003",
        equipmentId: "EQ-RL-007",
        equipmentName: "Dynapac CA250",
        maintenanceDate: new Date(now - DAY * 1).toISOString().slice(0, 10),
        status: "overdue",
        maintenanceType: "service",
        location: "Kurunegala",
        site: "Road Project North",
        documents: {
          motorTrafficRegistrationCertificate: "ca250-motor-traffic.pdf",
          revenueLicense: "ca250-revenue-license.pdf",
          revenueReport: "ca250-revenue-report.pdf",
        },
        createdAt: now - DAY * 8,
      },
    ];
  }

  function buildSeedMachinery(now) {
    return [
      {
        id: "m_001",
        ownerId: "u_owner_001",
        type: "WL",
        makeModel: "Caterpillar 950M",
        countryOfOrigin: "USA",
        location: "Colombo 03",
        status: "approved",
        registrationNumber: "CIDA-WL-2026-001",
        registrationDate: now - DAY * 340,
        expiryDate: now + DAY * 25,
        rejectionReason: "",
        documents: {
          revenueLicense: "revenue-license-950m.pdf",
          motorTrafficCertificate: "motor-traffic-950m.pdf",
          affidavit: "owner-affidavit.pdf",
          engineerReport: "engineer-report-950m.pdf",
        },
        appeal: null,
        renewalCount: 1,
        renewalRequestedAt: null,
        certificateIssuedAt: now - DAY * 340,
        submittedAt: now - DAY * 350,
      },
      {
        id: "m_002",
        ownerId: "u_owner_001",
        type: "EX",
        makeModel: "Komatsu PC210",
        countryOfOrigin: "Japan",
        location: "Gampaha",
        status: "pending",
        registrationNumber: null,
        registrationDate: null,
        expiryDate: null,
        rejectionReason: "",
        documents: {
          revenueLicense: "komatsu-license.pdf",
          motorTrafficCertificate: "komatsu-traffic.pdf",
          affidavit: "komatsu-affidavit.pdf",
          engineerReport: "komatsu-engineer-report.pdf",
        },
        appeal: null,
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: null,
        submittedAt: now - DAY * 2,
      },
      {
        id: "m_003",
        ownerId: "u_owner_001",
        type: "RLR",
        makeModel: "Dynapac CA250",
        countryOfOrigin: "Sweden",
        location: "Kurunegala",
        status: "revoked",
        registrationNumber: "CIDA-RLR-2025-014",
        registrationDate: now - DAY * 420,
        expiryDate: now - DAY * 54,
        rejectionReason: "Certificate revoked due to repeated compliance breaches.",
        documents: {
          revenueLicense: "dynapac-license.pdf",
          motorTrafficCertificate: "dynapac-traffic.pdf",
          affidavit: "dynapac-affidavit.pdf",
          engineerReport: "dynapac-engineer.pdf",
        },
        appeal: null,
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: now - DAY * 420,
        submittedAt: now - DAY * 430,
      },
      {
        id: "m_004",
        ownerId: "u_owner_002",
        type: "BHL",
        makeModel: "JCB 3CX",
        countryOfOrigin: "UK",
        location: "Wattala",
        status: "approved",
        registrationNumber: "CIDA-BHL-2026-002",
        registrationDate: now - DAY * 180,
        expiryDate: now + DAY * 185,
        rejectionReason: "",
        documents: {
          revenueLicense: "jcb-license.pdf",
          motorTrafficCertificate: "jcb-traffic.pdf",
          affidavit: "jcb-affidavit.pdf",
          engineerReport: "jcb-engineer.pdf",
        },
        appeal: null,
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: now - DAY * 180,
        submittedAt: now - DAY * 188,
      },
      {
        id: "m_005",
        ownerId: "u_owner_003",
        type: "CRN",
        makeModel: "Kobelco CKE900",
        countryOfOrigin: "Japan",
        location: "Kadawatha",
        status: "rejected",
        registrationNumber: null,
        registrationDate: null,
        expiryDate: null,
        rejectionReason: "Supporting documents were incomplete at the time of review.",
        documents: {
          revenueLicense: "kobelco-license.pdf",
          motorTrafficCertificate: "kobelco-traffic.pdf",
          affidavit: "kobelco-affidavit.pdf",
          engineerReport: "kobelco-engineer.pdf",
        },
        appeal: {
          status: "submitted",
          message: "Updated engineer report has been attached for reconsideration.",
          submittedAt: now - DAY * 1,
          reviewedAt: null,
          adminNotes: "",
        },
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: null,
        submittedAt: now - DAY * 6,
      },
      {
        id: "m_006",
        ownerId: "u_owner_004",
        type: "CNM",
        makeModel: "SANY SY306C-8",
        countryOfOrigin: "China",
        location: "Galle",
        status: "approved",
        registrationNumber: "CIDA-CNM-2026-003",
        registrationDate: now - DAY * 120,
        expiryDate: now + DAY * 245,
        rejectionReason: "",
        documents: {
          revenueLicense: "sany-license.pdf",
          motorTrafficCertificate: "sany-traffic.pdf",
          affidavit: "sany-affidavit.pdf",
          engineerReport: "sany-engineer.pdf",
        },
        appeal: null,
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: now - DAY * 120,
        submittedAt: now - DAY * 127,
      },
      {
        id: "m_007",
        ownerId: "u_owner_005",
        type: "DMP",
        makeModel: "Isuzu CXZ Dump Truck",
        countryOfOrigin: "Japan",
        location: "Dambulla",
        status: "pending_renewal",
        registrationNumber: "CIDA-DMP-2025-021",
        registrationDate: now - DAY * 353,
        expiryDate: now + DAY * 12,
        rejectionReason: "",
        documents: {
          revenueLicense: "isuzu-license.pdf",
          motorTrafficCertificate: "isuzu-traffic.pdf",
          affidavit: "isuzu-affidavit.pdf",
          engineerReport: "isuzu-engineer.pdf",
        },
        appeal: null,
        renewalCount: 1,
        renewalRequestedAt: now - DAY * 2,
        certificateIssuedAt: now - DAY * 353,
        submittedAt: now - DAY * 361,
      },
      {
        id: "m_008",
        ownerId: "u_owner_006",
        type: "MG",
        makeModel: "Caterpillar 140K",
        countryOfOrigin: "USA",
        location: "Matara",
        status: "rejected",
        registrationNumber: null,
        registrationDate: null,
        expiryDate: null,
        rejectionReason: "Inspection identified unsafe braking components.",
        documents: {
          revenueLicense: "grader-license.pdf",
          motorTrafficCertificate: "grader-traffic.pdf",
          affidavit: "grader-affidavit.pdf",
          engineerReport: "grader-engineer.pdf",
        },
        appeal: {
          status: "dismissed",
          message: "Repair work was completed after the first inspection.",
          submittedAt: now - DAY * 20,
          reviewedAt: now - DAY * 16,
          adminNotes: "Appeal dismissed until a fresh inspection report is provided.",
        },
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: null,
        submittedAt: now - DAY * 28,
      },
      {
        id: "m_009",
        ownerId: "u_owner_007",
        type: "PIL",
        makeModel: "Bauer BG 28",
        countryOfOrigin: "Germany",
        location: "Anuradhapura",
        status: "approved",
        registrationNumber: "CIDA-PIL-2026-004",
        registrationDate: now - DAY * 351,
        expiryDate: now + DAY * 14,
        rejectionReason: "",
        documents: {
          revenueLicense: "bauer-license.pdf",
          motorTrafficCertificate: "bauer-traffic.pdf",
          affidavit: "bauer-affidavit.pdf",
          engineerReport: "bauer-engineer.pdf",
        },
        appeal: null,
        renewalCount: 2,
        renewalRequestedAt: null,
        certificateIssuedAt: now - DAY * 351,
        submittedAt: now - DAY * 360,
      },
      {
        id: "m_010",
        ownerId: "u_owner_008",
        type: "CPM",
        makeModel: "Schwing SP 2800",
        countryOfOrigin: "Germany",
        location: "Kalutara",
        status: "approved",
        registrationNumber: "CIDA-CPM-2026-005",
        registrationDate: now - DAY * 90,
        expiryDate: now + DAY * 275,
        rejectionReason: "",
        documents: {
          revenueLicense: "schwing-license.pdf",
          motorTrafficCertificate: "schwing-traffic.pdf",
          affidavit: "schwing-affidavit.pdf",
          engineerReport: "schwing-engineer.pdf",
        },
        appeal: null,
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: now - DAY * 90,
        submittedAt: now - DAY * 97,
      },
    ];
  }

  function seedDatabase() {
    var now = Date.now();
    mergeSeedData("users", buildSeedUsers());
    mergeSeedData("machinery", buildSeedMachinery(now));
    mergeSeedData("maintenance", buildSeedMaintenance(now));
    localStorage.setItem("cida_db_initialized", "true");
  }

  function normalizeAppeal(appeal) {
    if (!appeal) {
      return null;
    }

    return {
      status: appeal.status || "submitted",
      message: appeal.message || "",
      submittedAt: appeal.submittedAt || null,
      reviewedAt: appeal.reviewedAt || null,
      adminNotes: appeal.adminNotes || "",
    };
  }

  function normalizeMachinery() {
    var defaults = {
      revenueLicense: "",
      motorTrafficCertificate: "",
      affidavit: "",
      engineerReport: "",
    };

    var next = CIDA_DB.getData("machinery").map(function (record) {
      return Object.assign({}, record, {
        rejectionReason: record.rejectionReason || "",
        renewalCount: Number(record.renewalCount || 0),
        renewalRequestedAt: record.renewalRequestedAt || null,
        certificateIssuedAt: record.certificateIssuedAt || record.registrationDate || null,
        submittedAt: record.submittedAt || record.registrationDate || Date.now(),
        appeal: normalizeAppeal(record.appeal),
        documents: Object.assign({}, defaults, record.documents || {}),
      });
    });

    CIDA_DB.saveData("machinery", next);
  }

  function normalizeMaintenance() {
    var defaultDocuments = {
      motorTrafficRegistrationCertificate: "",
      revenueLicense: "",
      revenueReport: "",
    };

    var next = CIDA_DB.getData("maintenance").map(function (record) {
      return Object.assign(
        {
          equipmentId: "",
          equipmentName: "",
          maintenanceDate: "",
          status: "scheduled",
          maintenanceType: "service",
          location: "",
          site: "",
          createdAt: Date.now(),
        },
        record,
        {
          documents: Object.assign({}, defaultDocuments, record.documents || {}),
        }
      );
    });

    CIDA_DB.saveData("maintenance", next);
  }

  seedDatabase();
  normalizeMachinery();
  normalizeMaintenance();
})();
