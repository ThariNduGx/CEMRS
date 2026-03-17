(function () {
  var SETTINGS_KEY = "cida_maintenance_settings";
  var DAY = 1000 * 60 * 60 * 24;

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

  async function renderRegistrationSummary() {
    try {
      var res = await fetch("/api/stats");
      var result = await res.json();
      if (!result.success) return;
      var s = result.data;
      document.getElementById("summary-total-registered").textContent = s.totalRegistered;
      document.getElementById("summary-total-approved").textContent = s.totalApproved;
      document.getElementById("summary-total-revoked").textContent = s.totalRevoked;
      document.getElementById("summary-total-owners").textContent = s.totalOwners;
    } catch (e) {
      console.error("Failed to load registration summary:", e);
    }
  }

  async function renderAll() {
    var records = await getMaintenanceRecords();
    renderAlerts(records);
    await renderRegistrationSummary();
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
      var response = await fetch('api/admin_contractors.php');
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
        headers: { 'Content-Type': 'application/json' },
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

        if (targetId === "contractors-management-section") {
          loadContractors();
        }
        if (targetId === "registration-summary-section") {
          renderRegistrationSummary();
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
