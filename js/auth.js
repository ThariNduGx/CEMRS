(function () {
  function getText(key, fallback, replacements) {
    return CIDA_UTILS.getText(key, fallback, replacements);
  }

  // #6 - Check if a JWT has expired client-side to avoid unnecessary API calls
  function isTokenExpired(token) {
    try {
      var parts = token.split(".");
      if (parts.length !== 3) return true;
      var payload = JSON.parse(atob(parts[1]));
      return payload.exp && Math.floor(Date.now() / 1000) > payload.exp;
    } catch (e) {
      return true;
    }
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem("cida_session")) || null;
    } catch (error) {
      return null;
    }
  }

  function setSession(session) {
    sessionStorage.setItem("cida_session", JSON.stringify(session));
  }

  function setSessionFromLogin(data, token) {
    setSession({ userId: data.id, role: data.role, token: token });
  }

  function clearSession() {
    sessionStorage.removeItem("cida_session");
  }

  async function getCurrentUser() {
    var session = getSession();
    if (!session) {
      return null;
    }

    return await CIDA_DB.findById("users", session.userId);
  }

  function redirectForRole(role) {
    var routeMap = {
      admin: "admin-dashboard.html",
      director_general: "director-general-dashboard.html",
      owner: "owner-dashboard.html",
      contractor: "contractor-dashboard.html",
    };

    window.location.href = routeMap[role] || "login.html";
  }

  async function requireRole(role) {
    var session = getSession();
    var loginPage = role === "contractor" ? "contractor-login.html" : "login.html";
    if (!session || session.role !== role) {
      window.location.href = loginPage;
      return null;
    }

    // #6 - Proactively redirect if the token is already expired
    if (session.token && isTokenExpired(session.token)) {
      clearSession();
      window.location.href = loginPage;
      return null;
    }

    return await CIDA_DB.findById("users", session.userId);
  }

  function wireLogout() {
    var button = document.getElementById("logout-button");
    if (!button) {
      return;
    }

    button.addEventListener("click", function () {
      // #28 - Disable button to prevent double-click race condition
      this.disabled = true;
      clearSession();
      window.location.href = "login.html";
    });
  }

  function handleLoginPage() {
    var form = document.getElementById("login-form");
    var feedback = document.getElementById("login-feedback");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var email = String(formData.get("email") || "").trim().toLowerCase();
      var password = String(formData.get("password") || "");

      try {
        var res = await fetch("/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password }),
        });
        var result = await res.json();

        if (!result.success) {
          CIDA_UTILS.setFeedback(feedback, result.message || getText("feedback.invalidLogin", "Invalid email or password."), "error");
          return;
        }

        setSession({ userId: result.data.id, role: result.data.role, token: result.token });
        CIDA_UTILS.setFeedback(feedback, getText("feedback.loginSuccess", "Login successful. Redirecting..."), "success");
        redirectForRole(result.data.role);
      } catch (err) {
        CIDA_UTILS.setFeedback(feedback, "Network error. Please try again.", "error");
      }
    });
  }

  function handleRegisterPage() {
    var form = document.getElementById("owner-register-form");
    var feedback = document.getElementById("register-feedback");
    if (!form) {
      return;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      var formData = new FormData(form);
      var name = String(formData.get("name") || "").trim();
      var companyName = String(formData.get("companyName") || "").trim();
      var email = String(formData.get("email") || "").trim().toLowerCase();
      var password = String(formData.get("password") || "");
      var confirmPassword = String(formData.get("confirmPassword") || "");
      var contactDetails = String(formData.get("contactDetails") || "").trim();
      var address = String(formData.get("address") || "").trim();

      if (!name || !companyName || !contactDetails || !address) {
        CIDA_UTILS.setFeedback(feedback, getText("feedback.completeRegistration", "Complete all required registration fields."), "error");
        return;
      }

      if (password !== confirmPassword) {
        CIDA_UTILS.setFeedback(feedback, getText("feedback.passwordMismatch", "Password confirmation does not match."), "error");
        return;
      }

      if (password.length < 8) {
        CIDA_UTILS.setFeedback(feedback, getText("feedback.passwordTooShort", "Password must be at least 8 characters long."), "error");
        return;
      }

      try {
        var res = await fetch("/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name,
            companyName: companyName,
            email: email,
            password: password,
            contactDetails: contactDetails,
            address: address,
          }),
        });
        var result = await res.json();

        if (!result.success) {
          CIDA_UTILS.setFeedback(feedback, result.message, "error");
          return;
        }

        form.reset();
        setSession({ userId: result.data.id, role: result.data.role, token: result.token });
        CIDA_UTILS.setFeedback(feedback, getText("feedback.accountCreated", "Account created. Redirecting to owner dashboard..."), "success");
        redirectForRole("owner");
      } catch (err) {
        CIDA_UTILS.setFeedback(feedback, "Network error. Please try again.", "error");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    var page = document.body.dataset.page;
    var session = getSession();

    if ((page === "login" || page === "register") && session) {
      redirectForRole(session.role);
      return;
    }

    if (page === "owner-dashboard" || page === "owner-maintenance-dashboard") {
      var owner = await requireRole("owner");
      if (!owner) {
        return;
      }

      var ownerSummary = document.getElementById("owner-user-summary");
      if (ownerSummary) {
        ownerSummary.textContent = owner.name;
      }
    }

    if (page === "admin-dashboard") {
      var admin = await requireRole("admin");
      if (!admin) {
        return;
      }

      var adminSummary = document.getElementById("admin-user-summary");
      if (adminSummary) {
        adminSummary.textContent = admin.name;
      }
    }

    if (page === "director-general-dashboard") {
      var directorGeneral = await requireRole("director_general");
      if (!directorGeneral) {
        return;
      }

      var directorGeneralSummary = document.getElementById("director-general-user-summary");
      if (directorGeneralSummary) {
        directorGeneralSummary.textContent = directorGeneral.name;
      }
    }

    wireLogout();
    handleLoginPage();
    handleRegisterPage();
  });

  window.CIDA_AUTH = {
    getSession: getSession,
    setSession: setSession,
    getCurrentUser: getCurrentUser,
    clearSession: clearSession,
    requireRole: requireRole,
  };
})();
