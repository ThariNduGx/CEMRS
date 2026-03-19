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
      "table.status":                  "Status",

      /* ── Owner login page ── */
      "login.pageTitle":               "CIDA Login",
      "login.access":                  "CIDA Access",
      "login.title":                   "Login",
      "login.intro":                   "Use the seeded accounts or an owner account you register here.",
      "login.seededAccounts":          "Seeded Accounts",
      "login.adminLabel":              "Admin",
      "login.ownerLabel":              "Owner",

      /* ── Owner registration ── */
      "register.pageTitle":            "Owner Registration",
      "register.onboarding":           "Owner Onboarding",
      "register.title":                "Create Machinery Owner Account",
      "register.intro":                "Register as a machinery owner to manage submissions, renewals, and account details.",
      "register.fullName":             "Full Name",
      "register.fullNamePlaceholder":  "Enter your full name",
      "register.companyName":          "Business / Company Name",
      "register.companyNamePlaceholder": "Registered company name",
      "register.email":                "Email",
      "register.emailPlaceholder":     "owner@example.com",
      "register.contactNumber":        "Contact Number",
      "register.contactPlaceholder":   "0771234567",
      "register.password":             "Password",
      "register.passwordPlaceholder":  "Minimum 8 characters",
      "register.confirmPassword":      "Confirm Password",
      "register.confirmPasswordPlaceholder": "Re-enter your password",
      "register.address":              "Address",
      "register.addressPlaceholder":   "Business or mailing address",
      "register.agreement":            "I confirm that the information provided is accurate and can be used for CIDA machinery registration records.",
      "register.submit":               "Register Account",

      /* ── Contractor registration ── */
      "register.contractorPageTitle":  "Contractor Registration",
      "register.contractorOnboarding": "Contractor Onboarding",
      "register.contractorTitle":      "Create Contractor Account",
      "register.contractorIntro":      "Register as a contractor to search for available machinery and request rentals.",
      "register.cidaNumber":           "CIDA Registration Number",
      "register.cidaPlaceholder":      "e.g. CIDA/C/1234",
      "register.agreementContractor":  "I confirm that I am an authorized representative of the registered company.",
      "register.submitContractor":     "Register Account",

      /* ── Shared navigation links ── */
      "common.createOwnerAccount":     "Create owner account",
      "common.alreadyHaveAccount":     "Already have an account?",
      "common.returnToPublicRegister": "Return to public register",

      /* ── Public register page ── */
      "public.pageTitle":              "CIDA Machinery Register",
      "public.access":                 "Public Access",
      "public.title":                  "CIDA Machinery Register",
      "public.heroTitle":              "Search the Approved Register",
      "public.heroText":               "Find verified construction equipment and machinery maintained under the central CIDA registration process.",
      "public.thirdSchedule":          "Third Schedule View",
      "public.approvedRegister":       "Approved Register",
      "public.ownerAddress":           "Name / Address of Owner",
      "public.ownerPlaceholder":       "Search owner or address",
      "public.machineryType":          "Machinery Type",
      "public.typePlaceholder":        "Wheel Loader, Excavator…",
      "public.locationPlaceholder":    "Colombo, Kandy…",
      "public.registrationPlaceholder":"CIDA-WL-2026-001",
      "public.typeOfMachinery":        "Type of Machinery",
      "public.countryOfOrigin":        "Country of Origin",
      "public.registrationDates":      "Registration Dates"
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
      "owner.appealValidation":    "ඉදිරිපත් කිරීමට පෙර අභියාචනා පණිවිඩයක් ඇතුළු කරන්න.",
      "owner.appealExplanation":   "අභියාචනයේ විස්තරය",
      "owner.appealPlaceholder":   "තීරණය නැවත සලකා බැලිය යුත්තේ ඇයිද යන්න පැහැදිලි කරන්න.",
      "owner.noPopup":             "උත්පතන කවුළුව අවහිර කෙරිණි. PDF ලෙස මුද්‍රණය හෝ සුරැකීමට උත්පතන ඉඩ දෙන්න.",

      /* ── Login ── */
      "login.contractorPageTitle": "කොන්ත්‍රාත්කරු පිවිසීම",
      "login.contractorAccess":    "කොන්ත්‍රාත්කරු ප්‍රවේශය",
      "login.contractorTitle":     "පිවිසෙන්න",
      "login.email":               "විද්‍යුත් තැපෑල",
      "login.password":            "මුරපදය",

      /* ── Feedback ── */
      "feedback.loginSuccess":          "සාර්ථකව පිවිසිණි. යළි-යොමු කෙරෙමින්…",
      "feedback.invalidLogin":          "ईमेल හෝ මුරපදය වලංගු නොවේ.",
      "feedback.accountCreated":        "ගිණුම සාදන ලදී. හිමිකරු උපකරණ ලේඛනයට යළි-යොමු කෙරෙමින්…",
      "feedback.completeRegistration":  "අවශ්‍ය ලියාපදිංචි ක්ෂේත්‍ර සම්පූර්ණ කරන්න.",
      "feedback.passwordMismatch":      "මුරපද තහවුරුව නොගැලපේ.",
      "feedback.passwordTooShort":      "මුරපදය අවම වශයෙන් අක්ෂර 8 ක් විය යුතුය.",

      /* ── Contractor ── */
      "dashboard.contractorTitle":     "කොන්ත්‍රාත්කරු උපකරණ ලේඛනය",
      "nav.availableMachinery":        "ලබා ගත හැකි යන්ත්‍රෝපකරණ",
      "nav.myRentals":                 "මගේ කුලී ඉල්ලීම්",
      "role.contractor":               "ලියාපදිංචි කොන්ත්‍රාත්කරු",
      "contractor.availableMachinery": "කුලී සඳහා ලබා ගත හැකි යන්ත්‍රෝපකරණ",
      "contractor.myRentals":          "මගේ කුලී ඉල්ලීම්",

      /* ── Owner login page ── */
      "login.pageTitle":               "CIDA පිවිසීම",
      "login.access":                  "CIDA ප්‍රවේශය",
      "login.title":                   "පිවිසෙන්න",
      "login.intro":                   "බීජ ගිණුම් හෝ ලියාපදිංචි හිමිකරු ගිණුමක් භාවිතා කරන්න.",
      "login.seededAccounts":          "බීජ ගිණුම්",
      "login.adminLabel":              "පරිපාලක",
      "login.ownerLabel":              "හිමිකරු",
      "login.emailPlaceholder":        "admin@cida.gov.lk",
      "login.passwordPlaceholder":     "මුරපදය ඇතුළු කරන්න",

      /* ── Owner registration ── */
      "register.pageTitle":            "හිමිකරු ලියාපදිංචිය",
      "register.onboarding":           "හිමිකරු ඇතුළත් කිරීම",
      "register.title":                "යන්ත්‍රෝපකරණ හිමිකරු ගිණුම සාදන්න",
      "register.intro":                "ඉදිරිපත් කිරීම්, අලුත් කිරීම් සහ ගිණුම් විස්තර කළමනාකරණය සඳහා ලියාපදිංචි වන්න.",
      "register.fullName":             "සම්පූර්ණ නම",
      "register.fullNamePlaceholder":  "ඔබේ සම්පූර්ණ නම ඇතුළු කරන්න",
      "register.companyName":          "ව්‍යාපාර / සමාගම් නම",
      "register.companyNamePlaceholder": "ලියාපදිංචි සමාගම් නම",
      "register.email":                "විද්‍යුත් තැපෑල",
      "register.emailPlaceholder":     "owner@example.com",
      "register.contactNumber":        "සම්බන්ධතා අංකය",
      "register.contactPlaceholder":   "0771234567",
      "register.password":             "මුරපදය",
      "register.passwordPlaceholder":  "අවම අක්ෂර 8",
      "register.confirmPassword":      "මුරපදය තහවුරු කරන්න",
      "register.confirmPasswordPlaceholder": "මුරපදය නැවත ඇතුළු කරන්න",
      "register.address":              "ලිපිනය",
      "register.addressPlaceholder":   "ව්‍යාපාරික හෝ තැපැල් ලිපිනය",
      "register.agreement":            "ලබා දී ඇති තොරතුරු නිවැරදි බව සහ CIDA ලියාපදිංචි වාර්තා සඳහා භාවිතා කළ හැකි බව තහවුරු කරමි.",
      "register.submit":               "ගිණුම ලියාපදිංචි කරන්න",

      /* ── Contractor registration ── */
      "register.contractorPageTitle":  "කොන්ත්‍රාත්කරු ලියාපදිංචිය",
      "register.contractorOnboarding": "කොන්ත්‍රාත්කරු ඇතුළත් කිරීම",
      "register.contractorTitle":      "කොන්ත්‍රාත්කරු ගිණුමක් සාදන්න",
      "register.contractorIntro":      "ලබා ගත හැකි යන්ත්‍රෝපකරණ සෙවීමට සහ කුලී ඉල්ලීම් ඉදිරිපත් කිරීමට ලියාපදිංචි වන්න.",
      "register.cidaNumber":           "CIDA ලියාපදිංචි අංකය",
      "register.cidaPlaceholder":      "e.g. CIDA/C/1234",
      "register.agreementContractor":  "ලියාපදිංචි සමාගමේ අනුමත නියෝජිතයකු බව තහවුරු කරමි.",
      "register.submitContractor":     "ගිණුම ලියාපදිංචි කරන්න",

      /* ── Shared navigation links ── */
      "common.createOwnerAccount":     "හිමිකරු ගිණුමක් සාදන්න",
      "common.alreadyHaveAccount":     "දැනටමත් ගිණුමක් තිබේද?",
      "common.returnToPublicRegister": "පොදු ලේඛනයට ආපසු",

      /* ── Public register page ── */
      "public.pageTitle":              "CIDA යන්ත්‍රෝපකරණ ලේඛනය",
      "public.access":                 "පොදු ප්‍රවේශය",
      "public.title":                  "CIDA යන්ත්‍රෝපකරණ ලේඛනය",
      "public.heroTitle":              "අනුමත ලේඛනය සොයන්න",
      "public.heroText":               "CIDA ලියාපදිංචි ක්‍රියාවලිය යටතේ නඩත්තු කරන ලද තහවුරු ඉදිකිරීම් උපකරණ සහ යන්ත්‍රෝපකරණ සොයා ගන්න.",
      "public.thirdSchedule":          "තෙවැනි උපලේඛනය",
      "public.approvedRegister":       "අනුමත ලේඛනය",
      "public.ownerAddress":           "හිමිකරුගේ නම / ලිපිනය",
      "public.ownerPlaceholder":       "හිමිකරු හෝ ලිපිනය සොයන්න",
      "public.machineryType":          "යන්ත්‍රෝපකරණ වර්ගය",
      "public.typePlaceholder":        "රෝද පූකරය, කැණීම් යන්ත්‍රය…",
      "public.locationPlaceholder":    "කොළඹ, මහනුවර…",
      "public.registrationPlaceholder":"CIDA-WL-2026-001",
      "public.typeOfMachinery":        "යන්ත්‍රෝපකරණ වර්ගය",
      "public.countryOfOrigin":        "නිෂ්පාදන රට",
      "public.registrationDates":      "ලියාපදිංචි දිනයන්"
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
      "owner.appealValidation":    "சமர்ப்பிக்கும் முன் மேல்முறையீட்டு செய்தியை உள்ளிடவும்.",
      "owner.appealExplanation":   "மேல்முறையீட்டு விளக்கம்",
      "owner.appealPlaceholder":   "முடிவை மறுபரிசீலனை செய்ய வேண்டும் என்பதை விளக்குங்கள்.",
      "owner.appealPending":       "மேல்முறையீடு நிலுவையில்",
      "owner.noPopup":             "பாப்-அப் சாளரம் தடுக்கப்பட்டது. அச்சிட அல்லது PDF ஆக சேமிக்க பாப்-அப்களை அனுமதிக்கவும்.",

      /* ── Login ── */
      "login.contractorPageTitle": "ஒப்பந்தக்காரர் உள்நுழைவு",
      "login.contractorAccess":    "ஒப்பந்தக்காரர் அணுகல்",
      "login.contractorTitle":     "உள்நுழை",
      "login.email":               "மின்னஞ்சல்",
      "login.password":            "கடவுச்சொல்",

      /* ── Feedback ── */
      "feedback.loginSuccess":          "வெற்றிகரமாக உள்நுழைந்தீர்கள். திரும்பி அழைக்கப்படுகிறது…",
      "feedback.invalidLogin":          "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.",
      "feedback.accountCreated":        "கணக்கு உருவாக்கப்பட்டது. உரிமையாளர் டாஷ்போர்டுக்கு திரும்பி அழைக்கப்படுகிறது…",
      "feedback.completeRegistration":  "தேவையான அனைத்து பதிவு புலங்களையும் நிரப்பவும்.",
      "feedback.passwordMismatch":      "கடவுச்சொல் உறுதிப்படுத்தல் பொருந்தவில்லை.",
      "feedback.passwordTooShort":      "கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் இருக்க வேண்டும்.",

      /* ── Contractor ── */
      "dashboard.contractorTitle":     "ஒப்பந்தக்காரர் டாஷ்போர்டு",
      "nav.availableMachinery":        "கிடைக்கக்கூடிய இயந்திரங்கள்",
      "nav.myRentals":                 "என் வாடகை கோரிக்கைகள்",
      "role.contractor":               "பதிவு செய்யப்பட்ட ஒப்பந்தக்காரர்",
      "contractor.availableMachinery": "வாடகைக்கு கிடைக்கக்கூடிய இயந்திரங்கள்",
      "contractor.myRentals":          "என் வாடகை கோரிக்கைகள்",

      /* ── Owner login page ── */
      "login.pageTitle":               "CIDA உள்நுழைவு",
      "login.access":                  "CIDA அணுகல்",
      "login.title":                   "உள்நுழை",
      "login.intro":                   "விதைக்கப்பட்ட கணக்குகள் அல்லது நீங்கள் பதிவு செய்த உரிமையாளர் கணக்கை பயன்படுத்தவும்.",
      "login.seededAccounts":          "விதைக்கப்பட்ட கணக்குகள்",
      "login.adminLabel":              "நிர்வாகி",
      "login.ownerLabel":              "உரிமையாளர்",
      "login.emailPlaceholder":        "admin@cida.gov.lk",
      "login.passwordPlaceholder":     "கடவுச்சொல்லை உள்ளிடவும்",

      /* ── Owner registration ── */
      "register.pageTitle":            "உரிமையாளர் பதிவு",
      "register.onboarding":           "உரிமையாளர் இணைப்பு",
      "register.title":                "இயந்திர உரிமையாளர் கணக்கை உருவாக்கு",
      "register.intro":                "சமர்ப்பிப்புகள், புதுப்பித்தல்கள் மற்றும் கணக்கு விவரங்களை நிர்வகிக்க பதிவு செய்யவும்.",
      "register.fullName":             "முழு பெயர்",
      "register.fullNamePlaceholder":  "உங்கள் முழு பெயரை உள்ளிடவும்",
      "register.companyName":          "வணிக / நிறுவனப் பெயர்",
      "register.companyNamePlaceholder": "பதிவு செய்யப்பட்ட நிறுவனப் பெயர்",
      "register.email":                "மின்னஞ்சல்",
      "register.emailPlaceholder":     "owner@example.com",
      "register.contactNumber":        "தொடர்பு எண்",
      "register.contactPlaceholder":   "0771234567",
      "register.password":             "கடவுச்சொல்",
      "register.passwordPlaceholder":  "குறைந்தது 8 எழுத்துக்கள்",
      "register.confirmPassword":      "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
      "register.confirmPasswordPlaceholder": "கடவுச்சொல்லை மீண்டும் உள்ளிடவும்",
      "register.address":              "முகவரி",
      "register.addressPlaceholder":   "வணிக அல்லது அஞ்சல் முகவரி",
      "register.agreement":            "வழங்கப்பட்ட தகவல் சரியானது மற்றும் CIDA இயந்திரப் பதிவு பதிவுகளுக்கு பயன்படுத்தலாம் என்று உறுதிப்படுத்துகிறேன்.",
      "register.submit":               "கணக்கை பதிவு செய்யவும்",

      /* ── Contractor registration ── */
      "register.contractorPageTitle":  "ஒப்பந்தக்காரர் பதிவு",
      "register.contractorOnboarding": "ஒப்பந்தக்காரர் இணைப்பு",
      "register.contractorTitle":      "ஒப்பந்தக்காரர் கணக்கை உருவாக்கு",
      "register.contractorIntro":      "கிடைக்கக்கூடிய இயந்திரங்களை தேட மற்றும் வாடகை கோரிக்கைகளை சமர்ப்பிக்க பதிவு செய்யவும்.",
      "register.cidaNumber":           "CIDA பதிவு எண்",
      "register.cidaPlaceholder":      "எ.கா. CIDA/C/1234",
      "register.agreementContractor":  "பதிவு செய்யப்பட்ட நிறுவனத்தின் அங்கீகரிக்கப்பட்ட பிரதிநிதி என்று உறுதிப்படுத்துகிறேன்.",
      "register.submitContractor":     "கணக்கை பதிவு செய்யவும்",

      /* ── Shared navigation links ── */
      "common.createOwnerAccount":     "உரிமையாளர் கணக்கை உருவாக்கு",
      "common.alreadyHaveAccount":     "ஏற்கனவே கணக்கு உள்ளதா?",
      "common.returnToPublicRegister": "பொது பதிவேட்டிற்கு திரும்பு",

      /* ── Public register page ── */
      "public.pageTitle":              "CIDA இயந்திர பதிவேடு",
      "public.access":                 "பொது அணுகல்",
      "public.title":                  "CIDA இயந்திர பதிவேடு",
      "public.heroTitle":              "அங்கீகரிக்கப்பட்ட பதிவேட்டை தேடுங்கள்",
      "public.heroText":               "மத்திய CIDA பதிவு செயல்முறையின் கீழ் பராமரிக்கப்படும் சரிபார்க்கப்பட்ட கட்டுமான உபகரணங்கள் மற்றும் இயந்திரங்களை கண்டறியுங்கள்.",
      "public.thirdSchedule":          "மூன்றாம் அட்டவணை",
      "public.approvedRegister":       "அங்கீகரிக்கப்பட்ட பதிவேடு",
      "public.ownerAddress":           "உரிமையாளரின் பெயர் / முகவரி",
      "public.ownerPlaceholder":       "உரிமையாளர் அல்லது முகவரியை தேடவும்",
      "public.machineryType":          "இயந்திர வகை",
      "public.typePlaceholder":        "சக்கர ஏற்றி, தோண்டும் இயந்திரம்…",
      "public.locationPlaceholder":    "கொழும்பு, கண்டி…",
      "public.registrationPlaceholder":"CIDA-WL-2026-001",
      "public.typeOfMachinery":        "இயந்திர வகை",
      "public.countryOfOrigin":        "தயாரிப்பு நாடு",
      "public.registrationDates":      "பதிவு தேதிகள்"
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
