(function () {
  function getText(key, fallback, replacements) {
    return CIDA_UTILS.getText(key, fallback, replacements);
  }

  async function getApprovedRows() {
    var users = await CIDA_DB.getData("users");
    var machinery = await CIDA_DB.getData("machinery");

    return machinery
      .filter(function (item) {
        return item.status === "approved";
      })
      .map(function (item) {
        var owner = users.find(function (user) {
          return user.id === item.ownerId;
        }) || { name: "Unknown Owner", address: "-" };
        var type = CIDA_UTILS.getMachineryTypeDetails(item.type);

        return {
          ownerDisplay: owner.name + ", " + (owner.address || "-"),
          typeDisplay: type.label + " (" + type.code + ")",
          makeModel: item.makeModel,
          countryOfOrigin: item.countryOfOrigin,
          location: item.location,
          registrationDates:
            CIDA_UTILS.formatDate(item.registrationDate) + " to " + CIDA_UTILS.formatDate(item.expiryDate),
          registrationNumber: item.registrationNumber || "-",
        };
      });
  }

  function renderTable(rows) {
    var body = document.getElementById("public-register-body");
    var count = document.getElementById("public-result-count");
    if (!body) {
      return;
    }

    if (!rows.length) {
      body.innerHTML =
        '<tr><td colspan="7" class="empty-state">' +
        CIDA_UTILS.escapeHtml(getText("public.noResults", "No approved machinery matched the current filters.")) +
        "</td></tr>";
      if (count) {
        count.textContent = getText("public.resultCountPlural", "0 results", { count: 0 });
      }
      return;
    }

    body.innerHTML = rows
      .map(function (row) {
        return (
          "<tr>" +
          "<td>" + row.ownerDisplay + "</td>" +
          "<td>" + row.typeDisplay + "</td>" +
          "<td>" + row.makeModel + "</td>" +
          "<td>" + row.countryOfOrigin + "</td>" +
          "<td>" + row.location + "</td>" +
          "<td>" + row.registrationDates + "</td>" +
          "<td>" + row.registrationNumber + "</td>" +
          "</tr>"
        );
      })
      .join("");

    if (count) {
      count.textContent = getText(
        rows.length === 1 ? "public.resultCount" : "public.resultCountPlural",
        rows.length + " results",
        { count: rows.length }
      );
    }
  }

  async function wireFilters() {
    var form = document.getElementById("public-filters");
    if (!form) {
      return;
    }

    var rows = await getApprovedRows();

    function applyFilters() {
      var formData = new FormData(form);
      var ownerTerm = String(formData.get("owner") || "").trim().toLowerCase();
      var typeTerm = String(formData.get("type") || "").trim().toLowerCase();
      var locationTerm = String(formData.get("location") || "").trim().toLowerCase();
      var regTerm = String(formData.get("registrationNumber") || "").trim().toLowerCase();

      var filtered = rows.filter(function (row) {
        return (
          row.ownerDisplay.toLowerCase().includes(ownerTerm) &&
          row.typeDisplay.toLowerCase().includes(typeTerm) &&
          row.location.toLowerCase().includes(locationTerm) &&
          row.registrationNumber.toLowerCase().includes(regTerm)
        );
      });

      renderTable(filtered);
    }

    form.addEventListener("input", applyFilters);
    renderTable(rows);
  }

  document.addEventListener("DOMContentLoaded", async function () {
    await wireFilters();
  });
})();
