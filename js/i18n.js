/**
 * CIDA CEMRS Internationalisation (i18n) Module
 * Supports English (en), Sinhala (si), and Tamil (ta).
 * Reads/writes the active language to localStorage under 'cida_lang'.
 *
 * After CIDA_I18N is defined, db.js's CIDA_UTILS.getText() will automatically
 * delegate to CIDA_I18N.get() for all UI strings.
 */
(function () {

  var TRANSLATIONS = {
    en: {
      /* ── Common ── */
      "common.actions":           "Actions",
      "common.status":            "Status",
      "common.type":              "Type",
      "common.model":             "Model / Make",
      "common.location":          "Location",
      "common.registrationNumber":"Registration No.",
      "common.close":             "Close",
      "common.submit":            "Submit",
      "common.cancel":            "Cancel",
      "common.login":             "Login",
      "common.logout":            "Logout",
      "common.loading":           "Loading…",
      "common.backToPublicRegister": "Back to public register",
      "common.createContractorAccount": "Create contractor account",
      "common.cidaPlatform":      "CIDA Registration",

      /* ── Status labels ── */
      "status.approved":      "Approved",
      "status.pending":       "Pending Review",
      "status.adminApproved": "Forwarded to DG",
      "status.pendingRenewal":"Renewal Pending",
      "status.rejected":      "Rejected",
      "status.revoked":       "Revoked",

      /* ── Appeal labels ── */
      "appeal.submitted": "Submitted",
      "appeal.accepted":  "Accepted",
      "appeal.dismissed": "Dismissed",

      /* ── Document labels ── */
      "doc.revenueLicense":                    "Revenue License",
      "doc.motorTrafficCertificate":           "Motor Traffic Registration Certificate",
      "doc.affidavit":                         "Affidavit",
      "doc.engineerReport":                    "Engineer Report",
      "doc.motorTrafficRegistrationCertificate":"Registration Certificate of Motor Traffic",
      "doc.revenueReport":                     "Revenue Report",

      /* ── Owner dashboard ── */
      "owner.pageTitle":           "Owner Dashboard",
      "owner.workspace":           "Owner Workspace",
      "owner.title":               "Machinery Registration",
      "owner.newSubmission":       "New Submission",
      "owner.registerMachinery":   "Register Machinery",
      "owner.statusBoard":         "Status Board",
      "owner.records":             "Your Machinery Records",
      "owner.machineryType":       "Machinery Type",
      "owner.makeModel":           "Make / Model",
      "owner.countryOfOrigin":     "Country of Origin",
      "owner.currentLocation":     "Current Location",
      "owner.submitAndPay":        "Proceed to Payment & Submit",
      "owner.registrationDate":    "Registration Date",
      "owner.expiryDate":          "Expiry Date",
      "owner.feeTier":             "Current fee tier: Rs. {fee}",
      "owner.selectMachineryType": "Select machinery type",
      "owner.expiringHeading":     "Renewal Notice",
      "owner.expiringSingle":      "1 certificate expires soon.",
      "owner.expiringPlural":      "{count} certificates expire soon.",
      "owner.expiringHelp":        "Use the Renew action in the table below before the expiry date.",
      "owner.rejectionReason":     "Reason",
      "owner.appealStatus":        "Appeal status",
      "owner.appealMessage":       "Appeal",
      "owner.adminNotes":          "Admin notes",
      "owner.renew":               "Renew",
      "owner.viewCertificate":     "View Certificate",
      "owner.submitAppeal":        "Submit Appeal",
      "owner.appealPending":       "Appeal Pending",
      "owner.certificateTitle":    "Digital Certificate of Registration",
      "owner.printCertificate":    "Print / Save PDF",
      "owner.appealTitle":         "Submit Appeal",
      "owner.appealExplanation":   "Appeal Explanation",
      "owner.appealPlaceholder":   "Explain why the decision should be reviewed.",
      "owner.noRecords":           "No machinery records submitted yet.",
      "owner.noPopup":             "Pop-up window was blocked. Allow pop-ups to print or save as PDF.",
      "owner.renewalRequestedFeedback": "Renewal request submitted for review.",
      "owner.appealSubmittedFeedback":  "Appeal submitted and forwarded to CIDA for review.",
      "owner.submissionSaved":     "Submission successful. Your fee is Rs. {fee}.",
      "owner.ownerLabel":          "Owner",
      "owner.companyLabel":        "Company",
      "owner.certificateIssued":   "Certificate issued",
      "owner.validUntil":          "Valid until",
      "owner.certificateStatement":"This is to certify that the machinery described herein has been duly registered under the provisions of the Construction Industry Development Act.",
      "owner.appealValidation":    "Enter an appeal message before submitting.",

      /* ── Login ── */
      "login.contractorPageTitle": "Contractor Login",
      "login.contractorAccess":    "Contractor Access",
      "login.contractorTitle":     "Login",
      "login.contractorIntro":     "Login to search equipment and request rentals.",
      "login.email":               "Email",
      "login.password":            "Password",
      "login.emailPlaceholder":    "your@email.com",
      "login.passwordPlaceholder": "Enter password",

      /* ── Feedback ── */
      "feedback.loginSuccess":          "Login successful. Redirecting…",
      "feedback.invalidLogin":          "Invalid email or password.",
      "feedback.accountCreated":        "Account created. Redirecting to owner dashboard…",
      "feedback.completeRegistration":  "Complete all required registration fields.",
      "feedback.passwordMismatch":      "Password confirmation does not match.",
      "feedback.passwordTooShort":      "Password must be at least 8 characters long.",

      /* ── Contractor dashboard ── */
      "dashboard.contractorPageTitle": "Contractor Dashboard",
      "dashboard.contractorTitle":     "Contractor Dashboard",
      "nav.availableMachinery":        "Available Machinery",
      "nav.myRentals":                 "My Rentals",
      "role.contractor":               "Registered Contractor",
      "contractor.availableMachinery": "Available Machinery for Rent",
      "contractor.availableMachineryIntro": "Browse approved machinery available for project allocation.",
      "contractor.myRentals":          "My Rental Requests",
      "modal.requestRental":           "Request Rental",
      "rental.startDate":              "Start Date",
      "rental.endDate":                "End Date",
      "table.machineReg":              "Machinery Reg No",
      "table.type":                    "Type",
      "table.duration":                "Rental Duration",
      "table.status":                  "Status"
    },

    si: {
      /* ── Common ── */
      "common.actions":           "ක්‍රියා",
      "common.status":            "තත්ත්වය",
      "common.type":              "වර්ගය",
      "common.model":             "මාදිලිය",
      "common.location":          "ස්ථානය",
      "common.registrationNumber":"ලියාපදිංචි අංකය",
      "common.close":             "වසන්න",
      "common.submit":            "ඉදිරිපත් කරන්න",
      "common.cancel":            "අවලංගු කරන්න",
      "common.login":             "පිවිසෙන්න",
      "common.logout":            "ඉවත් වන්න",
      "common.loading":           "පූරණය වෙමින්…",
      "common.backToPublicRegister": "පොදු ලේඛනයට ආපසු",
      "common.createContractorAccount": "කොන්ත්‍රාත්කරු ගිණුමක් සාදන්න",
      "common.cidaPlatform":      "CIDA ලියාපදිංචිය",

      /* ── Status labels ── */
      "status.approved":      "අනුමත",
      "status.pending":       "සමාලෝචනය අපේක්ෂාවෙන්",
      "status.adminApproved": "DG වෙත යොමු කෙරිණි",
      "status.pendingRenewal":"අලුත් කිරීම අපේක්ෂාවෙන්",
      "status.rejected":      "ප්‍රතික්ෂේප",
      "status.revoked":       "අවලංගු",

      /* ── Appeal labels ── */
      "appeal.submitted": "ඉදිරිපත් කෙරිණි",
      "appeal.accepted":  "පිළිගත්",
      "appeal.dismissed": "ප්‍රතික්ෂේප",

      /* ── Document labels ── */
      "doc.revenueLicense":                    "ආදායම් බලපත්‍රය",
      "doc.motorTrafficCertificate":           "මෝටර් රථ ගමනාගමන සහතිකය",
      "doc.affidavit":                         "දිවුරුම් ප්‍රකාශය",
      "doc.engineerReport":                    "ඉංජිනේරු වාර්තාව",
      "doc.motorTrafficRegistrationCertificate":"මෝටර් ගමනාගමන ලියාපදිංචි සහතිකය",
      "doc.revenueReport":                     "ආදායම් වාර්තාව",

      /* ── Owner dashboard ── */
      "owner.pageTitle":           "හිමිකරු උපකරණ ලේඛනය",
      "owner.workspace":           "හිමිකරු කාර්යාලය",
      "owner.title":               "යන්ත්‍රෝපකරණ ලියාපදිංචිය",
      "owner.newSubmission":       "නව ඉදිරිපත් කිරීම",
      "owner.registerMachinery":   "යන්ත්‍රෝපකරණ ලියාපදිංචි කරන්න",
      "owner.statusBoard":         "තත්ත්ව පුවරුව",
      "owner.records":             "ඔබේ යන්ත්‍රෝපකරණ වාර්තා",
      "owner.machineryType":       "යන්ත්‍රෝපකරණ වර්ගය",
      "owner.makeModel":           "සෑදීම / මාදිලිය",
      "owner.countryOfOrigin":     "නිෂ්පාදන රට",
      "owner.currentLocation":     "වත්මන් ස්ථානය",
      "owner.submitAndPay":        "ගෙවීමට ඉදිරිපත් කරන්න",
      "owner.registrationDate":    "ලියාපදිංචි දිනය",
      "owner.expiryDate":          "කල් ඉකුත්වීමේ දිනය",
      "owner.feeTier":             "වර්තමාන ගාස්තු මට්ටම: රු. {fee}",
      "owner.selectMachineryType": "යන්ත්‍රෝපකරණ වර්ගය තෝරන්න",
      "owner.expiringHeading":     "අලුත් කිරීමේ දැනුම්දීම",
      "owner.expiringSingle":      "සහතිකය 1 ශීඝ්‍රයෙන් කල් ඉකුත් වේ.",
      "owner.expiringPlural":      "සහතික {count} ශීඝ්‍රයෙන් කල් ඉකුත් වේ.",
      "owner.expiringHelp":        "කල් ඉකුත්වීමට පෙර පහත වගුවේ අලුත් කිරීමේ ක්‍රියාව භාවිතා කරන්න.",
      "owner.rejectionReason":     "හේතුව",
      "owner.appealStatus":        "අභියාචනා තත්ත්වය",
      "owner.appealMessage":       "අභියාචනය",
      "owner.adminNotes":          "පරිපාලක සටහන්",
      "owner.renew":               "අලුත් කරන්න",
      "owner.viewCertificate":     "සහතිකය බලන්න",
      "owner.submitAppeal":        "අභියාචනය ඉදිරිපත් කරන්න",
      "owner.appealPending":       "අභියාචනය අපේක්ෂාවෙන්",
      "owner.certificateTitle":    "ලියාපදිංචි ඩිජිටල් සහතිකය",
      "owner.printCertificate":    "මුද්‍රණය / PDF සුරකින්න",
      "owner.appealTitle":         "අභියාචනය ඉදිරිපත් කරන්න",
      "owner.appealExplanation":   "අභියාචනයේ විස්තරය",
      "owner.noRecords":           "තවම යන්ත්‍රෝපකරණ වාර්තා ඉදිරිපත් කර නැත.",
      "owner.renewalRequestedFeedback": "අලුත් කිරීමේ ඉල්ලීම සමාලෝචනය සඳහා ඉදිරිපත් කෙරිණි.",
      "owner.appealSubmittedFeedback":  "අභියාචනය ඉදිරිපත් කර CIDA වෙත යොමු කෙරිණි.",
      "owner.submissionSaved":     "සාර්ථකව ඉදිරිපත් කෙරිණි. ඔබේ ගාස්තුව රු. {fee}.",
      "owner.ownerLabel":          "හිමිකරු",
      "owner.companyLabel":        "සමාගම",
      "owner.certificateIssued":   "සහතිකය නිකුත් කළ දිනය",
      "owner.validUntil":          "වලංගු කාලය",
      "owner.certificateStatement":"ඉදිකිරීම් කර්මාන්ත සංවර්ධන පනතේ ප්‍රතිපාදන යටතේ මෙහි විස්තර කළ යන්ත්‍රෝපකරණය නිසි ලෙස ලියාපදිංචි කර ඇති බව සහතික කෙරේ.",

      /* ── Login ── */
      "login.contractorPageTitle": "කොන්ත්‍රාත්කරු පිවිසීම",
      "login.contractorAccess":    "කොන්ත්‍රාත්කරු ප්‍රවේශය",
      "login.contractorTitle":     "පිවිසෙන්න",
      "login.email":               "විද්‍යුත් තැපෑල",
      "login.password":            "මුරපදය",

      /* ── Feedback ── */
      "feedback.loginSuccess":         "සාර්ථකව පිවිසිණි. යළි-යොමු කෙරෙමින්…",
      "feedback.invalidLogin":         "ईमेल හෝ මුරපදය වලංගු නොවේ.",
      "feedback.accountCreated":       "ගිණුම සාදන ලදී. හිමිකරු උපකරණ ලේඛනයට යළි-යොමු කෙරෙමින්…",

      /* ── Contractor ── */
      "dashboard.contractorTitle":     "කොන්ත්‍රාත්කරු උපකරණ ලේඛනය",
      "nav.availableMachinery":        "ලබා ගත හැකි යන්ත්‍රෝපකරණ",
      "nav.myRentals":                 "මගේ කුලී ඉල්ලීම්",
      "role.contractor":               "ලියාපදිංචි කොන්ත්‍රාත්කරු",
      "contractor.availableMachinery": "කුලී සඳහා ලබා ගත හැකි යන්ත්‍රෝපකරණ",
      "contractor.myRentals":          "මගේ කුලී ඉල්ලීම්"
    },

    ta: {
      /* ── Common ── */
      "common.actions":           "செயல்கள்",
      "common.status":            "நிலை",
      "common.type":              "வகை",
      "common.model":             "மாதிரி",
      "common.location":          "இடம்",
      "common.registrationNumber":"பதிவு எண்",
      "common.close":             "மூடு",
      "common.submit":            "சமர்ப்பி",
      "common.cancel":            "ரத்து செய்",
      "common.login":             "உள்நுழை",
      "common.logout":            "வெளியேறு",
      "common.loading":           "ஏற்றுகிறது…",
      "common.backToPublicRegister": "பொது பதிவேட்டிற்கு திரும்பு",
      "common.createContractorAccount": "ஒப்பந்தக்காரர் கணக்கை உருவாக்கு",
      "common.cidaPlatform":      "CIDA பதிவு",

      /* ── Status labels ── */
      "status.approved":      "அங்கீகரிக்கப்பட்டது",
      "status.pending":       "மதிப்பாய்வு நிலுவையில்",
      "status.adminApproved": "DG-க்கு அனுப்பப்பட்டது",
      "status.pendingRenewal":"புதுப்பித்தல் நிலுவையில்",
      "status.rejected":      "நிராகரிக்கப்பட்டது",
      "status.revoked":       "திரும்பப் பெறப்பட்டது",

      /* ── Appeal labels ── */
      "appeal.submitted": "சமர்ப்பிக்கப்பட்டது",
      "appeal.accepted":  "ஏற்றுக்கொள்ளப்பட்டது",
      "appeal.dismissed": "நிராகரிக்கப்பட்டது",

      /* ── Document labels ── */
      "doc.revenueLicense":                    "வருவாய் உரிமம்",
      "doc.motorTrafficCertificate":           "மோட்டார் போக்குவரத்து சான்றிதழ்",
      "doc.affidavit":                         "உறுதிமொழி",
      "doc.engineerReport":                    "பொறியியல் அறிக்கை",
      "doc.motorTrafficRegistrationCertificate":"மோட்டார் போக்குவரத்து பதிவு சான்றிதழ்",
      "doc.revenueReport":                     "வருவாய் அறிக்கை",

      /* ── Owner dashboard ── */
      "owner.pageTitle":           "உரிமையாளர் டாஷ்போர்டு",
        "owner.workspace":         "உரிமையாளர் பணியிடம்",
      "owner.title":               "இயந்திரப் பதிவு",
      "owner.newSubmission":       "புதிய சமர்ப்பிப்பு",
      "owner.registerMachinery":   "இயந்திரத்தை பதிவு செய்",
      "owner.statusBoard":         "நிலை பலகை",
      "owner.records":             "உங்கள் இயந்திர பதிவுகள்",
      "owner.machineryType":       "இயந்திர வகை",
      "owner.makeModel":           "தயாரிப்பு / மாதிரி",
      "owner.countryOfOrigin":     "தயாரிப்பு நாடு",
      "owner.currentLocation":     "தற்போதைய இடம்",
      "owner.submitAndPay":        "கட்டணம் செலுத்தி சமர்ப்பி",
      "owner.registrationDate":    "பதிவு தேதி",
      "owner.expiryDate":          "காலாவதி தேதி",
      "owner.feeTier":             "தற்போதைய கட்டண அளவு: ரூ. {fee}",
      "owner.selectMachineryType": "இயந்திர வகையை தேர்ந்தெடுக்கவும்",
      "owner.expiringHeading":     "புதுப்பித்தல் அறிவிப்பு",
      "owner.expiringSingle":      "1 சான்றிதழ் விரைவில் காலாவதியாகும்.",
      "owner.expiringPlural":      "{count} சான்றிதழ்கள் விரைவில் காலாவதியாகும்.",
      "owner.rejectionReason":     "காரணம்",
      "owner.appealStatus":        "மேல்முறையீட்டு நிலை",
      "owner.renew":               "புதுப்பி",
      "owner.viewCertificate":     "சான்றிதழை காண்க",
      "owner.submitAppeal":        "மேல்முறையீடு சமர்ப்பி",
      "owner.certificateTitle":    "டிஜிட்டல் பதிவு சான்றிதழ்",
      "owner.printCertificate":    "அச்சிடு / PDF சேமி",
      "owner.appealTitle":         "மேல்முறையீடு சமர்ப்பி",
      "owner.noRecords":           "இயந்திர பதிவுகள் இன்னும் சமர்ப்பிக்கப்படவில்லை.",
      "owner.renewalRequestedFeedback": "புதுப்பித்தல் கோரிக்கை மதிப்பாய்விற்கு சமர்ப்பிக்கப்பட்டது.",
      "owner.appealSubmittedFeedback":  "மேல்முறையீடு சமர்ப்பிக்கப்பட்டு CIDA-க்கு அனுப்பப்பட்டது.",
      "owner.submissionSaved":     "சமர்ப்பிப்பு வெற்றிகரமானது. உங்கள் கட்டணம் ரூ. {fee}.",
      "owner.ownerLabel":          "உரிமையாளர்",
      "owner.companyLabel":        "நிறுவனம்",
      "owner.certificateIssued":   "சான்றிதழ் வழங்கப்பட்ட தேதி",
      "owner.validUntil":          "செல்லுபடியாகும் வரை",
      "owner.certificateStatement":"கட்டுமான தொழில் மேம்பாட்டு சட்டத்தின் விதிகளின் கீழ் இங்கு விவரிக்கப்பட்ட இயந்திரம் முறையாக பதிவு செய்யப்பட்டதாக சான்றளிக்கிறோம்.",

      /* ── Login ── */
      "login.contractorPageTitle": "ஒப்பந்தக்காரர் உள்நுழைவு",
      "login.contractorAccess":    "ஒப்பந்தக்காரர் அணுகல்",
      "login.contractorTitle":     "உள்நுழை",
      "login.email":               "மின்னஞ்சல்",
      "login.password":            "கடவுச்சொல்",

      /* ── Feedback ── */
      "feedback.loginSuccess":  "வெற்றிகரமாக உள்நுழைந்தீர்கள். திரும்பி அழைக்கப்படுகிறது…",
      "feedback.invalidLogin":  "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.",
      "feedback.accountCreated":"கணக்கு உருவாக்கப்பட்டது. உரிமையாளர் டாஷ்போர்டுக்கு திரும்பி அழைக்கப்படுகிறது…",

      /* ── Contractor ── */
      "dashboard.contractorTitle":     "ஒப்பந்தக்காரர் டாஷ்போர்டு",
      "nav.availableMachinery":        "கிடைக்கக்கூடிய இயந்திரங்கள்",
      "nav.myRentals":                 "என் வாடகை கோரிக்கைகள்",
      "role.contractor":               "பதிவு செய்யப்பட்ட ஒப்பந்தக்காரர்",
      "contractor.availableMachinery": "வாடகைக்கு கிடைக்கக்கூடிய இயந்திரங்கள்",
      "contractor.myRentals":          "என் வாடகை கோரிக்கைகள்"
    }
  };

  var currentLang = localStorage.getItem("cida_lang") || "en";

  function get(key, fallback, replacements) {
    var dict = TRANSLATIONS[currentLang] || TRANSLATIONS["en"];
    var text = dict[key];

    // Fall back to English, then to provided fallback
    if (!text && currentLang !== "en") {
      text = TRANSLATIONS["en"][key];
    }
    if (!text) {
      text = String(fallback || key || "");
    }

    Object.keys(replacements || {}).forEach(function (name) {
      text = text.replace(new RegExp("\\{" + name + "\\}", "g"), replacements[name]);
    });
    return text;
  }

  function setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem("cida_lang", lang);
    applyToPage();
  }

  // Applies translations to all [data-i18n] elements in the DOM.
  function applyToPage() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var translated = get(key, el.textContent);
      el.textContent = translated;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      el.placeholder = get(key, el.placeholder);
    });
    // Update active button highlight
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.classList.toggle("lang-btn--active", btn.getAttribute("data-lang") === currentLang);
    });
  }

  // Wire language toggle buttons that are present on this page.
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".lang-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLang(this.getAttribute("data-lang"));
        // Reload to re-render all JS-injected content
        window.location.reload();
      });
    });

    applyToPage();
  });

  window.CIDA_I18N = {
    get: get,
    setLang: setLang,
    currentLang: currentLang,
    applyToPage: applyToPage
  };
})();
