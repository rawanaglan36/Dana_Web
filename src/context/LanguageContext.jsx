import { createContext, useState, useContext, useEffect } from 'react';

const translations = {
  en: {
    // Sidebar
    main: "Main",
    dashboard: "Dashboard",
    schedule: "Schedule",
    patients: "Patients",
    messages: "Messages",
    settingsSection: "Settings",
    settings: "Settings",
    logout: "Log out",

    // Dashboard Header
    greeting: "Good Morning, Dr. Adelrahman!",
    subGreeting: "Have a great day at work",
    noNotifications: "No new notifications",

    // KPI Cards
    monthlyPerformance: "Monthly Performance",
    todaysAppointments: "Today's Appointments",
    totalActivePatients: "Total Active Patients",

    // Chart
    appointmentsOverview: "Appointments Overview",
    appointmentStatus: "Appointment Status",
    paymentMethods: "Payment Methods",
    more: "MORE",
    completed: "Completed",
    rescheduled: "Rescheduled",
    canceled: "Canceled",
    card: "Card",
    cash: "Cash",
    patientsUnit: "patients",

    // Right Sidebar
    today: "Today",
    scheduleLabel: "Schedule",
    sun: "Sun", mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat",

    // Login
    welcomeBack: "Welcome Back, Doctor",
    loginSubtitle: "Log in to your clinical dashboard to manage your appointments, patient records, and daily schedule.",
    emailOrMobile: "Email or Mobile Number",
    emailPlaceholder: "Enter your email or phone",
    password: "Password",
    passwordPlaceholder: "Enter your Password",
    rememberMe: "Remember Me",
    forgotPassword: "Forgot Password?",
    login: "Login",
    notMember: "Not a member of our clinic yet?",
    applyToJoin: "Apply to Join",

    // Apply to Join
    becomePartner: "Become a Partner Physician",
    applySubtitle: "Submit your professional details to join our specialized pediatric care network. Our team will review your application for an interview shortly.",
    fullName: "Full Name",
    fullNamePlaceholder: "Enter your Name",
    medicalSpecialty: "Medical Specialty",
    specialtyPlaceholder: "Enter your Medical Specialty",
    phoneNumber: "Phone Number",
    phonePlaceholder: "Enter your Phone Number",
    yearsOfExperience: "Years of Experience",
    experiencePlaceholder: "Enter your Years of Experience",
    licenseNumber: "License Number",
    licensePlaceholder: "Enter your License Number",
    professionalCredentials: "Professional Credentials",
    uploadInstructions: "Please upload your latest CV and medical license to help our board review your application for the interview process.",
    fileSelected: "File Selected",
    submit: "Submit",

    // Validation
    fullNameRequired: "Full Name is required",
    specialtyRequired: "Specialty is required",
    phoneRequired: "Phone is required",
    invalidPhone: "Invalid phone format",
    experienceRequired: "Experience is required",
    licenseRequired: "License Number is required",
    uploadRequired: "Please upload your credentials",
    emailRequired: "Email or Mobile is required",
    invalidEmailPhone: "Must be a valid email or phone number",
    passwordRequired: "Password is required",
    passwordMin: "Password must be at least 6 characters",
    signupFailed: "Signup failed. Please try again.",
    signupSuccess: "Account created successfully!",

    // OTP
    verifyNumber: "Verify Your Email",
    otpSubtitle: "A verification code has been sent to your Phone number ending in 4567. Enter it below to confirm your identity.",
    otpSubtitleEmail: "A verification code has been sent to your Email ending in {{email}}. Enter it below to confirm your identity.",
    otpSubtitlePhone: "A verification code has been sent to your Phone number ending in {{phone}}. Enter it below to confirm your identity.",
    resendCodeIn: "Resend code in",
    didntReceive: "Didn't receive the code?",
    resendCode: "Resend Code",
    enterCompleteCode: "Please enter the complete 6-digit code",
    wrongNumber: "Wrong number?",
    wrongUsername: "Wrong Username?",
    changePhone: "Change Phone Number",
    changeEmail: "Change Email",

    // Done
    applicationSubmitted: "Application Submitted Successfully!",
    doneMessage: "Your profile has been sent to our medical board. We will review your credentials and contact you within 48 hours to schedule your interview. Welcome to the future of pediatric care!",
    done: "Done",

    // Patients Page
    totalPatients: "Total Patients",
    needsAttention: "Needs Attention",
    activeThisWeek: "Active This Week",
    patientDirectory: "Patient Directory",
    patientDirectoryDesc: "View and update patient profiles, IDs, and treatment categories.",
    findPatient: "Find a patient...",
    filter: "Filter",
    patient: "Patient",
    fileId: "File ID",
    age: "Age",
    lastVisit: "Last Visit",
    status: "Status",
    actions: "Actions",
    active: "Active",
    overdue: "Overdue",
    loading: "Loading...",
    noPatientsFound: "No patients found",

    // Schedule Page
    startConsultation: "Start Consultation",
    completeConsultation: "Complete Consultation",
    consultationCompleted: "Consultation Completed",
    dailyAppointments: "Daily Appointments",
    dailyAppointmentsDesc: "Manage your daily consultations and track patient flow easily.",
    statusFilter: "Status",
    waiting: "Waiting",
    childProfile: "Child Profile",
    time: "Time",
    id: "ID",
    scheduleClear: "Your schedule is clear!",
    scheduleClearDesc: "There are no appointments at this time. Enjoy a well-deserved break or catch up on patient medical notes.",
    languageSwitched: "Language switched to Arabic",

    // Patient Details / Consultation
    growthIndicator: "Growth Indicator",
    headCircumference: "Head Circumference",
    weight: "Weight",
    height: "Height",
    developmentCurve: "Development Curve",
    weightKg: "Weight (kg)",
    headCircumferenceCm: "Head Circumference (cm)",
    heightCm: "Height (cm)",
    growsAndLearns: "He grows and learns every day",
    movement: "His movement and activity",
    speech: "His speech and expression",
    understanding: "His understanding and perception",
    socialSkills: "His social skills and emotions",
    vaccineLog: "Vaccine Log",
    boy: "Boy",
    healthyGrowth: "confident and growing healthily",
    yearsAndMonths: "3 years and 2 months",

    // Messages
    chats: "Chats",
    searchHere: "Search here...",
    messenger: "Messenger",
    messengerEncrypted: "Your personal messages are end-to-end encrypted.",
    typeHere: "Type here...",
    statusLabel: "Status",
    savedMessages: "Saved messages",
    showMore: "Show more",
    you: "You",
    noContactsFound: "No contacts found",
    loadingMessages: "Loading messages...",
    noMessagesYet: "No messages yet. Start the conversation!",
    noSavedMessages: "No saved messages yet",
    totalPatients: "Total Patients",

    // Settings
    profileClinic: "Profile & Clinic",
    availabilitySchedule: "Availability & Schedule",
    notifications: "Notifications",
    saveChanges: "Save Changes",
    saved: "Saved!",
    specialization: "Specialization",
    clinicAddress: "Clinic Address",
    consultationFee: "Consultation Fee",
    bio: "Bio",
    workingDays: "Working Days",
    dayOff: "Day Off",
    consultationTime: "Consultation Time",
    slotDuration: "Slot duration",
    minute: "Minute",
    from: "From",
    to: "To",
    timeOff: "Time Off",
    addTime: "+ Add Time",
    reason: "Reason",
    medicalConference: "Medical Conference",
    personalLeave: "Personal Leave",
    alertPreferences: "Alert Preferences",
    newAppointments: "New Appointments",
    newAppointmentsDesc: "Notify me when a patient books a new visit.",
    cancellations: "Cancellations",
    cancellationsDesc: "Notify me if a patient cancels or reschedules an appointment.",
    patientUpdates: "Patient Updates",
    patientUpdatesDesc: "Notify me when patients or parents add new medical data or milestones.",
    directMessages: "Direct Messages",
    directMessagesDesc: "Notify me when I receive a new message from a patient.",

    // Days
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",

    // Months
    jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
    jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",

    // Vaccine names
    polioZeroDose: "Polio vaccination (zero dose)",
    measlesFirstDose: "Measles vaccination (first dose)",
    hepBThirdDose: "Hepatitis B vaccination (third dose)",
    polioSabin: "Polio Vaccine (Sabin)",
    polio9Month: "Polio Vaccine (9-Month Dose)",
    pentavalent: "Pentavalent Vaccine",
  },

  ar: {
    // Sidebar
    main: "الرئيسية",
    dashboard: "لوحة التحكم",
    schedule: "الجدول والمواعيد",
    patients: "المرضى",
    messages: "الرسائل",
    settingsSection: "الإعدادات",
    settings: "الإعدادات",
    logout: "تسجيل خروج",

    // Dashboard Header
    greeting: "صباح الخير، د. عبد الرحمن!",
    subGreeting: "نتمنى لك يوماً سعيداً في العمل",
    noNotifications: "لا توجد إشعارات جديدة",

    // KPI Cards
    monthlyPerformance: "الأداء الشهري",
    todaysAppointments: "مواعيد اليوم",
    totalActivePatients: "إجمالي المرضى النشطين",

    // Chart
    appointmentsOverview: "نظرة عامة على المواعيد",
    appointmentStatus: "حالة المواعيد",
    paymentMethods: "طرق الدفع",
    more: "المزيد",
    completed: "مكتمل",
    rescheduled: "مُعاد جدولته",
    canceled: "ملغي",
    card: "بطاقة",
    cash: "نقدي",
    patientsUnit: "مريض",

    // Right Sidebar
    today: "اليوم",
    scheduleLabel: "الجدول",
    sun: "أحد", mon: "إثن", tue: "ثلاث", wed: "أربع", thu: "خمي", fri: "جمع", sat: "سبت",

    // Login
    welcomeBack: "مرحباً بعودتك، دكتور",
    loginSubtitle: "قم بتسجيل الدخول إلى لوحة التحكم الطبية لإدارة مواعيدك وسجلات المرضى وجدولك اليومي.",
    emailOrMobile: "البريد الإلكتروني أو رقم الهاتف",
    emailPlaceholder: "أدخل بريدك الإلكتروني أو هاتفك",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    rememberMe: "تذكرني",
    forgotPassword: "نسيت كلمة المرور؟",
    login: "تسجيل الدخول",
    notMember: "لست عضواً في عيادتنا بعد؟",
    applyToJoin: "تقديم طلب انضمام",

    // Apply to Join
    becomePartner: "انضم كطبيب شريك",
    applySubtitle: "قدّم بياناتك المهنية للانضمام إلى شبكتنا المتخصصة في رعاية الأطفال. سيقوم فريقنا بمراجعة طلبك لتحديد موعد مقابلة قريباً.",
    fullName: "الاسم الكامل",
    fullNamePlaceholder: "أدخل اسمك",
    medicalSpecialty: "التخصص الطبي",
    specialtyPlaceholder: "أدخل تخصصك الطبي",
    phoneNumber: "رقم الهاتف",
    phonePlaceholder: "أدخل رقم هاتفك",
    yearsOfExperience: "سنوات الخبرة",
    experiencePlaceholder: "أدخل سنوات خبرتك",
    licenseNumber: "رقم الترخيص",
    licensePlaceholder: "أدخل رقم ترخيصك",
    professionalCredentials: "الشهادات المهنية",
    uploadInstructions: "يرجى رفع سيرتك الذاتية ورخصتك الطبية لمساعدة مجلسنا في مراجعة طلبك لعملية المقابلة.",
    fileSelected: "تم اختيار الملف",
    submit: "إرسال",

    // Validation
    fullNameRequired: "الاسم الكامل مطلوب",
    specialtyRequired: "التخصص مطلوب",
    phoneRequired: "رقم الهاتف مطلوب",
    invalidPhone: "صيغة الهاتف غير صحيحة",
    experienceRequired: "سنوات الخبرة مطلوبة",
    licenseRequired: "رقم الترخيص مطلوب",
    uploadRequired: "يرجى رفع شهاداتك",
    emailRequired: "البريد الإلكتروني أو الهاتف مطلوب",
    invalidEmailPhone: "يجب أن يكون بريد إلكتروني أو رقم هاتف صحيح",
    passwordRequired: "كلمة المرور مطلوبة",
    passwordMin: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    signupFailed: "فشل التسجيل. يرجى المحاولة مرة أخرى.",
    signupSuccess: "تم إنشاء الحساب بنجاح!",

    // OTP
    verifyNumber: "تحقق من بريدك الإلكتروني",
    otpSubtitle: "تم إرسال رمز التحقق إلى رقم هاتفك المنتهي بـ 4567. أدخله أدناه لتأكيد هويتك.",
    otpSubtitleEmail: "تم إرسال رمز التحقق إلى بريدك الإلكتروني المنتهي بـ {{email}}. أدخله أدناه لتأكيد هويتك.",
    otpSubtitlePhone: "تم إرسال رمز التحقق إلى رقم هاتفك المنتهي بـ {{phone}}. أدخله أدناه لتأكيد هويتك.",
    resendCodeIn: "إعادة إرسال الرمز خلال",
    didntReceive: "لم تستلم الرمز؟",
    resendCode: "إعادة الإرسال",
    enterCompleteCode: "يرجى إدخال الرمز المكون من 6 أرقام بالكامل",
    wrongNumber: "رقم خاطئ؟",
    wrongUsername: "اسم مستخدم خاطئ؟",
    changePhone: "تغيير رقم الهاتف",
    changeEmail: "تغيير البريد الإلكتروني",

    // Done
    applicationSubmitted: "تم تقديم الطلب بنجاح!",
    doneMessage: "تم إرسال ملفك إلى مجلسنا الطبي. سنقوم بمراجعة مؤهلاتك والتواصل معك خلال 48 ساعة لتحديد موعد المقابلة. مرحباً بك في مستقبل رعاية الأطفال!",
    done: "تم",

    // Patients Page
    totalPatients: "إجمالي المرضى",
    needsAttention: "يحتاج انتباه",
    activeThisWeek: "نشط هذا الأسبوع",
    patientDirectory: "دليل المرضى",
    patientDirectoryDesc: "عرض وتحديث ملفات المرضى والمعرفات وفئات العلاج.",
    findPatient: "ابحث عن مريض...",
    filter: "تصفية",
    patient: "المريض",
    fileId: "رقم الملف",
    age: "العمر",
    lastVisit: "آخر زيارة",
    status: "الحالة",
    actions: "الإجراءات",
    active: "نشط",
    overdue: "متأخر",
    loading: "جاري التحميل...",
    noPatientsFound: "لا يوجد مرضى",

    // Schedule Page
    startConsultation: "بدء الاستشارة",
    completeConsultation: "إنهاء الاستشارة",
    consultationCompleted: "تم الانتهاء من الاستشارة",
    dailyAppointments: "المواعيد اليومية",
    dailyAppointmentsDesc: "إدارة استشاراتك اليومية وتتبع تدفق المرضى بسهولة.",
    statusFilter: "الحالة",
    waiting: "في الانتظار",
    childProfile: "ملف الطفل",
    time: "الوقت",
    id: "المعرف",
    scheduleClear: "جدولك فارغ!",
    scheduleClearDesc: "لا توجد مواعيد في هذا الوقت. استمتع باستراحة مستحقة أو راجع ملاحظات المرضى الطبية.",
    languageSwitched: "تم التبديل إلى الإنجليزية",

    // Patient Details / Consultation
    growthIndicator: "مؤشر النمو",
    headCircumference: "محيط الرأس",
    weight: "الوزن",
    height: "الطول",
    developmentCurve: "منحنى التطور",
    weightKg: "الوزن (كجم)",
    headCircumferenceCm: "محيط الرأس (سم)",
    heightCm: "الطول (سم)",
    growsAndLearns: "ينمو ويتعلم كل يوم",
    movement: "حركته ونشاطه",
    speech: "كلامه وتعبيره",
    understanding: "فهمه وإدراكه",
    socialSkills: "مهاراته الاجتماعية وعواطفه",
    vaccineLog: "سجل التطعيمات",
    boy: "ولد",
    healthyGrowth: "واثق وينمو بصحة",
    yearsAndMonths: "3 سنوات وشهرين",

    // Messages
    chats: "المحادثات",
    searchHere: "ابحث هنا...",
    messenger: "المراسلة",
    messengerEncrypted: "رسائلك الشخصية مشفرة من طرف إلى طرف.",
    typeHere: "اكتب هنا...",
    statusLabel: "الحالة",
    savedMessages: "الرسائل المحفوظة",
    showMore: "عرض المزيد",
    you: "أنت",
    noContactsFound: "لا توجد جهات اتصال",
    loadingMessages: "جاري تحميل الرسائل...",
    noMessagesYet: "لا توجد رسائل بعد. ابدأ المحادثة!",
    noSavedMessages: "لا توجد رسائل محفوظة",
    totalPatients: "إجمالي المرضى",

    // Settings
    profileClinic: "الملف الشخصي والعيادة",
    availabilitySchedule: "التوفر والجدول",
    notifications: "الإشعارات",
    saveChanges: "حفظ التغييرات",
    saved: "تم الحفظ!",
    specialization: "التخصص",
    clinicAddress: "عنوان العيادة",
    consultationFee: "رسوم الاستشارة",
    bio: "نبذة",
    workingDays: "أيام العمل",
    dayOff: "إجازة",
    consultationTime: "وقت الاستشارة",
    slotDuration: "مدة الجلسة",
    minute: "دقيقة",
    from: "من",
    to: "إلى",
    timeOff: "أوقات الراحة",
    addTime: "+ إضافة وقت",
    reason: "السبب",
    medicalConference: "مؤتمر طبي",
    personalLeave: "إجازة شخصية",
    alertPreferences: "تفضيلات التنبيه",
    newAppointments: "مواعيد جديدة",
    newAppointmentsDesc: "أبلغني عندما يحجز مريض زيارة جديدة.",
    cancellations: "الإلغاءات",
    cancellationsDesc: "أبلغني إذا ألغى مريض أو أعاد جدولة موعد.",
    patientUpdates: "تحديثات المرضى",
    patientUpdatesDesc: "أبلغني عندما يضيف المرضى أو الأهل بيانات طبية أو إنجازات جديدة.",
    directMessages: "الرسائل المباشرة",
    directMessagesDesc: "أبلغني عندما أتلقى رسالة جديدة من مريض.",

    // Days
    friday: "الجمعة",
    saturday: "السبت",
    sunday: "الأحد",
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",

    // Months
    jan: "يناير", feb: "فبراير", mar: "مارس", apr: "أبريل", may: "مايو", jun: "يونيو",
    jul: "يوليو", aug: "أغسطس", sep: "سبتمبر", oct: "أكتوبر", nov: "نوفمبر", dec: "ديسمبر",

    // Vaccine names
    polioZeroDose: "تطعيم شلل الأطفال (الجرعة الصفرية)",
    measlesFirstDose: "تطعيم الحصبة (الجرعة الأولى)",
    hepBThirdDose: "تطعيم التهاب الكبد ب (الجرعة الثالثة)",
    polioSabin: "لقاح شلل الأطفال (سابين)",
    polio9Month: "لقاح شلل الأطفال (جرعة 9 أشهر)",
    pentavalent: "اللقاح الخماسي",
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.documentElement.style.fontFamily = language === 'ar'
      ? "'IBM Plex Sans Arabic', 'Inter', system-ui, sans-serif"
      : "'Inter', system-ui, -apple-system, sans-serif";
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
