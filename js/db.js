(function () {
  // Reads the JWT from sessionStorage and returns the Authorization header value.
  function getAuthHeader() {
    try {
      var session = JSON.parse(sessionStorage.getItem("cida_session") || "null");
      return session && session.token ? "Bearer " + session.token : "";
    } catch (e) {
      return "";
    }
  }

  function authHeaders(includeContentType) {
    var h = {};
    var token = getAuthHeader();
    if (token) h["Authorization"] = token;
    if (includeContentType) h["Content-Type"] = "application/json";
    return h;
  }

  var DB = {
    getData: async function (table, filters) {
      try {
        var url = "/api/" + table;
        if (filters) {
          url += "?" + new URLSearchParams(filters).toString();
        }
        var res = await fetch(url, { headers: authHeaders(false) });
        var json = await res.json();
        return json.data || [];
      } catch (error) {
        console.error("Failed to fetch table", table, error);
        return [];
      }
    },

    insert: async function (table, record) {
      try {
        var res = await fetch("/api/" + table, {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify(record),
        });
        var json = await res.json();
        return json.data || null;
      } catch (error) {
        console.error("Failed to insert into", table, error);
        return null;
      }
    },

    update: async function (table, id, updatedFields) {
      try {
        var res = await fetch("/api/" + table + "/" + id, {
          method: "PATCH",
          headers: authHeaders(true),
          body: JSON.stringify(updatedFields),
        });
        var json = await res.json();
        return json.data || null;
      } catch (error) {
        console.error("Failed to update", table, id, error);
        return null;
      }
    },

    findById: async function (table, id) {
      try {
        var res = await fetch("/api/" + table + "/" + id, { headers: authHeaders(false) });
        var json = await res.json();
        return json.data || null;
      } catch (error) {
        console.error("Failed to find by id in", table, error);
        return null;
      }
    },
  };

  var machineryTypes = [
    { code: "EX", label: "Excavator" },
    { code: "BHL", label: "Backhoe Loader" },
    { code: "WL", label: "Wheel Loader" },
    { code: "BDZ", label: "Bulldozer" },
    { code: "MG", label: "Motor Grader" },
    { code: "RLR", label: "Road Roller" },
    { code: "CRN", label: "Crawler Crane" },
    { code: "TMC", label: "Truck Mounted Crane" },
    { code: "FN", label: "Forklift" },
    { code: "CNM", label: "Concrete Mixer" },
    { code: "CBP", label: "Concrete Batching Plant" },
    { code: "CPM", label: "Concrete Pump" },
    { code: "ASP-Cr", label: "Asphalt Paver" },
    { code: "ASP-M", label: "Asphalt Mixing Plant" },
    { code: "CPR", label: "Chip Spreader" },
    { code: "WTR", label: "Water Bowser" },
    { code: "DMP", label: "Dump Truck" },
    { code: "LBT", label: "Low Bed Trailer" },
    { code: "PIL", label: "Piling Rig" },
    { code: "CMP", label: "Compressor" },
    { code: "GEN", label: "Generator" },
    { code: "BLN", label: "Bitumen Boiler" },
    { code: "TWR", label: "Tower Crane" },
  ];

  var documentTypes = [
    { key: "revenueLicense", labelKey: "doc.revenueLicense", label: "Revenue License" },
    { key: "motorTrafficCertificate", labelKey: "doc.motorTrafficCertificate", label: "Motor Traffic Registration Certificate" },
    { key: "affidavit", labelKey: "doc.affidavit", label: "Affidavit" },
    { key: "engineerReport", labelKey: "doc.engineerReport", label: "Engineer Report" },
    { key: "motorTrafficRegistrationCertificate", labelKey: "doc.motorTrafficRegistrationCertificate", label: "Registration Certificate of Motor Traffic" },
    { key: "revenueReport", labelKey: "doc.revenueReport", label: "Revenue Report" },
  ];

  function getText(key, fallback, replacements) {
    if (window.CIDA_I18N && typeof window.CIDA_I18N.get === "function") {
      return window.CIDA_I18N.get(key, fallback, replacements);
    }

    var output = String(fallback || key || "");
    Object.keys(replacements || {}).forEach(function (name) {
      output = output.replace(new RegExp("\\{" + name + "\\}", "g"), replacements[name]);
    });
    return output;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (match) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[match];
    });
  }

  function formatDate(value) {
    if (!value) {
      return "-";
    }

    return new Date(value).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function addYears(dateValue, years) {
    var next = new Date(dateValue);
    next.setFullYear(next.getFullYear() + years);
    return next.getTime();
  }

  function getMachineryTypeDetails(code) {
    return machineryTypes.find(function (item) {
      return item.code === code;
    }) || { code: code, label: code };
  }

  function getStatusTone(status) {
    if (status === "approved") {
      return "approved";
    }

    if (status === "pending" || status === "pending_renewal" || status === "admin_approved") {
      return "pending";
    }

    return status || "pending";
  }

  function getStatusLabel(status) {
    var map = {
      approved: "status.approved",
      pending: "status.pending",
      admin_approved: "status.adminApproved",
      pending_renewal: "status.pendingRenewal",
      rejected: "status.rejected",
      revoked: "status.revoked",
    };

    return getText(map[status], String(status || "").replace(/_/g, " "));
  }

  function getAppealStatusLabel(status) {
    var map = {
      submitted: "appeal.submitted",
      accepted: "appeal.accepted",
      dismissed: "appeal.dismissed",
    };

    return getText(map[status], status || "-");
  }

  function getDocumentLabel(key) {
    var definition = documentTypes.find(function (item) {
      return item.key === key;
    });

    return getText(definition ? definition.labelKey : key, definition ? definition.label : key);
  }

  function setFeedback(element, message, tone) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.dataset.tone = tone || "";
  }

  window.CIDA_DB = DB;
  window.CIDA_CONSTANTS = {
    machineryTypes: machineryTypes,
    documentTypes: documentTypes,
  };
  window.CIDA_UTILS = {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    addYears: addYears,
    getMachineryTypeDetails: getMachineryTypeDetails,
    getDocumentLabel: getDocumentLabel,
    getStatusTone: getStatusTone,
    getStatusLabel: getStatusLabel,
    getAppealStatusLabel: getAppealStatusLabel,
    getText: getText,
    setFeedback: setFeedback,
  };
})();
