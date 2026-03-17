(function () {
  var DAYS_30 = 1000 * 60 * 60 * 24 * 30;
  var activeCertificateId = null;

  function getText(key, fallback, replacements) {
    return CIDA_UTILS.getText(key, fallback, replacements);
  }

  function calculateFee(machineCount) {
    if (machineCount >= 100) {
      return 100;
    }

    if (machineCount >= 75) {
      return 300;
    }

    if (machineCount >= 50) {
      return 500;
    }

    if (machineCount >= 25) {
      return 750;
    }

    return 1000;
  }

  function populateMachineryTypes() {
    var select = document.getElementById("machinery-type");
    if (!select) {
      return;
    }

    select.innerHTML =
      '<option value="">' +
      CIDA_UTILS.escapeHtml(getText("owner.selectMachineryType", "Select machinery type")) +
      "</option>" +
      CIDA_CONSTANTS.machineryTypes
        .map(function (type) {
          return '<option value="' + CIDA_UTILS.escapeHtml(type.code) + '">' + CIDA_UTILS.escapeHtml(type.label + " - " + type.code) + "</option>";
        })
        .join("");
  }

  async function getOwnerRecords(ownerId) {
    var records = await CIDA_DB.getData("machinery", { ownerId: ownerId });
    return records.sort(function (a, b) {
      return (b.submittedAt || 0) - (a.submittedAt || 0);
    });
  }

  function isWithinRenewalWindow(row) {
    return row.status === "approved" && row.expiryDate && row.expiryDate >= Date.now() && row.expiryDate - Date.now() <= DAYS_30;
  }

  async function updateFeePreview(ownerId) {
    var feePreview = document.getElementById("owner-fee-preview");
    if (!feePreview) {
      return 0;
    }

    var records = await getOwnerRecords(ownerId);
    var fee = calculateFee(records.length);
    feePreview.textContent = getText("owner.feeTier", "Current fee tier: Rs. {fee}", { fee: fee });
    return fee;
  }

  async function renderNotifications(ownerId) {
    var container = document.getElementById("owner-notifications");
    if (!container) {
      return;
    }

    var records = await getOwnerRecords(ownerId);
    var expiring = records.filter(isWithinRenewalWindow);
    if (!expiring.length) {
      container.hidden = true;
      container.innerHTML = "";
      return;
    }

    container.hidden = false;
    container.innerHTML =
      '<div class="notice-banner__content">' +
      '<p class="eyebrow">' + CIDA_UTILS.escapeHtml(getText("owner.expiringHeading", "Renewal notice")) + "</p>" +
      "<h2>" +
      CIDA_UTILS.escapeHtml(
        getText(
          expiring.length === 1 ? "owner.expiringSingle" : "owner.expiringPlural",
          expiring.length + " certificates expire soon.",
          { count: expiring.length }
        )
      ) +
      "</h2>" +
      '<ul class="notice-list">' +
      expiring
        .map(function (row) {
          return (
            "<li>" +
            CIDA_UTILS.escapeHtml(row.makeModel) +
            " (" +
            CIDA_UTILS.escapeHtml(row.registrationNumber || "-") +
            ") - " +
            CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(row.expiryDate)) +
            "</li>"
          );
        })
        .join("") +
      "</ul>" +
      '<p class="muted">' + CIDA_UTILS.escapeHtml(getText("owner.expiringHelp", "")) + "</p>" +
      "</div>";
  }

  function buildStatusMeta(row) {
    var meta = [];

    if (row.rejectionReason) {
      meta.push(
        '<div class="table-meta"><strong>' +
          CIDA_UTILS.escapeHtml(getText("owner.rejectionReason", "Reason")) +
          ":</strong> " +
          CIDA_UTILS.escapeHtml(row.rejectionReason) +
          "</div>"
      );
    }

    if (row.appeal) {
      meta.push(
        '<div class="table-meta"><strong>' +
          CIDA_UTILS.escapeHtml(getText("owner.appealStatus", "Appeal status")) +
          ":</strong> " +
          CIDA_UTILS.escapeHtml(CIDA_UTILS.getAppealStatusLabel(row.appeal.status)) +
          "</div>"
      );

      if (row.appeal.message) {
        meta.push(
          '<div class="table-meta"><strong>' +
            CIDA_UTILS.escapeHtml(getText("owner.appealMessage", "Appeal")) +
            ":</strong> " +
            CIDA_UTILS.escapeHtml(row.appeal.message) +
            "</div>"
        );
      }

      if (row.appeal.adminNotes) {
        meta.push(
          '<div class="table-meta"><strong>' +
            CIDA_UTILS.escapeHtml(getText("owner.adminNotes", "Admin notes")) +
            ":</strong> " +
            CIDA_UTILS.escapeHtml(row.appeal.adminNotes) +
            "</div>"
        );
      }
    }

    return meta.join("");
  }

  function buildActionMarkup(row) {
    var actions = [];

    if (isWithinRenewalWindow(row)) {
      actions.push(
        '<button type="button" class="button button--ghost js-renew" data-id="' +
          CIDA_UTILS.escapeHtml(row.id) +
          '">' +
          CIDA_UTILS.escapeHtml(getText("owner.renew", "Renew")) +
          "</button>"
      );
    }

    if (row.status === "approved") {
      actions.push(
        '<button type="button" class="button button--primary js-view-certificate" data-id="' +
          CIDA_UTILS.escapeHtml(row.id) +
          '">' +
          CIDA_UTILS.escapeHtml(getText("owner.viewCertificate", "View Certificate")) +
          "</button>"
      );
    }

    if (row.status === "rejected" && (!row.appeal || row.appeal.status === "dismissed")) {
      actions.push(
        '<button type="button" class="button button--ghost js-open-appeal" data-id="' +
          CIDA_UTILS.escapeHtml(row.id) +
          '">' +
          CIDA_UTILS.escapeHtml(getText("owner.submitAppeal", "Submit Appeal")) +
          "</button>"
      );
    }

    if (row.status === "rejected" && row.appeal && row.appeal.status === "submitted") {
      actions.push('<span class="inline-note">' + CIDA_UTILS.escapeHtml(getText("owner.appealPending", "Appeal Pending")) + "</span>");
    }

    return actions.join("");
  }

  async function renderOwnerTable(ownerId) {
    var body = document.getElementById("owner-machinery-body");
    if (!body) {
      return;
    }

    var rows = await getOwnerRecords(ownerId);
    if (!rows.length) {
      body.innerHTML =
        '<tr><td colspan="7" class="empty-state">' +
        CIDA_UTILS.escapeHtml(getText("owner.noRecords", "No machinery records submitted yet.")) +
        "</td></tr>";
      return;
    }

    body.innerHTML = rows
      .map(function (row) {
        var type = CIDA_UTILS.getMachineryTypeDetails(row.type);

        return (
          "<tr>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.registrationNumber || "-") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(type.label + " (" + type.code + ")") + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(row.makeModel) + "</td>" +
          '<td><span class="badge badge--' +
          CIDA_UTILS.escapeHtml(CIDA_UTILS.getStatusTone(row.status)) +
          '">' +
          CIDA_UTILS.escapeHtml(CIDA_UTILS.getStatusLabel(row.status)) +
          "</span>" +
          buildStatusMeta(row) +
          "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(row.registrationDate)) + "</td>" +
          "<td>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(row.expiryDate)) + "</td>" +
          '<td><div class="action-row">' + buildActionMarkup(row) + "</div></td>" +
          "</tr>"
        );
      })
      .join("");

    body.querySelectorAll(".js-renew").forEach(function (button) {
      button.addEventListener("click", async function () {
        await CIDA_DB.update("machinery", button.dataset.id, {
          status: "pending_renewal",
          renewalRequestedAt: Date.now(),
        });
        await renderNotifications(ownerId);
        await renderOwnerTable(ownerId);
        CIDA_UTILS.setFeedback(
          document.getElementById("owner-form-feedback"),
          getText("owner.renewalRequestedFeedback", "Renewal request submitted for review."),
          "success"
        );
      });
    });

    body.querySelectorAll(".js-view-certificate").forEach(function (button) {
      button.addEventListener("click", function () {
        openCertificate(button.dataset.id);
      });
    });

    body.querySelectorAll(".js-open-appeal").forEach(function (button) {
      button.addEventListener("click", function () {
        openAppealModal(button.dataset.id);
      });
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

    if (modal.id === "owner-certificate-modal") {
      activeCertificateId = null;
    }

    modal.hidden = true;
    if (!document.querySelector(".modal:not([hidden])")) {
      document.body.classList.remove("modal-open");
    }
  }

  function renderCertificate(machine, owner) {
    var container = document.getElementById("owner-certificate-content");
    var type = CIDA_UTILS.getMachineryTypeDetails(machine.type);
    if (!container) {
      return;
    }

    container.innerHTML =
      '<article class="certificate-card">' +
      '<p class="eyebrow">CIDA</p>' +
      "<h3>" + CIDA_UTILS.escapeHtml(machine.registrationNumber || "-") + "</h3>" +
      '<p class="certificate-copy">' + CIDA_UTILS.escapeHtml(getText("owner.certificateStatement", "")) + "</p>" +
      '<div class="certificate-grid">' +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("owner.ownerLabel", "Owner")) + "</span><strong>" + CIDA_UTILS.escapeHtml(owner.name) + "</strong></div>" +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("owner.companyLabel", "Company")) + "</span><strong>" + CIDA_UTILS.escapeHtml(owner.companyName || "-") + "</strong></div>" +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("common.type", "Type")) + "</span><strong>" + CIDA_UTILS.escapeHtml(type.label + " (" + type.code + ")") + "</strong></div>" +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("common.model", "Model")) + "</span><strong>" + CIDA_UTILS.escapeHtml(machine.makeModel) + "</strong></div>" +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("common.location", "Location")) + "</span><strong>" + CIDA_UTILS.escapeHtml(machine.location) + "</strong></div>" +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("owner.certificateIssued", "Certificate issued")) + "</span><strong>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(machine.certificateIssuedAt || machine.registrationDate)) + "</strong></div>" +
      "<div><span>" + CIDA_UTILS.escapeHtml(getText("owner.validUntil", "Valid until")) + "</span><strong>" + CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(machine.expiryDate)) + "</strong></div>" +
      "</div>" +
      "</article>";
  }

  async function openCertificate(machineId) {
    var owner = await CIDA_AUTH.getCurrentUser();
    var machine = await CIDA_DB.findById("machinery", machineId);
    if (!owner || !machine) {
      return;
    }

    activeCertificateId = machine.id;
    renderCertificate(machine, owner);
    openModal(document.getElementById("owner-certificate-modal"));
  }

  async function printCertificate() {
    var owner = await CIDA_AUTH.getCurrentUser();
    var machine = activeCertificateId ? await CIDA_DB.findById("machinery", activeCertificateId) : null;
    var type = machine ? CIDA_UTILS.getMachineryTypeDetails(machine.type) : null;
    var printWindow;

    if (!owner || !machine || !type) {
      return;
    }

    printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.alert(getText("owner.noPopup", "The certificate window was blocked by the browser. Allow pop-ups to print or save the certificate as PDF."));
      return;
    }

    printWindow.document.write(
      "<!DOCTYPE html><html><head><title>" +
        CIDA_UTILS.escapeHtml(machine.registrationNumber || "Certificate") +
        "</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#1f2933;}h1,h2,h3,p{margin:0 0 12px;} .eyebrow{text-transform:uppercase;letter-spacing:.12em;color:#666;font-size:12px;} .card{border:2px solid #1d4ed8;border-radius:16px;padding:32px;} .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:24px;} span{display:block;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px;} strong{font-size:16px;} .copy{margin:16px 0 24px;line-height:1.6;}</style></head><body><article class='card'><p class='eyebrow'>CIDA</p><h1>" +
        CIDA_UTILS.escapeHtml(machine.registrationNumber || "-") +
        "</h1><p class='copy'>" +
        CIDA_UTILS.escapeHtml(getText("owner.certificateStatement", "")) +
        "</p><div class='grid'><div><span>" +
        CIDA_UTILS.escapeHtml(getText("owner.ownerLabel", "Owner")) +
        "</span><strong>" +
        CIDA_UTILS.escapeHtml(owner.name) +
        "</strong></div><div><span>" +
        CIDA_UTILS.escapeHtml(getText("owner.companyLabel", "Company")) +
        "</span><strong>" +
        CIDA_UTILS.escapeHtml(owner.companyName || "-") +
        "</strong></div><div><span>" +
        CIDA_UTILS.escapeHtml(getText("common.type", "Type")) +
        "</span><strong>" +
        CIDA_UTILS.escapeHtml(type.label + " (" + type.code + ")") +
        "</strong></div><div><span>" +
        CIDA_UTILS.escapeHtml(getText("common.model", "Model")) +
        "</span><strong>" +
        CIDA_UTILS.escapeHtml(machine.makeModel) +
        "</strong></div><div><span>" +
        CIDA_UTILS.escapeHtml(getText("common.location", "Location")) +
        "</span><strong>" +
        CIDA_UTILS.escapeHtml(machine.location) +
        "</strong></div><div><span>" +
        CIDA_UTILS.escapeHtml(getText("owner.validUntil", "Valid until")) +
        "</span><strong>" +
        CIDA_UTILS.escapeHtml(CIDA_UTILS.formatDate(machine.expiryDate)) +
        "</strong></div></div></article></body></html>"
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  async function openAppealModal(machineId) {
    var modal = document.getElementById("owner-appeal-modal");
    var form = document.getElementById("owner-appeal-form");
    var summary = document.getElementById("owner-appeal-summary");
    var feedback = document.getElementById("owner-appeal-feedback");
    var machine = await CIDA_DB.findById("machinery", machineId);

    if (!modal || !form || !summary || !machine) {
      return;
    }

    form.reset();
    form.dataset.machineId = machineId;
    summary.textContent = (machine.registrationNumber || "Pending") + " - " + machine.makeModel;
    CIDA_UTILS.setFeedback(feedback, "", "");
    openModal(modal);
  }

  function wireAppealForm(ownerId) {
    var form = document.getElementById("owner-appeal-form");
    var feedback = document.getElementById("owner-appeal-feedback");
    if (!form || !feedback) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      var machineId;
      var machine;
      var message;

      event.preventDefault();
      machineId = form.dataset.machineId;
      machine = await CIDA_DB.findById("machinery", machineId);
      message = String((new FormData(form)).get("appealMessage") || "").trim();

      if (!machine || !message) {
        CIDA_UTILS.setFeedback(feedback, getText("owner.appealValidation", "Enter an appeal message before submitting."), "error");
        return;
      }

      await CIDA_DB.update("machinery", machineId, {
        appeal: {
          status: "submitted",
          message: message,
          submittedAt: Date.now(),
          reviewedAt: null,
          adminNotes: "",
        },
      });

      closeModal(document.getElementById("owner-appeal-modal"));
      await renderOwnerTable(ownerId);
      CIDA_UTILS.setFeedback(
        document.getElementById("owner-form-feedback"),
        getText("owner.appealSubmittedFeedback", "Appeal submitted and forwarded to CIDA for review."),
        "success"
      );
    });
  }

  function wireModalControls() {
    document.querySelectorAll("[data-owner-close-modal]").forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal(
          document.getElementById(
            button.dataset.ownerCloseModal === "certificate" ? "owner-certificate-modal" : "owner-appeal-modal"
          )
        );
      });
    });

    var printButton = document.getElementById("owner-certificate-print");
    if (printButton) {
      printButton.addEventListener("click", printCertificate);
    }
  }

  function wireForm(owner) {
    var form = document.getElementById("machinery-form");
    var feedback = document.getElementById("owner-form-feedback");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      var formData;
      var fee;
      var documents;

      event.preventDefault();
      formData = new FormData(form);
      fee = await updateFeePreview(owner.id);
      documents = {
        revenueLicense: (formData.get("revenueLicense") || {}).name || "",
        motorTrafficCertificate: (formData.get("motorTrafficCertificate") || {}).name || "",
        affidavit: (formData.get("affidavit") || {}).name || "",
        engineerReport: (formData.get("engineerReport") || {}).name || "",
      };

      await CIDA_DB.insert("machinery", {
        ownerId: owner.id,
        type: String(formData.get("type") || ""),
        makeModel: String(formData.get("makeModel") || "").trim(),
        countryOfOrigin: String(formData.get("countryOfOrigin") || "").trim(),
        location: String(formData.get("location") || "").trim(),
        status: "pending",
        registrationNumber: null,
        registrationDate: null,
        expiryDate: null,
        rejectionReason: "",
        documents: documents,
        feeAtSubmission: fee,
        appeal: null,
        renewalCount: 0,
        renewalRequestedAt: null,
        certificateIssuedAt: null,
        submittedAt: Date.now(),
      });

      form.reset();
      await updateFeePreview(owner.id);
      await renderNotifications(owner.id);
      await renderOwnerTable(owner.id);
      CIDA_UTILS.setFeedback(feedback, getText("owner.submissionSaved", "Submission successful. Your fee is Rs. {fee}.", { fee: fee }), "success");
    });
  }

  async function renderPage(owner) {
    populateMachineryTypes();
    await updateFeePreview(owner.id);
    await renderNotifications(owner.id);
    await renderOwnerTable(owner.id);

    if (activeCertificateId && !document.getElementById("owner-certificate-modal").hidden) {
      await openCertificate(activeCertificateId);
    }
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var owner;

    if (document.body.dataset.page !== "owner-dashboard") {
      return;
    }

    owner = await CIDA_AUTH.getCurrentUser();
    if (!owner) {
      return;
    }

    wireModalControls();
    wireAppealForm(owner.id);
    wireForm(owner);
    await renderPage(owner);
  });
})();
