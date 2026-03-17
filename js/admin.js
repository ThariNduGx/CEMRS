(function () {
  var SETTINGS_KEY = "cida_maintenance_settings";
  var DAY = 1000 * 60 * 60 * 24;

  function readSettings() {
    try {
      return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
        notificationWindow: 7,
        defaultStatus: "scheduled",
      };
    } catch (error) {
      return {
        notificationWindow: 7,
        defaultStatus: "scheduled",
      };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function getMaintenanceRecords() {
    return CIDA_DB.getData("maintenance").slice().sort(function (a, b) {
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

  function renderHistory(records) {
    var body = document.getElementById("maintenance-history-body");

    if (!records.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty-state">No maintenance records available.</td></tr>';
      return;
    }

    body.innerHTML = records
      .map(function (record) {
        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(record.equipmentId) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(record.equipmentName) + "</td>" +
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

    document.getElementById("maintenance-report-scheduled").textContent = counts.scheduled;
    document.getElementById("maintenance-report-progress").textContent = counts.in_progress;
    document.getElementById("maintenance-report-overdue").textContent = counts.overdue;

    breakdown.innerHTML = Object.keys(counts)
      .map(function (status) {
        return "<li><span>" + CIDA_UTILS.escapeHtml(formatStatus(status)) + "</span><strong>" + counts[status] + "</strong></li>";
      })
      .join("");
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
          '<div class="action-row" style="margin-top: 0.5rem;">' +
          '<button type="button" class="button button--ghost" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">View Details</button>' +
          '<button type="button" class="button button--ghost" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; color: var(--text-muted); border-color: transparent;">Dismiss</button>' +
          '</div>' +
          "</li>"
        );
      })
      .join("");
  }

  function renderAll() {
    var records = getMaintenanceRecords();
    renderDashboard(records);
    renderHistory(records);
    renderReports(records);
    renderAlerts(records);
  }

  function wireForm() {
    var form = document.getElementById("maintenance-form");
    var feedback = document.getElementById("maintenance-form-feedback");
    var statusField;

    if (!form) {
      return;
    }

    statusField = form.querySelector('[name="status"]');
    if (statusField) {
      statusField.value = readSettings().defaultStatus;
    }

    form.addEventListener("submit", function (event) {
      var formData;
      var settings;

      event.preventDefault();
      formData = new FormData(form);
      settings = readSettings();

      CIDA_DB.insert("maintenance", {
        equipmentId: String(formData.get("equipmentId") || "").trim(),
        equipmentName: String(formData.get("equipmentName") || "").trim(),
        maintenanceDate: String(formData.get("maintenanceDate") || "").trim(),
        status: String(formData.get("status") || settings.defaultStatus),
        maintenanceType: String(formData.get("maintenanceType") || "service"),
        location: String(formData.get("location") || "").trim(),
        site: String(formData.get("site") || "").trim(),
        documents: {
          motorTrafficRegistrationCertificate: (formData.get("motorTrafficRegistrationCertificate") || {}).name || "",
          revenueLicense: (formData.get("revenueLicense") || {}).name || "",
          revenueReport: (formData.get("revenueReport") || {}).name || "",
        },
        createdAt: Date.now(),
      });

      form.reset();
      if (statusField) {
        statusField.value = settings.defaultStatus;
      }
      CIDA_UTILS.setFeedback(feedback, "Maintenance record saved successfully.", "success");
      renderAll();
    });
  }

  function wireSettings() {
    var form = document.getElementById("maintenance-settings-form");
    var feedback = document.getElementById("maintenance-settings-feedback");
    var settings = readSettings();
    var defaultStatusField = document.getElementById("maintenance-default-status");
    var notificationWindowField = document.getElementById("maintenance-notification-window");

    if (!form) {
      return;
    }

    defaultStatusField.value = settings.defaultStatus;
    notificationWindowField.value = settings.notificationWindow;

    form.addEventListener("submit", function (event) {
      var formData;
      var nextSettings;

      event.preventDefault();
      formData = new FormData(form);
      nextSettings = {
        notificationWindow: Number(formData.get("notificationWindow") || 7),
        defaultStatus: String(formData.get("defaultStatus") || "scheduled"),
      };

      saveSettings(nextSettings);
      document.getElementById("maintenance-form").querySelector('[name="status"]').value = nextSettings.defaultStatus;
      CIDA_UTILS.setFeedback(feedback, "Maintenance settings updated.", "success");
      renderAlerts(getMaintenanceRecords());
    });
  }

  // --- New Contractor Management Functions --- //

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

        // Wire buttons
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
         loadContractors(); // reload table
      } else {
         CIDA_UTILS.setFeedback(feedbackEl, result.message, "error");
      }
    } catch(e) {
       CIDA_UTILS.setFeedback(feedbackEl, "Failed to update contractor.", "error");
    }
  }
  
  function wireNavigation() {
      // Handle the sidebar navigation to toggle sections
      var navLinks = document.querySelectorAll(".workspace-nav a");
      var panels = document.querySelectorAll(".workspace-main > section");

      navLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          var targetId = this.getAttribute("href").substring(1);

          navLinks.forEach(function (l) { l.classList.remove("active"); });
          this.classList.add("active");

          panels.forEach(function (panel) {
            if (panel.id === targetId) {
              panel.style.display = "";
            } else {
              panel.style.display = "none";
            }
          });
          
          if(targetId === "contractors-management-section") {
              loadContractors();
          }
        });
      });
      
      // Set initial state
      if (navLinks.length > 0) {
        navLinks[0].classList.add("active");
        panels.forEach(function(p, i) { if(i>0) p.style.display = "none"; });
      }
  }

  document.addEventListener("DOMContentLoaded", function () {
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

    wireForm();
    wireSettings();
    wireNavigation();
    renderAll();
  });
})();
