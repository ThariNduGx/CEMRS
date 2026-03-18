(function () {
  var SETTINGS_KEY = "cida_maintenance_settings";
  var DAY = 1000 * 60 * 60 * 24;

  function authHeaders(includeContentType) {
    var h = {};
    try {
      var session = JSON.parse(sessionStorage.getItem("cida_session") || "null");
      if (session && session.token) h["Authorization"] = "Bearer " + session.token;
    } catch (e) {}
    if (includeContentType) h["Content-Type"] = "application/json";
    return h;
  }

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
        notificationWindow: 7,
      };
    } catch (error) {
      return { notificationWindow: 7 };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async function getMaintenanceRecords() {
    var records = await CIDA_DB.getData("maintenance");
    return records.slice().sort(function (a, b) {
      return new Date(b.maintenanceDate || 0).getTime() - new Date(a.maintenanceDate || 0).getTime();
    });
  }

  function formatStatus(status) {
    return String(status || "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, function (letter) {
        return letter.toUpperCase();
      });
  }

  function formatType(type) {
    return type === "repair" ? "Repair" : "Service";
  }

  function getAttachmentSummary(record) {
    var definitions = [
      "motorTrafficRegistrationCertificate",
      "revenueLicense",
      "revenueReport",
    ];

    return definitions
      .filter(function (key) {
        return record.documents && record.documents[key];
      })
      .map(function (key) {
        return CIDA_UTILS.getDocumentLabel(key);
      })
      .join(", ");
  }

  function renderDashboard(records) {
    var completed = records.filter(function (record) {
      return record.status === "completed";
    }).length;
    var active = records.filter(function (record) {
      return record.status === "scheduled" || record.status === "overdue";
    }).length;
    var serviceCount = records.filter(function (record) {
      return record.maintenanceType === "service";
    }).length;
    var repairCount = records.filter(function (record) {
      return record.maintenanceType === "repair";
    }).length;
    var locations = {};
    var locationList = document.getElementById("maintenance-location-summary");

    document.getElementById("maintenance-total-records").textContent = records.length;
    document.getElementById("maintenance-completed-records").textContent = completed;
    document.getElementById("maintenance-active-records").textContent = active;
    document.getElementById("maintenance-type-summary").textContent =
      "Service: " + serviceCount + " | Repair: " + repairCount;

    records.forEach(function (record) {
      locations[record.location] = (locations[record.location] || 0) + 1;
    });

    if (!Object.keys(locations).length) {
      locationList.innerHTML = '<li class="empty-state">No maintenance locations recorded yet.</li>';
      return;
    }

    locationList.innerHTML = Object.keys(locations)
      .sort()
      .map(function (name) {
        return "<li><span>" + CIDA_UTILS.escapeHtml(name) + "</span><strong>" + locations[name] + "</strong></li>";
      })
      .join("");
  }

  function renderHistory(records, usersMap) {
    var body = document.getElementById("maintenance-history-body");

    if (!records.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty-state">No maintenance records available.</td></tr>';
      return;
    }

    body.innerHTML = records
      .map(function (record) {
        var owner = (usersMap && record.ownerId && usersMap[record.ownerId]) ? usersMap[record.ownerId] : null;
        var ownerName = owner ? owner.name : (record.ownerId ? "Unknown Owner" : "—");
        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(ownerName) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(record.equipmentName) + "<br><span class='muted' style='font-size:.8em'>" + CIDA_UTILS.escapeHtml(record.equipmentId) + "</span></td>" +
          "<td>" + CIDA_UTILS.escapeHtml(record.maintenanceDate || "-") + "</td>" +
          '<td><span class="badge badge--' + CIDA_UTILS.escapeHtml(record.status) + '">' + CIDA_UTILS.escapeHtml(formatStatus(record.status)) + "</span></td>" +
          "<td>" + CIDA_UTILS.escapeHtml(formatType(record.maintenanceType)) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(record.location + " / " + record.site) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(getAttachmentSummary(record) || "-") + "</td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderReports(records) {
    var counts = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
    };
    var breakdown = document.getElementById("maintenance-status-breakdown");

    records.forEach(function (record) {
      counts[record.status] = (counts[record.status] || 0) + 1;
    });

    var scheduledEl = document.getElementById("maintenance-report-scheduled");
    var progressEl = document.getElementById("maintenance-report-progress");
    var overdueEl = document.getElementById("maintenance-report-overdue");
    if (scheduledEl) scheduledEl.textContent = counts.scheduled;
    if (progressEl) progressEl.textContent = counts.in_progress;
    if (overdueEl) overdueEl.textContent = counts.overdue;

    if (breakdown) {
      breakdown.innerHTML = Object.keys(counts)
        .map(function (status) {
          return "<li><span>" + CIDA_UTILS.escapeHtml(formatStatus(status)) + "</span><strong>" + counts[status] + "</strong></li>";
        })
        .join("");
    }
  }

  function renderAlerts(records) {
    var settings = readSettings();
    var alerts = document.getElementById("maintenance-alerts-list");
    var badge = document.getElementById("notification-badge");
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var rows = records.filter(function (record) {
      var maintenanceTime = new Date(record.maintenanceDate || "").getTime();
      var daysUntil = Math.round((maintenanceTime - today.getTime()) / DAY);

      return record.status === "overdue" || (record.status !== "completed" && daysUntil >= 0 && daysUntil <= settings.notificationWindow);
    });

    if (!rows.length) {
      alerts.innerHTML = '<li class="alert-card" style="text-align:center; padding: 2rem 1rem;"><strong>No active alerts.</strong><span style="display:block; margin-top:0.5rem;">Maintenance notifications will appear here.</span></li>';
      if (badge) badge.hidden = true;
      return;
    }

    if (badge) badge.hidden = false;

    alerts.innerHTML = rows
      .map(function (record) {
        var isOverdue = record.status === "overdue";
        var toneClass = isOverdue ? "color: var(--danger);" : "color: var(--warning);";
        return (
          '<li class="alert-card">' +
          '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
          "<strong>" + CIDA_UTILS.escapeHtml(record.equipmentId) + "</strong>" +
          '<span style="font-weight:600; font-size: 0.8rem; text-transform:uppercase; ' + toneClass + '">' +
          CIDA_UTILS.escapeHtml(formatStatus(record.status)) +
          "</span>" +
          '</div>' +
          '<span style="color: var(--text-main);">' + CIDA_UTILS.escapeHtml(record.equipmentName) + '</span>' +
          '<span style="font-size: 0.85rem;">' +
          "Date: " +
          CIDA_UTILS.escapeHtml(record.maintenanceDate || "-") +
          " &bull; " +
          CIDA_UTILS.escapeHtml(record.location) +
          "</span>" +
          "</li>"
        );
      })
      .join("");
  }

  var adminStatusChart = null;

  async function renderRegistrationSummary() {
    try {
      var session = JSON.parse(sessionStorage.getItem("cida_session") || "null");
      var token = session && session.token ? session.token : "";
      var res = await fetch("/api/stats", { headers: token ? { "Authorization": "Bearer " + token } : {} });
      var result = await res.json();
      if (!result.success) return;
      var s = result.data;
      document.getElementById("summary-total-registered").textContent = s.totalRegistered;
      document.getElementById("summary-total-approved").textContent = s.totalApproved;
      document.getElementById("summary-total-revoked").textContent = s.totalRevoked;
      document.getElementById("summary-total-owners").textContent = s.totalOwners;

      // Priority 4a: Status doughnut chart
      var canvas = document.getElementById("admin-status-chart");
      if (canvas && typeof Chart !== "undefined") {
        var chartData = {
          labels: ["Pending Review", "Admin Approved", "Certified", "Rejected", "Revoked", "Pending Renewal"],
          datasets: [{
            data: [
              s.totalPending || 0,
              s.totalAdminApproved || 0,
              s.totalApproved || 0,
              s.totalRejected || 0,
              s.totalRevoked || 0,
              s.totalRenewal || 0
            ],
            backgroundColor: ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#6b7280", "#8b5cf6"],
            borderWidth: 2,
            borderColor: "#fff"
          }]
        };
        if (adminStatusChart) {
          adminStatusChart.data = chartData;
          adminStatusChart.update();
        } else {
          adminStatusChart = new Chart(canvas, {
            type: "doughnut",
            data: chartData,
            options: {
              plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12, padding: 10 } }
              },
              cutout: "60%"
            }
          });
        }
      }

      // Priority 4b: Expiring certificates
      await renderExpiringCertificates();
    } catch (e) {
      console.error("Failed to load registration summary:", e);
    }
  }

  // Priority 4b: List machines expiring within 30 days
  async function renderExpiringCertificates() {
    var list = document.getElementById("admin-expiring-list");
    if (!list) return;

    try {
      var expiring = await CIDA_DB.getData("machinery/expiring");
      if (!expiring.length) {
        list.innerHTML = '<li style="color: var(--text-muted); font-size:.9rem;">No certificates expiring in the next 30 days.</li>';
        return;
      }

      var users = await CIDA_DB.getData("users");
      var usersMap = users.reduce(function (acc, u) { acc[u.id] = u; return acc; }, {});

      list.innerHTML = expiring.map(function (m) {
        var owner = usersMap[m.ownerId] || { name: "Unknown" };
        var daysLeft = Math.ceil((m.expiryDate - Date.now()) / DAY);
        var tone = daysLeft <= 7 ? "color: var(--danger);" : "color: var(--warning);";
        return "<li style='display:flex;justify-content:space-between;padding:.5rem 0;border-bottom:1px solid var(--border);'>" +
          "<span><strong>" + CIDA_UTILS.escapeHtml(m.registrationNumber || "-") + "</strong> &mdash; " +
          CIDA_UTILS.escapeHtml(owner.name) + "<br><span class='muted' style='font-size:.8rem'>" +
          CIDA_UTILS.escapeHtml(CIDA_UTILS.getMachineryTypeDetails(m.type).label + " / " + m.makeModel) + "</span></span>" +
          "<span style='font-weight:600;font-size:.85rem;" + tone + "'>" + daysLeft + " day" + (daysLeft === 1 ? "" : "s") + " left</span></li>";
      }).join("");
    } catch (e) {
      list.innerHTML = '<li class="muted">Unable to load expiring certificates.</li>';
    }
  }

  async function renderAll() {
    var records = await getMaintenanceRecords();
    renderAlerts(records);
    await renderRegistrationSummary();
  }

  // ─── Priority 3: Admin Machinery Review Queue ─────────────────────────────

  async function loadPendingMachinery() {
    var tbody = document.getElementById("admin-pending-machinery-body");
    var feedback = document.getElementById("admin-machinery-feedback");
    if (!tbody) return;

    try {
      var machinery = await CIDA_DB.getData("machinery");
      var pendingItems = machinery.filter(function (m) { return m.status === "pending"; });

      if (!pendingItems.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;">No pending applications awaiting review.</td></tr>';
        return;
      }

      var users = await CIDA_DB.getData("users");
      var usersMap = users.reduce(function (acc, u) { acc[u.id] = u; return acc; }, {});

      tbody.innerHTML = pendingItems.map(function (m) {
        var owner = usersMap[m.ownerId] || { name: "Unknown", address: "-" };
        var type = CIDA_UTILS.getMachineryTypeDetails(m.type);
        var docButtons = CIDA_CONSTANTS.documentTypes
          .filter(function (d) { return m.documents && m.documents[d.key]; })
          .map(function (d) {
            return '<span class="muted" style="font-size:.8rem;">&#128196; ' + CIDA_UTILS.escapeHtml(CIDA_UTILS.getDocumentLabel(d.key)) + "</span>";
          }).join("<br>");

        return "<tr>" +
          "<td><strong>" + CIDA_UTILS.escapeHtml(owner.name) + "</strong><br><span class='muted' style='font-size:.8rem'>" + CIDA_UTILS.escapeHtml(owner.address || "-") + "</span></td>" +
          "<td>" + CIDA_UTILS.escapeHtml(type.label + " (" + type.code + ")") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(m.makeModel) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(m.location) + "</td>" +
          "<td style='line-height:1.8'>" + (docButtons || '<span class="muted">None</span>') + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(m.submittedAt)) + "</td>" +
          '<td><div class="action-row">' +
          '<button class="button button--primary js-admin-approve" data-id="' + CIDA_UTILS.escapeHtml(m.id) + '">Forward to DG</button>' +
          '<button class="button button--ghost js-admin-reject" data-id="' + CIDA_UTILS.escapeHtml(m.id) + '">Reject</button>' +
          "</div></td></tr>";
      }).join("");

      tbody.querySelectorAll(".js-admin-approve").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          await adminReviewMachinery(this.dataset.id, "admin_approved", null, feedback);
        });
      });

      tbody.querySelectorAll(".js-admin-reject").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          var reason = window.prompt("Enter reason for rejection:");
          if (!reason) return;
          await adminReviewMachinery(this.dataset.id, "rejected", reason, feedback);
        });
      });
    } catch (e) {
      console.error(e);
      CIDA_UTILS.setFeedback(feedback, "Failed to load applications.", "error");
    }
  }

  async function adminReviewMachinery(id, status, rejectionReason, feedbackEl) {
    CIDA_UTILS.setFeedback(feedbackEl, "Updating...", "info");
    var update = { status: status };
    if (rejectionReason) update.rejectionReason = rejectionReason;

    var result = await CIDA_DB.update("machinery", id, update);
    if (result) {
      var msg = status === "admin_approved"
        ? "Application forwarded to Director General for certification."
        : "Application rejected.";
      CIDA_UTILS.setFeedback(feedbackEl, msg, "success");
      await loadPendingMachinery();
      await renderRegistrationSummary();
    } else {
      CIDA_UTILS.setFeedback(feedbackEl, "Failed to update application.", "error");
    }
  }

  function wireAdminReportForm() {
    var form = document.getElementById("admin-maintenance-report-form");
    var feedback = document.getElementById("admin-report-feedback");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      CIDA_UTILS.setFeedback(feedback, "Submitting...", "info");

      var formData = new FormData(form);
      var payload = {
        equipmentName: String(formData.get("equipmentName") || "").trim(),
        equipmentId: String(formData.get("equipmentId") || "").trim(),
        maintenanceDate: String(formData.get("maintenanceDate") || ""),
        maintenanceType: String(formData.get("maintenanceType") || "service"),
        status: String(formData.get("status") || "scheduled"),
        location: String(formData.get("location") || "").trim(),
        site: String(formData.get("site") || "").trim(),
        documents: {},
        createdAt: Date.now(),
      };

      var result = await CIDA_DB.insert("maintenance", payload);
      if (result) {
        form.reset();
        CIDA_UTILS.setFeedback(feedback, "Maintenance report submitted successfully.", "success");
        var records = await getMaintenanceRecords();
        renderAlerts(records);
      } else {
        CIDA_UTILS.setFeedback(feedback, "Failed to submit report. Please try again.", "error");
      }
    });
  }

  function wireSettings() {
    var form = document.getElementById("maintenance-settings-form");
    var feedback = document.getElementById("maintenance-settings-feedback");
    var notificationWindowField = document.getElementById("maintenance-notification-window");
    var settings = readSettings();

    if (!form) {
      return;
    }

    if (notificationWindowField) {
      notificationWindowField.value = settings.notificationWindow;
    }

    form.addEventListener("submit", async function (event) {
      var formData;
      var nextSettings;

      event.preventDefault();
      formData = new FormData(form);
      nextSettings = {
        notificationWindow: Number(formData.get("notificationWindow") || 7),
      };

      saveSettings(nextSettings);
      CIDA_UTILS.setFeedback(feedback, "Settings updated.", "success");
      renderAlerts(await getMaintenanceRecords());
    });
  }

  // --- Contractor Management --- //

  async function loadContractors() {
    var tbody = document.getElementById("admin-contractors-body");
    var feedback = document.getElementById("admin-contractor-feedback");

    if (!tbody) return;

    try {
      var response = await fetch('api/admin_contractors.php', { headers: authHeaders(false) });
      var result = await response.json();

      if (result.success) {
        if (result.contractors.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align: center;">No contractors found.</td></tr>';
          return;
        }

        tbody.innerHTML = result.contractors.map(function(c) {
          var statusStyle = c.status === 'approved' ? 'color: var(--success);' : (c.status === 'rejected' ? 'color: var(--danger);' : 'color: var(--warning);');
          var actionButtons = '';

          if (c.status === 'pending') {
            actionButtons = '<button class="button button--ghost txt-success btn-approve" data-id="' + c.id + '">Approve</button>' +
                            '<button class="button button--ghost txt-danger btn-reject" data-id="' + c.id + '">Reject</button>';
          } else if (c.status === 'approved') {
               actionButtons = '<button class="button button--ghost txt-danger btn-reject" data-id="' + c.id + '">Revoke</button>';
          }

          return '<tr>' +
            '<td><strong>' + CIDA_UTILS.escapeHtml(c.company_name) + '</strong></td>' +
            '<td>' + CIDA_UTILS.escapeHtml(c.cida_number) + '</td>' +
            '<td>' + CIDA_UTILS.escapeHtml(c.full_name) + '</td>' +
            '<td><span class="muted">' + CIDA_UTILS.escapeHtml(c.email) + '<br>' + CIDA_UTILS.escapeHtml(c.contact_details) + '</span></td>' +
            '<td><strong style="' + statusStyle + '">' + CIDA_UTILS.escapeHtml(c.status).toUpperCase() + '</strong></td>' +
            '<td><div class="action-row">' + actionButtons + '</div></td>' +
          '</tr>';
        }).join('');

        var approveBtns = tbody.querySelectorAll('.btn-approve');
        var rejectBtns = tbody.querySelectorAll('.btn-reject');

        approveBtns.forEach(function(btn) {
           btn.addEventListener('click', function() { updateContractorStatus(this.dataset.id, 'approve', feedback); });
        });

        rejectBtns.forEach(function(btn) {
           btn.addEventListener('click', function() { updateContractorStatus(this.dataset.id, 'reject', feedback); });
        });

      } else {
         CIDA_UTILS.setFeedback(feedback, "Failed to load contractors: " + result.message, "error");
      }
    } catch (e) {
      console.error(e);
      CIDA_UTILS.setFeedback(feedback, "Network error loading contractors.", "error");
    }
  }

  async function updateContractorStatus(id, action, feedbackEl) {
    if(!confirm("Are you sure you want to " + action + " this contractor?")) return;

    CIDA_UTILS.setFeedback(feedbackEl, "Updating...", "info");

    try {
      var response = await fetch('api/admin_contractors.php', {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ contractor_id: id, action: action })
      });

      var result = await response.json();

      if(result.success) {
         CIDA_UTILS.setFeedback(feedbackEl, result.message, "success");
         loadContractors();
      } else {
         CIDA_UTILS.setFeedback(feedbackEl, result.message, "error");
      }
    } catch(e) {
       CIDA_UTILS.setFeedback(feedbackEl, "Failed to update contractor.", "error");
    }
  }

  async function loadAdminRentals() {
    var tbody = document.getElementById("admin-rentals-body");
    var feedback = document.getElementById("admin-rental-feedback");
    if (!tbody) return;

    try {
      var response = await fetch("api/rentals.php");
      var result = await response.json();

      if (!result.success) {
        CIDA_UTILS.setFeedback(feedback, "Failed to load rentals: " + result.message, "error");
        return;
      }

      if (!result.rentals.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center;">No rental requests yet.</td></tr>';
        return;
      }

      var machines = await CIDA_DB.getData("machinery");
      var machineMap = machines.reduce(function (acc, m) { acc[m.id] = m; return acc; }, {});

      tbody.innerHTML = result.rentals.map(function (r) {
        var machine = machineMap[r.machine_id] || {};
        var typeLabel = machine.type ? CIDA_UTILS.getMachineryTypeDetails(machine.type).label : "-";
        var regNo = machine.registrationNumber || r.machine_id;
        var statusTone = r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : r.status === "completed" ? "approved" : "pending";
        var actions = "";

        if (r.status === "requested") {
          actions =
            '<button class="button button--primary js-rental-approve" data-id="' + r.id + '">Approve</button>' +
            '<button class="button button--ghost js-rental-reject" data-id="' + r.id + '">Reject</button>';
        } else if (r.status === "approved") {
          actions = '<button class="button button--ghost js-rental-complete" data-id="' + r.id + '">Mark Completed</button>';
        }

        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(r.full_name || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(r.company_name || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(typeLabel + " — " + regNo) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(r.start_date + " to " + r.end_date) + "</td>" +
          '<td><span class="badge badge--' + statusTone + '">' + CIDA_UTILS.escapeHtml(r.status.charAt(0).toUpperCase() + r.status.slice(1)) + "</span></td>" +
          '<td><div class="action-row">' + actions + "</div></td>" +
          "</tr>"
        );
      }).join("");

      tbody.querySelectorAll(".js-rental-approve").forEach(function (btn) {
        btn.addEventListener("click", function () { updateRentalStatus(this.dataset.id, "approved", feedback); });
      });
      tbody.querySelectorAll(".js-rental-reject").forEach(function (btn) {
        btn.addEventListener("click", function () { updateRentalStatus(this.dataset.id, "rejected", feedback); });
      });
      tbody.querySelectorAll(".js-rental-complete").forEach(function (btn) {
        btn.addEventListener("click", function () { updateRentalStatus(this.dataset.id, "completed", feedback); });
      });
    } catch (e) {
      console.error(e);
      CIDA_UTILS.setFeedback(feedback, "Network error loading rentals.", "error");
    }
  }

  async function updateRentalStatus(id, status, feedbackEl) {
    CIDA_UTILS.setFeedback(feedbackEl, "Updating...", "info");
    try {
      var response = await fetch("api/rentals/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status })
      });
      var result = await response.json();
      if (result.success) {
        CIDA_UTILS.setFeedback(feedbackEl, result.message, "success");
        loadAdminRentals();
      } else {
        CIDA_UTILS.setFeedback(feedbackEl, result.message, "error");
      }
    } catch (e) {
      CIDA_UTILS.setFeedback(feedbackEl, "Failed to update rental.", "error");
    }
  }

  function wireNavigation() {
    var navLinks = document.querySelectorAll(".workspace-nav a");
    var panels = document.querySelectorAll(".workspace-main > section");

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var targetId = this.getAttribute("href").substring(1);

        navLinks.forEach(function (l) { l.classList.remove("active"); });
        this.classList.add("active");

        panels.forEach(function (panel) {
          panel.style.display = panel.id === targetId ? "" : "none";
        });

        if (targetId === "pending-machinery-section") {
          loadPendingMachinery();
        }
        if (targetId === "contractors-management-section") {
          loadContractors();
        }
        if (targetId === "registration-summary-section") {
          renderRegistrationSummary();
        }
        if (targetId === "rental-requests-section") {
          loadAdminRentals();
        }
      });
    });

    if (navLinks.length > 0) {
      navLinks[0].classList.add("active");
      panels.forEach(function(p, i) { if (i > 0) p.style.display = "none"; });
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var notifBtn = document.getElementById("notification-button");
    var notifMenu = document.getElementById("notification-dropdown");

    if (document.body.dataset.page !== "admin-dashboard") {
      return;
    }

    if (notifBtn && notifMenu) {
      notifBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        notifMenu.hidden = !notifMenu.hidden;
      });

      document.addEventListener("click", function (e) {
        if (!notifMenu.contains(e.target) && e.target !== notifBtn) {
          notifMenu.hidden = true;
        }
      });
    }

    wireAdminReportForm();
    wireSettings();
    wireNavigation();
    await renderAll();
  });
})();
