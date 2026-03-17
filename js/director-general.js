(function () {
  async function getUsersMap() {
    var users = await CIDA_DB.getData("users");
    return users.reduce(function (acc, user) {
      acc[user.id] = user;
      return acc;
    }, {});
  }

  async function nextRegistrationNumber(machine) {
    var year = new Date().getFullYear();
    var prefix = "CIDA-" + machine.type + "-" + year + "-";
    var all = await CIDA_DB.getData("machinery");
    var count = all.filter(function (item) {
      return item.registrationNumber && item.registrationNumber.indexOf(prefix) === 0;
    }).length;

    return prefix + String(count + 1).padStart(3, "0");
  }

  async function certifyMachine(id) {
    var machine = await CIDA_DB.findById("machinery", id);
    var now;
    var nextRenewalCount;

    if (!machine) {
      return;
    }

    now = Date.now();
    nextRenewalCount = Number(machine.renewalCount || 0) + (machine.status === "pending_renewal" ? 1 : 0);
    await CIDA_DB.update("machinery", id, {
      status: "approved",
      registrationNumber: machine.registrationNumber || (await nextRegistrationNumber(machine)),
      registrationDate: now,
      expiryDate: CIDA_UTILS.addYears(now, 1),
      rejectionReason: "",
      renewalCount: nextRenewalCount,
      renewalRequestedAt: null,
      certificateIssuedAt: now,
    });
  }

  async function rejectMachine(id) {
    var machine = await CIDA_DB.findById("machinery", id);
    var reason = window.prompt("Enter reason for rejection:");

    if (!machine || !reason) {
      return;
    }

    await CIDA_DB.update("machinery", id, {
      status: "rejected",
      rejectionReason: reason.trim(),
      appeal: null,
      renewalRequestedAt: null,
    });
  }

  async function revokeMachine(id) {
    var reason = window.prompt("Enter reason for revocation:");

    if (!reason) {
      return;
    }

    await CIDA_DB.update("machinery", id, {
      status: "revoked",
      rejectionReason: reason.trim(),
    });
  }

  async function updateAppeal(id, status, promptText) {
    var machine = await CIDA_DB.findById("machinery", id);
    var note;

    if (!machine || !machine.appeal) {
      return;
    }

    note = window.prompt(promptText, machine.appeal.adminNotes || "") || "";
    await CIDA_DB.update("machinery", id, {
      status: status === "accepted" ? "pending" : "rejected",
      appeal: {
        status: status,
        message: machine.appeal.message,
        submittedAt: machine.appeal.submittedAt,
        reviewedAt: Date.now(),
        adminNotes: note.trim(),
      },
    });
  }

  function openModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal(modal) {
    if (!modal) {
      return;
    }

    modal.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) {
      document.body.classList.remove("modal-open");
    }
  }

  async function openDocumentPreview(machineId, docKey) {
    var modal = document.getElementById("dg-document-modal");
    var content = document.getElementById("dg-document-content");
    var machine = await CIDA_DB.findById("machinery", machineId);
    var fileName = machine && machine.documents ? machine.documents[docKey] : "";
    var label = CIDA_UTILS.getDocumentLabel(docKey);

    if (!modal || !content || !machine) {
      return;
    }

    content.innerHTML =
      '<article class="doc-preview">' +
      "<h3>" + CIDA_UTILS.escapeHtml(label) + "</h3>" +
      "<p>Attached file: " + CIDA_UTILS.escapeHtml(fileName || "-") + "</p>" +
      '<p class="muted">Document previews are simulated in this prototype.</p>' +
      "</article>";

    openModal(modal);
  }

  async function renderPending() {
    var body = document.getElementById("pending-machinery-body");
    var users = await getUsersMap();
    var pendingRows;

    if (!body) {
      return;
    }

    var all = await CIDA_DB.getData("machinery");
    pendingRows = all.filter(function (item) {
      return item.status === "pending" || item.status === "pending_renewal";
    });

    if (!pendingRows.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty-state">No pending applications.</td></tr>';
      return;
    }

    body.innerHTML = pendingRows
      .map(function (row) {
        var owner = users[row.ownerId] || { name: "Unknown", address: "-" };
        var type = CIDA_UTILS.getMachineryTypeDetails(row.type);
        var documents = CIDA_CONSTANTS.documentTypes
          .filter(function (definition) {
            return row.documents && row.documents[definition.key];
          })
          .map(function (definition) {
            return (
              '<button type="button" class="button button--ghost js-view-doc" data-id="' +
              CIDA_UTILS.escapeHtml(row.id) +
              '" data-doc="' +
              CIDA_UTILS.escapeHtml(definition.key) +
              '">' +
              "View " +
              CIDA_UTILS.escapeHtml(CIDA_UTILS.getDocumentLabel(definition.key)) +
              "</button>"
            );
          })
          .join("");

        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(owner.name) + "<br>" + CIDA_UTILS.escapeHtml(owner.address || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(type.label + " (" + type.code + ")") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.makeModel) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.location) + "</td>" +
          '<td><div class="action-row action-row--stack">' + documents + "</div></td>" +
          '<td><div class="action-row">' +
          '<button type="button" class="button button--primary js-certify" data-id="' + CIDA_UTILS.escapeHtml(row.id) + '">Certify</button>' +
          '<button type="button" class="button button--ghost js-reject" data-id="' + CIDA_UTILS.escapeHtml(row.id) + '">Reject</button>' +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    body.querySelectorAll(".js-view-doc").forEach(function (button) {
      button.addEventListener("click", function () {
        openDocumentPreview(button.dataset.id, button.dataset.doc);
      });
    });

    body.querySelectorAll(".js-certify").forEach(function (button) {
      button.addEventListener("click", async function () {
        await certifyMachine(button.dataset.id);
        await renderAll();
      });
    });

    body.querySelectorAll(".js-reject").forEach(function (button) {
      button.addEventListener("click", async function () {
        await rejectMachine(button.dataset.id);
        await renderAll();
      });
    });
  }

  async function renderApproved(term) {
    var body = document.getElementById("approved-machinery-body");
    var searchTerm = String(term || "").trim().toLowerCase();
    var users = await getUsersMap();
    var rows;

    if (!body) {
      return;
    }

    var all = await CIDA_DB.getData("machinery");
    rows = all
      .filter(function (item) {
        return item.status === "approved" || item.status === "revoked";
      })
      .filter(function (item) {
        var owner = users[item.ownerId] || { name: "" };
        var type = CIDA_UTILS.getMachineryTypeDetails(item.type);
        return (
          !searchTerm ||
          (item.registrationNumber || "").toLowerCase().includes(searchTerm) ||
          owner.name.toLowerCase().includes(searchTerm) ||
          type.label.toLowerCase().includes(searchTerm)
        );
      });

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="6" class="empty-state">No approved or revoked machinery matched the search.</td></tr>';
      return;
    }

    body.innerHTML = rows
      .map(function (row) {
        var owner = users[row.ownerId] || { name: "Unknown" };
        var type = CIDA_UTILS.getMachineryTypeDetails(row.type);
        var revokeAction =
          row.status === "approved"
            ? '<button type="button" class="button button--ghost js-revoke" data-id="' + CIDA_UTILS.escapeHtml(row.id) + '">Revoke Certificate</button>'
            : "";

        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.registrationNumber || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(owner.name) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(type.label + " (" + type.code + ")") + "</td>" +
          '<td><span class="badge badge--' + CIDA_UTILS.escapeHtml(CIDA_UTILS.getStatusTone(row.status)) + '">' + CIDA_UTILS.escapeHtml(CIDA_UTILS.getStatusLabel(row.status)) + "</span></td>" +
          "<td>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(row.expiryDate)) + "</td>" +
          '<td><div class="action-row">' + revokeAction + "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    body.querySelectorAll(".js-revoke").forEach(function (button) {
      button.addEventListener("click", async function () {
        await revokeMachine(button.dataset.id);
        await renderAll();
      });
    });
  }

  async function renderAppeals() {
    var body = document.getElementById("appeals-body");
    var users = await getUsersMap();
    var rows;

    if (!body) {
      return;
    }

    var all = await CIDA_DB.getData("machinery");
    rows = all
      .filter(function (item) {
        return !!item.appeal;
      })
      .sort(function (a, b) {
        return (b.appeal && b.appeal.submittedAt ? b.appeal.submittedAt : 0) - (a.appeal && a.appeal.submittedAt ? a.appeal.submittedAt : 0);
      });

    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="7" class="empty-state">No appeal submissions available.</td></tr>';
      return;
    }

    body.innerHTML = rows
      .map(function (row) {
        var owner = users[row.ownerId] || { name: "Unknown" };
        var type = CIDA_UTILS.getMachineryTypeDetails(row.type);
        var actions = "";

        if (row.appeal.status === "submitted") {
          actions =
            '<button type="button" class="button button--primary js-accept-appeal" data-id="' +
            CIDA_UTILS.escapeHtml(row.id) +
            '">Accept Appeal</button><button type="button" class="button button--ghost js-dismiss-appeal" data-id="' +
            CIDA_UTILS.escapeHtml(row.id) +
            '">Dismiss Appeal</button>';
        } else if (row.appeal.adminNotes) {
          actions = '<div class="table-meta">' + CIDA_UTILS.escapeHtml(row.appeal.adminNotes) + "</div>";
        }

        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(owner.name) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(type.label + " - " + row.makeModel) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.rejectionReason || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.appeal.message || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(row.appeal.submittedAt)) + "</td>" +
          '<td><span class="badge badge--' + (row.appeal.status === "dismissed" ? "revoked" : row.appeal.status === "accepted" ? "approved" : "pending") + '">' + CIDA_UTILS.escapeHtml(CIDA_UTILS.getAppealStatusLabel(row.appeal.status)) + "</span></td>" +
          '<td><div class="action-row">' + actions + "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    body.querySelectorAll(".js-accept-appeal").forEach(function (button) {
      button.addEventListener("click", async function () {
        await updateAppeal(button.dataset.id, "accepted", "Optional note for accepted appeal:");
        await renderAll();
      });
    });

    body.querySelectorAll(".js-dismiss-appeal").forEach(function (button) {
      button.addEventListener("click", async function () {
        await updateAppeal(button.dataset.id, "dismissed", "Optional note for dismissed appeal:");
        await renderAll();
      });
    });
  }

  async function renderReports() {
    var rows = await CIDA_DB.getData("machinery");
    var totals = {
      totalRegistrations: rows.length,
      totalApproved: 0,
      totalRejected: 0,
      totalRenewals: 0,
    };
    var categories = {};
    var list = document.getElementById("report-category-breakdown");

    rows.forEach(function (row) {
      var type = CIDA_UTILS.getMachineryTypeDetails(row.type);
      totals.totalApproved += row.status === "approved" ? 1 : 0;
      totals.totalRejected += row.status === "rejected" ? 1 : 0;
      totals.totalRenewals += Number(row.renewalCount || 0);
      categories[type.label] = (categories[type.label] || 0) + 1;
    });

    document.getElementById("report-total-registrations").textContent = totals.totalRegistrations;
    document.getElementById("report-total-approved").textContent = totals.totalApproved;
    document.getElementById("report-total-rejected").textContent = totals.totalRejected;
    document.getElementById("report-total-renewals").textContent = totals.totalRenewals;

    if (!Object.keys(categories).length) {
      list.innerHTML = '<li class="empty-state">No machinery records available yet.</li>';
      return;
    }

    list.innerHTML = Object.keys(categories)
      .sort()
      .map(function (name) {
        return "<li><span>" + CIDA_UTILS.escapeHtml(name) + "</span><strong>" + CIDA_UTILS.escapeHtml(String(categories[name])) + "</strong></li>";
      })
      .join("");
  }

  function csvEscape(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }

  async function exportCsv() {
    var users = await getUsersMap();
    var lines = [
      [
        "Registration Number",
        "Owner",
        "Type",
        "Model",
        "Status",
        "Expiry Date",
        "Renewal Count",
        "Appeal Status",
      ].join(","),
    ];
    var blob;
    var link;

    var allMachinery = await CIDA_DB.getData("machinery");
    allMachinery.forEach(function (row) {
      var owner = users[row.ownerId] || { name: "Unknown" };
      var type = CIDA_UTILS.getMachineryTypeDetails(row.type);

      lines.push(
        [
          csvEscape(row.registrationNumber || ""),
          csvEscape(owner.name),
          csvEscape(type.label),
          csvEscape(row.makeModel),
          csvEscape(CIDA_UTILS.getStatusLabel(row.status)),
          csvEscape(CIDA_UTILS.formatDate(row.expiryDate)),
          csvEscape(row.renewalCount || 0),
          csvEscape(row.appeal ? CIDA_UTILS.getAppealStatusLabel(row.appeal.status) : ""),
        ].join(",")
      );
    });

    blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "dg-report-" + new Date().toISOString().slice(0, 10) + ".csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function exportPdf() {
    var printWindow = window.open("", "_blank", "width=1000,height=700");
    var list = document.getElementById("report-category-breakdown");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(
      "<!DOCTYPE html><html><head><title>Director General Registration Report</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#1f2933;}h1,h2{margin:0 0 16px;}p{margin:0 0 24px;color:#52606d;} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:24px;} .card{border:1px solid #d9e2ec;border-radius:12px;padding:16px;} ul{padding-left:20px;}</style></head><body><h1>Director General Registration Report</h1><p>Generated on " +
        CIDA_UTILS.escapeHtml(new Date().toLocaleDateString()) +
        "</p><div class='grid'><div class='card'><strong>" +
        CIDA_UTILS.escapeHtml(document.getElementById("report-total-registrations").textContent) +
        "</strong><div>Total registrations</div></div><div class='card'><strong>" +
        CIDA_UTILS.escapeHtml(document.getElementById("report-total-approved").textContent) +
        "</strong><div>Approved certificates</div></div><div class='card'><strong>" +
        CIDA_UTILS.escapeHtml(document.getElementById("report-total-rejected").textContent) +
        "</strong><div>Rejected applications</div></div><div class='card'><strong>" +
        CIDA_UTILS.escapeHtml(document.getElementById("report-total-renewals").textContent) +
        "</strong><div>Completed renewals</div></div></div><h2>Machine categories</h2>" +
        (list ? "<ul>" + list.innerHTML.replace(/<span>/g, "<span>").replace(/<strong>/g, " - <strong>") + "</ul>" : "") +
        "</body></html>"
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  function wireControls() {
    var search = document.getElementById("dg-approved-search");
    var exportCsvButton = document.getElementById("export-report-csv");
    var exportPdfButton = document.getElementById("export-report-pdf");

    if (search) {
      search.addEventListener("input", async function () {
        await renderApproved(search.value);
      });
    }

    if (exportCsvButton) {
      exportCsvButton.addEventListener("click", exportCsv);
    }

    if (exportPdfButton) {
      exportPdfButton.addEventListener("click", exportPdf);
    }

    document.querySelectorAll("[data-dg-close-modal]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal(document.getElementById("dg-document-modal"));
      });
    });
  }

  async function renderAll() {
    var search = document.getElementById("dg-approved-search");
    await renderPending();
    await renderApproved(search ? search.value : "");
    await renderAppeals();
    await renderReports();
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (document.body.dataset.page !== "director-general-dashboard") {
      return;
    }

    wireControls();
    await renderAll();
  });
})();
