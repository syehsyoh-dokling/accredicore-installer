(function () {
  const state = {
    platform: 'unknown',
    runtime: (window.accredicore && window.accredicore.runtime) || 'browser',
    homeInfo: null,

    checkCompleted: false,
    lastReport: null,
    dependencyIssues: false,
    portIssues: false,
    portResolved: false,
    portPlan: {
      frontend: 4173,
      localApi: 3005,
      db: 5432
    },

    installCompleted: false,
    cloneCompleted: false,
    repoValidated: false,
    dbBootstrapCompleted: false,
    dbBootstrapFailed: false,
    configImported: false,
    serverStarted: false,
    serverStartFailed: false,
    loginShown: false,
    language: 'en',

    portDecisions: {},
    envPath: '',
    activationPath: '',
    activationRequest: null,
    downloadPreference: null
  };

  const translations = {
    en: {
      heroEyebrow: 'AccrediCore native installer',
      heroTitle: 'Windows setup console',
      heroLead: 'The workflow is locked step-by-step: check requirements, install missing dependencies, resolve ports, clone the AccrediCore source, bootstrap the database, import activation configuration, start services, and show login access.',
      languageLabel: 'Language',
      platformLabel: 'Platform:',
      runtimeLabel: 'Runtime:',
      inputsTitle: 'Inputs',
      workingDirectory: 'Working directory',
      gitRemoteUrl: 'Git remote URL',
      sourceZipPath: 'Source ZIP path (legacy / optional)',
      actionsTitle: 'Actions',
      step1Button: 'Step 1. Check requirements',
      step2Button: 'Step 2. Install dependencies',
      rerunCheckButton: 'Re-run Step 1 Check',
      workflowInitial: 'Step 1 is active. Run "Check requirements" first.',
      step3Title: 'Step 3 — Port Resolution',
      step3Lead: 'Review each conflicting port and choose how AccrediCore should handle it.',
      applyPortDecisions: 'Apply port decisions',
      automaticPortHandling: 'Automatic port handling',
      automaticPortLead: 'The installer detects busy ports and applies a safe recommendation automatically. No manual port choice is needed.',
      step4Title: 'Step 4 — Clone AccrediCore Source',
      step4Lead: 'Choose where the final source code should be stored, then clone the `accredicore-main` repository. The installer will create the target folder automatically if needed.',
      recommendedProjectLocation: 'Recommended project location',
      projectFolderName: 'Project folder name',
      customBasePath: 'Custom base path',
      browse: 'Browse',
      finalTargetPath: 'Final target path preview',
      cloneRepoButton: 'Step 4. Start clone source code',
      validateRepoButton: 'Step 4. Validate source code',
      step4Locked: 'Step 4 is locked until requirement checks and port decisions are complete.',
      step5Title: 'Step 5 — Create Database and Import Structure',
      step5Lead: 'After the repository is validated, create the database automatically and import the bundled schema from the cloned AccrediCore project.',
      dbHost: 'Database host',
      dbPort: 'Database port',
      dbName: 'Database name',
      dbUser: 'Database user',
      dbPassword: 'Database password',
      dbPasswordHelp: 'Required. Minimum 8 characters with uppercase, lowercase, number, and symbol such as #, $, &, !, or @.',
      step5Button: 'Step 5A/5B. Create database, import structure, and test connection',
      step5Locked: 'Step 5A/5B is locked until repository validation completes.',
      step6Title: 'Step 6 — Activation Configuration',
      step6Lead: 'Choose the activation path. If this device has internet, the installer will send an activation request to https://accredicore.danandad.com/ and save the unique `.env` and `activation.json` locally. If this device is offline, generate an offline activation code and submit it from another device using the same email used during registration.',
      onlineActivationButton: 'Yes, this device is online',
      offlineActivationButton: 'No, this device is offline',
      activationGuidanceTitle: 'Activation guidance',
      openActivationSite: 'Open https://accredicore.danandad.com/#activation',
      copyPortalUrl: 'Copy portal URL',
      downloadActivationRequest: 'Download activation-request.json',
      envFile: '.env file',
      activationJsonFile: 'activation.json file',
      step6Button: 'Step 6. Import .env and activation.json',
      step6Locked: 'Step 6 is locked until database bootstrap completes.',
      step7Title: 'Step 7 — Start Backend and Frontend',
      step7Lead: 'After activation configuration succeeds, start the local backend services and the frontend development server.',
      serverStartingNote: 'Server is starting. This can take 2-3 minutes on the first run. Please wait and do not close the opened service windows until Step 8 appears. If your Windows appears and redirects you to CMD/PowerShell Prompt, do not close them. Keep them open, then go back to this installer page for the next step (Step 8).',
      step7Button: 'Step 7. Run backend and frontend',
      step7Locked: 'Step 7 is locked until configuration import succeeds.',
      step8Title: 'Step 8 — Login Access',
      step8Lead: 'After the servers are running, open the local login URL and use the root account below for the first smoke test.',
      step8Button: 'Step 8. Show login URL and root account',
      openLoginUrl: 'Click here to open login page',
      loginDetailsTitle: 'Local login details',
      loginUrlLabel: 'Login URL:',
      rootUsernameLabel: 'Your username:',
      rootPasswordLabel: 'Your password:',
      loginCredentialNote: 'Please use copy/paste for this credential to login into your superadmin (root) account and start creating other accounts. If the login page cannot be reached, wait 2-3 minutes and reload after the frontend terminal shows the local URL.',
      extraAccountsHint: 'Additional test accounts are available in the manual test guide: quality-manager, department-manager, team-leader, and staff-user.',
      step8Locked: 'Step 8 is locked until the servers are launched.',
      outputTitle: 'Output',
      nextStepKicker: 'Next step',
      nextInstallTitle: 'Step 2 — Install Dependencies',
      nextInstallText: 'Required dependencies are missing. Click Step 2 now; the installer will install or repair missing items, then you will re-run Step 1.',
      nextRerunCheckTitle: 'Step 1 — Re-check Requirements',
      nextRerunAfterInstall: 'Dependency installation finished. Re-run Step 1 so the installer can unlock the next step only after PostgreSQL Client (psql), npm/pnpm, Docker, and other required checks pass.',
      nextRerunAfterWarning: 'Missing dependencies were detected. Run Step 2 Install Dependencies first, then re-run Step 1 Check Requirements.',
      nextValidateRepo: 'Validate source code first',
      nextBootstrapDatabase: 'Step 5A/5B. Database Set-up',
      nextFixDatabaseTitle: 'Step 5A/5B — Fix Database Set-up',
      nextFixDatabaseText: 'Step 5 did not complete. Step 6 is locked. Fix PostgreSQL Client (psql) or the database password, run Step 1 Check Requirements again, then retry Step 5A/5B.',
      nextImportConfig: 'Step 6. Import configuration',
      nextStartServers: 'Step 7. Start servers',
      nextFixServersTitle: 'Step 7 — Fix Docker Desktop First',
      nextFixServersText: 'Server startup did not complete. The installer tried to open Docker Desktop automatically. Complete Docker login/register if requested, wait until the Docker engine is running, then click Step 7 again. Step 8 stays locked until startup succeeds.',
      openDockerDesktop: 'Open Docker Desktop / Login',
      nextShowLogin: 'Step 8. Show login access',
      offlineActivationEyebrow: 'Offline activation',
      offlineActivationModalTitle: 'Use another internet-connected device',
      offlineActivationModalLead: 'This server/device is marked offline, so it will not open the vendor website automatically. Copy the portal URL below, open it from a phone or another device with internet, then enter the same email used during registration and the installation code shown in Step 6.',
      vendorPortalUrl: 'Vendor portal URL',
      iUnderstand: 'I understand'
    },
    ar: {
      heroEyebrow: 'مثبت AccrediCore المحلي',
      heroTitle: 'وحدة إعداد ويندوز',
      heroLead: 'سير العمل مقفل خطوة بخطوة: فحص المتطلبات، تثبيت النواقص، معالجة المنافذ، تنزيل المصدر، إعداد قاعدة البيانات، استيراد التفعيل، تشغيل الخدمات، ثم عرض بيانات الدخول.',
      languageLabel: 'اللغة',
      platformLabel: 'النظام:',
      runtimeLabel: 'بيئة التشغيل:',
      inputsTitle: 'المدخلات',
      workingDirectory: 'مجلد العمل',
      gitRemoteUrl: 'رابط مستودع Git',
      sourceZipPath: 'مسار ملف ZIP اختياري',
      actionsTitle: 'الإجراءات',
      step1Button: 'الخطوة 1. فحص المتطلبات',
      step2Button: 'الخطوة 2. تثبيت المتطلبات',
      rerunCheckButton: 'إعادة فحص الخطوة 1',
      workflowInitial: 'الخطوة 1 فعالة. شغل فحص المتطلبات أولا.',
      step3Title: 'الخطوة 3 — معالجة المنافذ',
      step3Lead: 'راجع المنافذ المتعارضة واختر كيف يتعامل معها النظام.',
      applyPortDecisions: 'تطبيق قرارات المنافذ',
      automaticPortHandling: 'معالجة المنافذ تلقائيا',
      automaticPortLead: 'يقوم المثبت بفحص المنافذ المستخدمة وتطبيق توصية آمنة تلقائيا. لا يحتاج المستخدم إلى اختيار منفذ يدويا.',
      step4Title: 'الخطوة 4 — تنزيل مصدر AccrediCore',
      step4Lead: 'اختر مكان حفظ المصدر النهائي، ثم قم بتنزيل مستودع accredicore-main. سيقوم المثبت بإنشاء المجلد تلقائيا عند الحاجة.',
      recommendedProjectLocation: 'موقع المشروع المقترح',
      projectFolderName: 'اسم مجلد المشروع',
      customBasePath: 'مسار مخصص',
      browse: 'استعراض',
      finalTargetPath: 'معاينة المسار النهائي',
      cloneRepoButton: 'الخطوة 4. بدء تنزيل المصدر',
      validateRepoButton: 'الخطوة 4. التحقق من المصدر',
      step4Locked: 'الخطوة 4 مقفلة حتى يكتمل فحص المتطلبات وقرار المنافذ.',
      step5Title: 'الخطوة 5 — إنشاء قاعدة البيانات واستيراد الهيكل',
      step5Lead: 'بعد التحقق من المستودع، قم بإنشاء قاعدة البيانات تلقائيا واستيراد الهيكل المرفق.',
      dbHost: 'مضيف قاعدة البيانات',
      dbPort: 'منفذ قاعدة البيانات',
      dbName: 'اسم قاعدة البيانات',
      dbUser: 'مستخدم قاعدة البيانات',
      dbPassword: 'كلمة مرور قاعدة البيانات',
      dbPasswordHelp: 'إلزامي. 8 أحرف على الأقل مع حرف كبير وصغير ورقم ورمز مثل # أو $ أو & أو ! أو @.',
      step5Button: 'الخطوة 5A/5B. إنشاء قاعدة البيانات والاستيراد واختبار الاتصال',
      step5Locked: 'الخطوة 5A/5B مقفلة حتى يتم التحقق من المستودع.',
      step6Title: 'الخطوة 6 — إعداد التفعيل',
      step6Lead: 'اختر طريقة التفعيل. إذا كان الجهاز متصلا بالإنترنت، سيرسل المثبت طلب التفعيل ويحفظ ملفات .env و activation.json محليا. إذا كان الجهاز غير متصل، أنشئ رمز تفعيل وافتح بوابة المورد من جهاز آخر بنفس البريد المسجل.',
      onlineActivationButton: 'نعم، هذا الجهاز متصل',
      offlineActivationButton: 'لا، هذا الجهاز غير متصل',
      activationGuidanceTitle: 'إرشادات التفعيل',
      openActivationSite: 'فتح بوابة التفعيل',
      copyPortalUrl: 'نسخ رابط البوابة',
      downloadActivationRequest: 'تنزيل activation-request.json',
      envFile: 'ملف .env',
      activationJsonFile: 'ملف activation.json',
      step6Button: 'الخطوة 6. استيراد .env و activation.json',
      step6Locked: 'الخطوة 6 مقفلة حتى يكتمل إعداد قاعدة البيانات.',
      step7Title: 'الخطوة 7 — تشغيل الخلفية والواجهة',
      step7Lead: 'بعد نجاح إعداد التفعيل، شغل خدمات الخلفية وخادم الواجهة المحلي.',
      serverStartingNote: 'جاري تشغيل الخادم. قد يستغرق ذلك من دقيقتين إلى ثلاث دقائق في أول تشغيل. يرجى الانتظار وعدم إغلاق نوافذ CMD/PowerShell المفتوحة. اتركها مفتوحة ثم ارجع إلى صفحة المثبت للخطوة التالية (الخطوة 8).',
      step7Button: 'الخطوة 7. تشغيل الخلفية والواجهة',
      step7Locked: 'الخطوة 7 مقفلة حتى ينجح استيراد الإعدادات.',
      step8Title: 'الخطوة 8 — بيانات الدخول',
      step8Lead: 'بعد تشغيل الخوادم، افتح رابط الدخول المحلي واستخدم حساب الجذر لاختبار أولي.',
      step8Button: 'الخطوة 8. عرض رابط الدخول وحساب الجذر',
      openLoginUrl: 'اضغط هنا لفتح صفحة الدخول',
      loginDetailsTitle: 'بيانات الدخول المحلية',
      loginUrlLabel: 'رابط الدخول:',
      rootUsernameLabel: 'اسم المستخدم:',
      rootPasswordLabel: 'كلمة المرور:',
      loginCredentialNote: 'يرجى نسخ ولصق بيانات الدخول هذه للدخول إلى حساب المدير الأعلى (root) ثم إنشاء الحسابات الأخرى. إذا لم تفتح صفحة الدخول، انتظر من دقيقتين إلى ثلاث دقائق ثم أعد التحميل بعد ظهور الرابط المحلي في نافذة الواجهة.',
      extraAccountsHint: 'توجد حسابات اختبار إضافية في دليل الاختبار اليدوي: مدير الجودة، مدير القسم، قائد الفريق، والمستخدم العادي.',
      step8Locked: 'الخطوة 8 مقفلة حتى يتم تشغيل الخوادم.',
      outputTitle: 'المخرجات',
      nextStepKicker: 'الخطوة التالية',
      nextInstallTitle: 'الخطوة 2 — تثبيت المتطلبات',
      nextInstallText: 'هناك متطلبات ناقصة. اضغط الخطوة 2 الآن؛ سيقوم المثبت بتثبيت أو إصلاح العناصر الناقصة، ثم أعد فحص الخطوة 1.',
      nextRerunCheckTitle: 'الخطوة 1 — إعادة فحص المتطلبات',
      nextRerunAfterInstall: 'انتهى تثبيت المتطلبات. أعد فحص الخطوة 1 حتى يفتح المثبت الخطوة التالية فقط بعد نجاح PostgreSQL Client (psql) و npm/pnpm و Docker وبقية الفحوصات المطلوبة.',
      nextRerunAfterWarning: 'تم اكتشاف متطلبات ناقصة. شغل الخطوة 2 لتثبيت المتطلبات أولا، ثم أعد فحص الخطوة 1.',
      nextValidateRepo: 'تحقق من المصدر أولا',
      nextBootstrapDatabase: 'الخطوة 5A/5B. إعداد قاعدة البيانات',
      nextFixDatabaseTitle: 'الخطوة 5A/5B — إصلاح إعداد قاعدة البيانات',
      nextFixDatabaseText: 'لم تكتمل الخطوة 5. ستبقى الخطوة 6 مقفلة. أصلح PostgreSQL Client (psql) أو كلمة مرور قاعدة البيانات، ثم أعد فحص الخطوة 1 وجرب الخطوة 5A/5B مرة أخرى.',
      nextImportConfig: 'الخطوة 6. استيراد الإعدادات',
      nextStartServers: 'الخطوة 7. تشغيل الخوادم',
      nextFixServersTitle: 'الخطوة 7 — أصلح Docker Desktop أولا',
      nextFixServersText: 'لم يكتمل تشغيل الخادم. حاول المثبت فتح Docker Desktop تلقائيا. أكمل تسجيل الدخول أو إنشاء الحساب إذا طلب Docker ذلك، وانتظر حتى يعمل المحرك، ثم اضغط الخطوة 7 مرة أخرى. ستبقى الخطوة 8 مقفلة حتى ينجح التشغيل.',
      openDockerDesktop: 'فتح Docker Desktop / تسجيل الدخول',
      nextShowLogin: 'الخطوة 8. عرض بيانات الدخول',
      offlineActivationEyebrow: 'تفعيل بدون إنترنت',
      offlineActivationModalTitle: 'استخدم جهازا آخر متصلا بالإنترنت',
      offlineActivationModalLead: 'تم تحديد هذا الجهاز كغير متصل، لذلك لن يفتح موقع المورد تلقائيا. انسخ رابط البوابة وافتحه من هاتف أو جهاز آخر متصل، ثم أدخل نفس البريد المستخدم عند التسجيل ورمز التثبيت الظاهر في الخطوة 6.',
      vendorPortalUrl: 'رابط بوابة المورد',
      iUnderstand: 'فهمت'
    }
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function getActionButton(action) {
    return document.querySelector(`[data-action="${action}"]`);
  }

  function setButtonVisible(action, visible) {
    const btn = getActionButton(action);
    if (!btn) return;
    btn.style.display = visible ? '' : 'none';
  }

  function setButtonEnabled(action, enabled) {
    const btn = getActionButton(action);
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute('aria-disabled', String(!enabled));
  }

  function setText(id, text) {
    const el = byId(id);
    if (el) el.textContent = text;
  }

  function translate(key) {
    const lang = translations[state.language] ? state.language : 'en';
    return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
  }

  function applyLanguage(lang) {
    state.language = translations[lang] ? lang : 'en';
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;
      el.textContent = translate(key);
    });
    const select = byId('language-select');
    if (select) select.value = state.language;
  }

  function setWorkflowStatus(text) {
    const el = byId('workflow-status');
    if (el) el.textContent = text;
  }

  function setGithubStepStatus(text) {
    const el = byId('github-step-status');
    if (el) el.textContent = text;
  }

  function appendOutput(text) {
    const el = byId('command-output');
    if (!el) return;
    el.value += text.endsWith('\n') ? text : text + '\n';
    el.scrollTop = el.scrollHeight;
  }

  async function detectPlatform() {
    if (window.accredicore && typeof window.accredicore.getPlatform === 'function') {
      try {
        state.platform = await window.accredicore.getPlatform();
        return state.platform;
      } catch (error) {}
    }

    const lower = ((navigator.userAgent || '') + ' ' + (navigator.platform || '')).toLowerCase();
    if (lower.includes('win')) return (state.platform = 'windows');
    if (lower.includes('mac') || lower.includes('darwin')) return (state.platform = 'macos');
    if (lower.includes('linux') || lower.includes('x11')) return (state.platform = 'linux');
    return (state.platform = 'unknown');
  }

  async function loadHomeInfo() {
    if (window.accredicore && typeof window.accredicore.getHomeInfo === 'function') {
      try {
        state.homeInfo = await window.accredicore.getHomeInfo();
        return;
      } catch (error) {}
    }

    state.homeInfo = {
      home: 'C:\\Users\\User',
      desktop: 'C:\\Users\\User\\Desktop',
      downloads: 'C:\\Users\\User\\Downloads',
      documents: 'C:\\Users\\User\\Documents',
      username: 'User'
    };
  }

  async function applyDownloadPreference() {
    if (!(window.accredicore && typeof window.accredicore.getDownloadPreference === 'function')) return;

    try {
      const preference = await window.accredicore.getDownloadPreference();
      if (!preference || !preference.preferred_location) return;
      state.downloadPreference = preference;

      const locationSelect = byId('project-location');
      if (!locationSelect) return;

      const normalized = String(preference.preferred_location).trim().toLowerCase();
      const allowed = Array.from(locationSelect.options).map((option) => option.value);
      if (!allowed.includes(normalized)) return;

      locationSelect.value = normalized;
      appendOutput(`Deployment preference loaded: project target defaults to ${normalized}.`);
      if (preference.source_path) appendOutput(`Preference file: ${preference.source_path}`);
    } catch (error) {
      appendOutput('Could not load deployment preference: ' + (error && error.message ? error.message : String(error)));
    }
  }

  function extractJsonBlock(text) {
    if (!text) return null;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (error) {
      return null;
    }
  }

  function getSummaryStatus(report, key) {
    if (!report || !report.summary) return '';
    return String(report.summary[key] || '').trim().toLowerCase();
  }

  function hasDependencyIssues(report) {
    const dependencyKeys = ['git', 'node', 'package_manager', 'docker', 'postgres_client', 'disk_space', 'internet', 'write_access'];
    return dependencyKeys.some((key) => {
      const value = getSummaryStatus(report, key);
      if (key === 'postgres_client') return value !== 'passed';
      return value === 'missing' || value === 'failed';
    });
  }

  function hasPostgresClient(report) {
    return getSummaryStatus(report, 'postgres_client') === 'passed';
  }

  function validateDbInputs() {
    const dbHost = String(byId('db-host')?.value || '').trim();
    const dbPort = String(byId('db-port')?.value || '').trim();
    const dbName = String(byId('db-name')?.value || '').trim();
    const dbUser = String(byId('db-user')?.value || '').trim();
    const dbPassword = String(byId('db-password')?.value || '');

    if (!/^[A-Za-z0-9._-]{1,253}$/.test(dbHost) && dbHost !== 'localhost') {
      return 'Database host must be 1-253 characters and contain only letters, numbers, dot, dash, underscore, or localhost.';
    }

    const portNumber = Number(dbPort);
    if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) {
      return 'Database port must be a number between 1 and 65535.';
    }

    if (!/^[a-z][a-z0-9_]{0,62}$/.test(dbName)) {
      return 'Database name must start with a lowercase letter and use only lowercase letters, numbers, and underscore, max 63 characters.';
    }

    if (!/^[a-z][a-z0-9_]{0,62}$/.test(dbUser)) {
      return 'Database user must start with a lowercase letter and use only lowercase letters, numbers, and underscore, max 63 characters.';
    }

    if (dbPassword.length < 8 || dbPassword.length > 256) {
      return 'Database password is required and must be 8-256 characters.';
    }

    if (!/[a-z]/.test(dbPassword) || !/[A-Z]/.test(dbPassword) || !/\d/.test(dbPassword) || !/[^A-Za-z0-9]/.test(dbPassword)) {
      return 'Database password must include uppercase, lowercase, number, and symbol such as #, $, &, !, or @.';
    }

    return '';
  }

  function getBusyPorts(report) {
    const portCheck = report && report.checks ? report.checks.ports : null;
    const ports = portCheck && Array.isArray(portCheck.ports) ? portCheck.ports : [];
    return ports.filter((p) => p && p.in_use);
  }

  function hasPortIssues(report) {
    return false;
  }

  function nextAvailablePort(basePort, busyPorts) {
    const busySet = new Set((busyPorts || []).map((p) => Number(p.port)).filter(Boolean));
    let candidate = Number(basePort) + 1;
    while (busySet.has(candidate) && candidate < 65535) candidate += 1;
    return candidate <= 65535 ? candidate : Number(basePort);
  }

  function buildPortPlan(report) {
    const busyPorts = getBusyPorts(report);
    const plan = {
      frontend: 4173,
      localApi: 3005,
      db: 5432,
      recommendations: []
    };

    busyPorts.forEach((port) => {
      const portNumber = Number(port && port.port);
      const processName = String((port && port.process_name) || '').toLowerCase();

      if (portNumber === 5432 && processName.includes('postgres')) {
        plan.db = 5432;
        plan.recommendations.push({
          port: 5432,
          label: 'PostgreSQL database',
          action: 'Reuse existing PostgreSQL service automatically',
          recommended: 5432
        });
        return;
      }

      if (portNumber === 4173) {
        plan.frontend = nextAvailablePort(4173, busyPorts);
        plan.recommendations.push({
          port: 4173,
          label: 'Frontend login page',
          action: `Use ${plan.frontend} automatically for the frontend`,
          recommended: plan.frontend
        });
        return;
      }

      if (portNumber === 3005) {
        plan.localApi = nextAvailablePort(3005, busyPorts);
        plan.recommendations.push({
          port: 3005,
          label: 'Local API',
          action: `Use ${plan.localApi} automatically for the local API`,
          recommended: plan.localApi
        });
        return;
      }

      if (portNumber === 54321 || portNumber === 54323) {
        plan.recommendations.push({
          port: portNumber,
          label: portNumber === 54321 ? 'Supabase API' : 'Supabase Studio',
          action: 'Reuse the existing local Supabase service if it belongs to this stack',
          recommended: portNumber
        });
        return;
      }

      plan.recommendations.push({
        port: portNumber || 'unknown',
        label: 'Application service',
        action: 'Avoid this busy port automatically',
        recommended: 'auto'
      });
    });

    return plan;
  }

  function describeAutoPortHandling(port) {
    const portNumber = Number(port && port.port);
    const processName = String((port && port.process_name) || '').toLowerCase();
    if (portNumber === 5432 && processName.includes('postgres')) {
      return 'PostgreSQL is already running on port 5432, so the installer will reuse it automatically.';
    }

    if (portNumber === 4173 || portNumber === 3005) {
      const plan = state.portPlan || buildPortPlan(state.lastReport);
      const recommended = portNumber === 4173 ? plan.frontend : plan.localApi;
      return `Port ${portNumber} is already in use, so the installer recommends and applies port ${recommended} automatically.`;
    }

    return `Port ${port && port.port ? port.port : 'unknown'} is already in use, so the installer will avoid it automatically and continue with a safe internal setting.`;
  }

  function getPathSeparator() {
    return state.platform === 'windows' ? '\\' : '/';
  }

  function joinPathByPlatform(base, name) {
    const sep = getPathSeparator();
    const b = String(base || '').replace(/[\\/]+$/, '');
    const n = String(name || '').replace(/^[\\/]+/, '');
    if (!b) return n;
    return `${b}${sep}${n}`;
  }

  function normalizeBasePath(base) {
    let value = String(base || '').trim();
    if (!value) return '';

    if (state.platform === 'windows') {
      return value.replace(/\//g, '\\');
    }

    return value.replace(/\\/g, '/');
  }

  function getSelectedBasePath() {
    const preset = byId('project-location')?.value || 'documents';
    const custom = (byId('custom-base-path')?.value || '').trim();
    const folderName = (byId('project-folder-name')?.value || 'Arab Compliance Hub').trim();
    const info = state.homeInfo || {};

    let base = '';

    if (state.platform === 'windows') {
      if (preset === 'documents') base = info.documents || 'C:\\Users\\Saifuddin\\Documents';
      else if (preset === 'desktop') base = info.desktop || 'C:\\Users\\Saifuddin\\Desktop';
      else if (preset === 'userhome') base = info.home || 'C:\\Users\\Saifuddin';
      else if (preset === 'dev') base = 'C:\\Dev';
      else if (preset === 'root') base = 'C:\\';
      else if (preset === 'custom') base = custom;
    } else if (state.platform === 'linux') {
      if (preset === 'documents') base = info.documents || '/home/user/Documents';
      else if (preset === 'desktop') base = info.desktop || '/home/user/Desktop';
      else if (preset === 'userhome') base = info.home || '/home/user';
      else if (preset === 'dev') base = joinPathByPlatform(info.home || '/home/user', 'dev');
      else if (preset === 'root') base = '/opt';
      else if (preset === 'custom') base = custom;
    } else if (state.platform === 'macos') {
      if (preset === 'documents') base = info.documents || '/Users/user/Documents';
      else if (preset === 'desktop') base = info.desktop || '/Users/user/Desktop';
      else if (preset === 'userhome') base = info.home || '/Users/user';
      else if (preset === 'dev') base = joinPathByPlatform(info.home || '/Users/user', 'Developer');
      else if (preset === 'root') base = '/Users';
      else if (preset === 'custom') base = custom;
    } else {
      if (preset === 'documents') base = info.documents || '';
      else if (preset === 'desktop') base = info.desktop || '';
      else if (preset === 'userhome') base = info.home || '';
      else if (preset === 'dev') base = info.home ? joinPathByPlatform(info.home, 'dev') : '';
      else if (preset === 'root') base = '';
      else if (preset === 'custom') base = custom;
    }

    base = normalizeBasePath(base);
    if (!base) return '';
    if (!folderName) return base;

    return joinPathByPlatform(base, folderName);
  }

  function refreshTargetPreview() {
    const preset = byId('project-location')?.value || 'documents';
    const customWrap = byId('custom-location-wrap');
    if (customWrap) customWrap.style.display = preset === 'custom' ? '' : 'none';

    const target = getSelectedBasePath();
    const preview = byId('target-path-preview');
    if (preview) preview.value = target;
    refreshWorkflow();
  }

  function renderBrowserModeBlocker() {
    const shell = document.querySelector('.page-shell');
    const main = document.querySelector('main');
    if (!shell || !main) return;

    const launcherMap = {
      windows: {
        file: 'Start-Installer-for-windows.bat',
        action: 'Double-click Start-Installer-for-windows.bat. If Windows blocks it, right-click and choose Run as administrator.',
        fallback: 'If the BAT file does not open, right-click it and choose Open with Windows Command Processor.'
      },
      linux: {
        file: 'Start-Installer-for-linux.sh',
        action: 'Open Terminal in the extracted folder, then run: chmod +x Start-Installer-for-linux.sh && ./Start-Installer-for-linux.sh',
        fallback: 'If permission is denied, run chmod +x Start-Installer-for-linux.sh first.'
      },
      macos: {
        file: 'Start-Installer-for-macos.command',
        action: 'Double-click Start-Installer-for-macos.command, or run it from Terminal after chmod +x.',
        fallback: 'If macOS blocks it, open System Settings > Privacy & Security and allow the file.'
      }
    };

    const current = launcherMap[state.platform] || launcherMap.windows;
    const guide = document.createElement('section');
    guide.className = 'browser-blocker card stack-gap';
    guide.innerHTML = `
      <p class="eyebrow">Native installer required</p>
      <h2>You opened the browser guide, not the real installer</h2>
      <p class="lead">
        This browser page cannot check Docker, PostgreSQL, ports, or install dependencies.
        To run the real setup workflow, close this browser tab and launch the native runner from the extracted installer folder.
      </p>
      <div class="next-step-panel">
        <h3>Use this file</h3>
        <p class="lead"><code>${current.file}</code></p>
        <p class="lead">${current.action}</p>
        <p class="lead">${current.fallback}</p>
      </div>
      <ol class="steps-list">
        <li>Make sure the ZIP has been extracted first. Do not open files from inside the ZIP preview.</li>
        <li>Open the extracted folder named <code>Arab-Compaliance-Hub-Installer</code>.</li>
        <li>Run <code>${current.file}</code>.</li>
        <li>When the native window opens, <strong>Runtime</strong> must show <code>electron</code>, not <code>browser</code>.</li>
      </ol>
      <div class="button-row wrap">
        <a class="btn secondary" href="../../index.html">Open start guide</a>
      </div>
    `;

    main.style.display = 'none';
    shell.appendChild(guide);
    setWorkflowStatus('Browser-only mode detected. Close this page and run the native launcher file from the extracted installer folder.');
  }

  function renderPortResolution(report) {
    const wrap = byId('port-resolution-wrap');
    const body = byId('port-resolution-body');
    if (!wrap || !body) return;

    const plan = buildPortPlan(report);
    state.portPlan = plan;
    const recommendations = plan.recommendations || [];
    body.innerHTML = '';
    if (!recommendations.length) {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = '';
    const heading = byId('port-resolution-title');
    const lead = byId('port-resolution-lead');
    if (heading) heading.textContent = translate('automaticPortHandling');
    if (lead) lead.textContent = translate('automaticPortLead');

    recommendations.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'next-step-panel';
      card.innerHTML = `
        <div>
          <p class="eyebrow">Port ${item.port}</p>
          <h3>${item.label}</h3>
          <p class="lead">${item.action}</p>
        </div>
        <div class="status-pill">Recommended: ${item.recommended}</div>
      `;
      body.appendChild(card);
    });
  }

  function allPortDecisionsComplete() {
    const busyPorts = getBusyPorts(state.lastReport);
    if (!busyPorts.length) return true;

    for (const p of busyPorts) {
      const portKey = String(p.port);
      const decision = state.portDecisions[portKey];
      if (!decision) return false;
      if (decision === 'change') {
        const alt = state.portDecisions[portKey + '_alt'];
        if (!alt || !/^\d+$/.test(alt)) return false;
      }
    }
    return true;
  }

  function buildDevOpsNarrative(report) {
    if (!report || typeof report !== 'object') return '';

    const summary = report.summary || {};
    const checks = report.checks || {};
    const passed = [];
    const warnings = [];
    const failed = [];

    Object.keys(summary).forEach((key) => {
      const value = String(summary[key] || '').trim();
      if (key === 'ports') return;
      const title = checks[key] && checks[key].title ? checks[key].title : key;
      if (/^passed$/i.test(value)) passed.push(title);
      else if (/^warning$/i.test(value)) warnings.push(title);
      else if (/^failed$/i.test(value) || /^missing$/i.test(value)) failed.push(title);
    });

    const busyPorts = getBusyPorts(report);
    const lines = [];
    lines.push('');
    lines.push('============================================================');
    lines.push('DEVOPS OPERATIONAL SUMMARY');
    lines.push('============================================================');
    lines.push('');
    lines.push('Result:');
    lines.push('- Environment check completed successfully.');
    if (passed.length) lines.push('- Passed checks: ' + passed.join(', ') + '.');

    if (warnings.length || failed.length) {
      lines.push('');
      lines.push('Issue / Warning:');
      if (warnings.length) lines.push('- Warning checks: ' + warnings.join(', ') + '.');
      if (failed.length) lines.push('- Missing or failed checks: ' + failed.join(', ') + '.');
    } else {
      lines.push('- No blocking issue was detected in the current requirement check.');
    }

    if (busyPorts.length) {
      lines.push('- Port handling completed automatically.');
      busyPorts.forEach((p) => {
        lines.push('- ' + describeAutoPortHandling(p));
      });
    }

    lines.push('');
    lines.push('Instruction:');
    if (hasDependencyIssues(report)) {
      lines.push('1. Click "Step 2. Install dependencies".');
      lines.push('2. Click "Re-run Step 1 Check" after dependency installation finishes.');
      lines.push('3. Continue only when all required dependencies pass.');
      lines.push('4. If PostgreSQL was just installed, restart this installer once, then click "Re-run Step 1 Check".');
    } else {
      lines.push('1. Step 4 is now active: clone the Arab Compliance Hub source repository.');
      lines.push('2. Choose the project location.');
      lines.push('3. Click "Clone repository from GitHub".');
      lines.push('4. Validate the repository content.');
      lines.push('5. Continue to database bootstrap.');
    }

    return lines.join('\n');
  }

  function updateStateFromReport(report) {
    state.lastReport = report;
    state.checkCompleted = true;
    state.dependencyIssues = hasDependencyIssues(report);
    state.portIssues = false;
    state.portResolved = true;
    state.portDecisions = {};

    if (state.dependencyIssues) {
      state.cloneCompleted = false;
      state.repoValidated = false;
      state.dbBootstrapCompleted = false;
      state.dbBootstrapFailed = false;
      state.configImported = false;
      state.serverStarted = false;
      state.serverStartFailed = false;
      state.loginShown = false;
    } else {
      state.installCompleted = false;
    }

    renderPortResolution(report);
  }

  function validateAltPort(portText) {
    const num = Number(portText);
    return Number.isInteger(num) && num >= 1 && num <= 65535;
  }

  async function applyPortDecisions() {
    if (!state.lastReport) {
      appendOutput('ERROR: No requirement report available yet.');
      return;
    }

    const busyPorts = getBusyPorts(state.lastReport);
    if (!busyPorts.length) {
      appendOutput('No active port conflicts were detected.');
      state.portResolved = true;
      refreshWorkflow();
      return;
    }

    appendOutput('>>> Applying port decisions');

    for (const p of busyPorts) {
      const portKey = String(p.port);
      const decision = state.portDecisions[portKey];
      const alt = state.portDecisions[portKey + '_alt'];

      if (!decision) {
        appendOutput(`ERROR: No decision selected for port ${p.port}.`);
        state.portResolved = false;
        refreshWorkflow();
        return;
      }

      if (decision === 'reuse') {
        appendOutput(`Port ${p.port}: existing service will be reused (${p.process_name || 'unknown'} / PID ${p.process_id ?? 'unknown'}).`);
      } else if (decision === 'later') {
        appendOutput(`Port ${p.port}: configuration postponed for later manual setup.`);
      } else if (decision === 'change') {
        if (!validateAltPort(alt)) {
          appendOutput(`ERROR: Invalid alternative port for ${p.port}. Enter a valid port number between 1 and 65535.`);
          state.portResolved = false;
          refreshWorkflow();
          return;
        }
        appendOutput(`Port ${p.port}: will be reassigned to alternative port ${alt}.`);
      } else if (decision === 'stop') {
        const pid = p.process_id;
        if (!pid) {
          appendOutput(`ERROR: Port ${p.port} has no PID to stop.`);
          state.portResolved = false;
          refreshWorkflow();
          return;
        }

        try {
          const result = await window.accredicore.runAction({
            action: 'stop-process',
            pid: String(pid),
            workingDirectory: byId('working-directory')?.value || ''
          });
          appendOutput(result && result.output ? result.output : `Stop process requested for PID ${pid}.`);
        } catch (error) {
          appendOutput(`ERROR stopping PID ${pid}: ` + (error && error.message ? error.message : String(error)));
          state.portResolved = false;
          refreshWorkflow();
          return;
        }
      }
    }

    state.portResolved = true;
    appendOutput('Port decision step completed. Continue to Step 4.');
    refreshWorkflow();
  }

  async function runStandardAction(action) {
    if (!(window.accredicore && typeof window.accredicore.runAction === 'function')) {
      appendOutput('Desktop runtime is not available in browser-only mode.');
      appendOutput('For Windows, extract the installer ZIP and run Start-Installer-for-windows.bat from the root installer folder.');
      appendOutput('The BAT launcher will check Node.js/npm and ask for approval before downloading launcher dependencies.');
      appendOutput('If Node.js is missing, the launcher can open the official Node.js LTS download page.');
      return;
    }

    appendOutput(`>>> Running action: ${action}`);

    try {
      const payload = {
        action,
        workingDirectory: byId('working-directory')?.value || '',
        sourceZip: byId('source-zip')?.value || '',
        remoteUrl: byId('remote-url')?.value || '',
        targetDir: getSelectedBasePath(),
        frontendPort: state.portPlan && state.portPlan.frontend ? state.portPlan.frontend : 4173,
        localApiPort: state.portPlan && state.portPlan.localApi ? state.portPlan.localApi : 3005
      };

      const result = await window.accredicore.runAction(payload);
      const rawOutput = result && result.output ? result.output : JSON.stringify(result, null, 2);
      appendOutput(rawOutput);

      if (action === 'check') {
        const report = extractJsonBlock(rawOutput);
        if (report) {
          updateStateFromReport(report);
          const narrative = buildDevOpsNarrative(report);
          if (narrative) appendOutput(narrative);
        }
      }

      if (action === 'install' && result && result.code === 0) {
        state.installCompleted = true;
        appendOutput('Installation step completed. Click "Re-run Step 1 Check" to confirm PostgreSQL Client (psql), npm/pnpm, Docker, and other requirements are ready.');
      }

      refreshWorkflow();
    } catch (error) {
      appendOutput('ERROR: ' + (error && error.message ? error.message : String(error)));
      refreshWorkflow();
    }
  }

  async function cloneRepo() {
    const repoUrl = (byId('remote-url')?.value || '').trim();
    let targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();

    if (state.platform === 'windows' && !/^[A-Za-z]:\\/.test(targetDir)) {
      targetDir = getSelectedBasePath();
      const preview = byId('target-path-preview');
      if (preview) preview.value = targetDir;
    }

    if (!repoUrl) {
      appendOutput('ERROR: Git remote URL is required.');
      return;
    }

    if (!targetDir) {
      appendOutput('ERROR: Target path is empty.');
      return;
    }

    appendOutput('>>> Step 4: Clone repository from GitHub');
    const result = await window.accredicore.runAction({ action: 'clone-repo', repoUrl, targetDir });
    appendOutput(result.output || JSON.stringify(result, null, 2));

    if (result.code === 0) {
      const resolvedMatch = String(result.output || '').match(/-?\s*Resolved path:\s*(.+)/i);
      if (resolvedMatch && resolvedMatch[1]) {
        const resolvedPath = resolvedMatch[1].trim();
        const preview = byId('target-path-preview');
        if (preview) preview.value = resolvedPath;
      }
      state.cloneCompleted = true;
      state.repoValidated = false;
      state.dbBootstrapCompleted = false;
      state.dbBootstrapFailed = false;
      state.configImported = false;
      state.serverStarted = false;
      state.serverStartFailed = false;
      state.loginShown = false;
      appendOutput('Next: validate the cloned source code, then continue to Step 5 Database Set-up below this output box.');
    }

    refreshWorkflow();
  }

  async function validateRepo() {
    const targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();
    if (!targetDir) {
      appendOutput('ERROR: Target path is empty.');
      return;
    }

    appendOutput('>>> Step 4: Validate repository content');
    const result = await window.accredicore.runAction({ action: 'validate-repo', targetDir });
    appendOutput(result.output || JSON.stringify(result, null, 2));

    if (result.code === 0) {
      state.repoValidated = true;
      state.dbBootstrapCompleted = false;
      state.dbBootstrapFailed = false;
      state.configImported = false;
      state.serverStarted = false;
      state.serverStartFailed = false;
      state.loginShown = false;
      appendOutput('Repository validation completed. The project is ready for database bootstrap.');
    }

    refreshWorkflow();
  }

  async function bootstrapDatabase() {
    const targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();
    const dbHost = String(byId('db-host')?.value || '').trim();
    const dbPort = String(byId('db-port')?.value || '').trim();
    const dbName = String(byId('db-name')?.value || '').trim();
    const dbUser = String(byId('db-user')?.value || '').trim();
    const dbPassword = String(byId('db-password')?.value || '');

    if (!targetDir) {
      appendOutput('ERROR: Target path is empty.');
      return;
    }

    if (!hasPostgresClient(state.lastReport)) {
      appendOutput('ERROR: PostgreSQL client/server is not ready. Run Step 2 "Install dependencies", then run Step 1 check again before Step 5.');
      return;
    }

    const validationError = validateDbInputs();
    if (validationError) {
      appendOutput('ERROR: ' + validationError);
      return;
    }

    state.dbBootstrapCompleted = false;
    state.dbBootstrapFailed = false;
    state.configImported = false;
    state.serverStarted = false;
    state.serverStartFailed = false;
    state.loginShown = false;

    appendOutput('>>> Step 5A/5B: Create database, import AccrediCore structure, and test connection');
    const result = await window.accredicore.runAction({
      action: 'bootstrap-database',
      targetDir,
      dbHost,
      dbPort,
      dbName,
      dbUser,
      dbPassword
    });
    appendOutput(result.output || JSON.stringify(result, null, 2));

    if (result.code === 0) {
      state.dbBootstrapCompleted = true;
      state.dbBootstrapFailed = false;
      appendOutput('Step 5A/5B completed successfully: database import and smoke test passed. Step 6 is now unlocked.');
    } else {
      state.dbBootstrapCompleted = false;
      state.dbBootstrapFailed = true;
      appendOutput('Step 5A/5B did not complete. Step 6 remains locked.');
      appendOutput('Instruction: run Step 2 Install Dependencies if PostgreSQL Client (psql) is missing, restart the installer if needed, run Step 1 Check Requirements again, then retry Step 5A/5B.');
    }

    refreshWorkflow();
  }

  async function browseForConfig(kind) {
    if (!(window.accredicore && typeof window.accredicore.selectFile === 'function')) {
      appendOutput('Desktop runtime is not available. File import requires the installer desktop app.');
      return;
    }

    const selected = await window.accredicore.selectFile();
    if (!selected) return;

    if (kind === 'env') {
      state.envPath = selected;
      byId('env-file-path').value = selected;
    }

    if (kind === 'activation') {
      state.activationPath = selected;
      byId('activation-file-path').value = selected;
    }

    refreshWorkflow();
  }

  async function importConfig() {
    const targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();
    if (!targetDir || !state.envPath || !state.activationPath) {
      appendOutput('ERROR: Select both .env and activation.json before importing configuration.');
      return;
    }

    appendOutput('>>> Step 6: Import activation configuration');
    const result = await window.accredicore.runAction({
      action: 'import-config',
      targetDir,
      envPath: state.envPath,
      activationPath: state.activationPath
    });
    appendOutput(result.output || JSON.stringify(result, null, 2));

    if (result.code === 0) {
      state.configImported = true;
      state.serverStarted = false;
      state.serverStartFailed = false;
      state.loginShown = false;
      appendOutput('Configuration import completed successfully. Step 7 is now unlocked: run backend and frontend.');
    }

    refreshWorkflow();
  }

  async function startServers() {
    const targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();
    if (!targetDir || !state.configImported) {
      appendOutput('ERROR: Import .env and activation.json successfully before starting servers.');
      return;
    }

    state.serverStarted = false;
    state.serverStartFailed = false;
    state.loginShown = false;

    appendOutput('>>> Step 7: Start backend and frontend');
    const serverStartingNote = byId('server-starting-note');
    if (serverStartingNote) serverStartingNote.style.display = '';
    appendOutput('SERVER IS STARTING... This can take 2-3 minutes. If CMD/PowerShell windows open, keep them open and return to this installer page for Step 8.');
    const result = await window.accredicore.runAction({
      action: 'start-servers',
      targetDir,
      dbHost: String(byId('db-host')?.value || '').trim(),
      dbPort: String(byId('db-port')?.value || '').trim(),
      dbName: String(byId('db-name')?.value || '').trim(),
      dbUser: String(byId('db-user')?.value || '').trim(),
      dbPassword: String(byId('db-password')?.value || ''),
      frontendPort: state.portPlan && state.portPlan.frontend ? state.portPlan.frontend : 4173,
      localApiPort: state.portPlan && state.portPlan.localApi ? state.portPlan.localApi : 3005
    });
    appendOutput(result.output || JSON.stringify(result, null, 2));

    if (result.code === 0) {
      state.serverStarted = true;
      state.serverStartFailed = false;
      appendOutput('Step 7 completed. The login page is reachable. Step 8 is now unlocked: show login URL and root account.');
    } else {
      state.serverStarted = false;
      state.serverStartFailed = true;
      appendOutput('Step 7 did not complete. Step 8 remains locked.');
      appendOutput('Instruction: the installer tried to open Docker Desktop automatically. Complete Docker login/register if requested, wait until Docker engine is running, then run Step 7 again.');
      if (serverStartingNote) serverStartingNote.style.display = 'none';
    }

    refreshWorkflow();
  }

  async function openDockerDesktop() {
    if (!(window.accredicore && typeof window.accredicore.runAction === 'function')) {
      appendOutput('ERROR: Docker Desktop can only be opened from the native installer, not from a normal browser tab.');
      return;
    }

    appendOutput('>>> Opening Docker Desktop / Login');
    appendOutput('If Docker asks for login/register/terms, complete it in the Docker Desktop window, keep Docker running, then return to this installer.');

    try {
      const result = await window.accredicore.runAction({
        action: 'open-docker-desktop'
      });
      appendOutput(result.output || '');
      if (result.code === 0) {
        appendOutput('Docker Desktop is ready. Next: click Step 7. Start servers again.');
      } else {
        appendOutput('Docker Desktop is not ready yet. Complete Docker login/register if requested, wait until it is running, then click this button or Step 7 again.');
      }
    } catch (error) {
      appendOutput('ERROR opening Docker Desktop: ' + (error && error.message ? error.message : String(error)));
    }

    refreshWorkflow();
  }

  async function openLoginUrl() {
    const frontendPort = state.portPlan && state.portPlan.frontend ? state.portPlan.frontend : 4173;
    const url = `http://127.0.0.1:${frontendPort}/auth`;
    if (window.accredicore && typeof window.accredicore.openExternal === 'function') {
      await window.accredicore.openExternal(url);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function showLoginDetails() {
    if (!state.serverStarted) {
      appendOutput('ERROR: Start backend and frontend before showing login access.');
      return;
    }

    const details = byId('login-details');
    const openBtn = byId('open-login-url-btn');
    const loginUrlValue = byId('login-url-value');
    const frontendPort = state.portPlan && state.portPlan.frontend ? state.portPlan.frontend : 4173;
    const loginUrl = `http://127.0.0.1:${frontendPort}/auth`;
    if (details) details.style.display = '';
    if (openBtn) openBtn.style.display = '';
    if (loginUrlValue) loginUrlValue.textContent = loginUrl;
    const loginStatus = byId('login-step-status');
    if (loginStatus) loginStatus.style.display = 'none';
    state.loginShown = true;
    appendOutput('STEP 8 RESULT');
    appendOutput(`- Click here to open login page: ${loginUrl}`);
    appendOutput('- Your username: local-admin@accredicore.local');
    appendOutput('- Your password: LocalAdmin123!');
    appendOutput('- Please copy/paste this credential to login into your superadmin (root) account and start creating other accounts.');
    appendOutput('- If the browser says connection refused, wait 2-3 minutes and reload after the frontend terminal shows the local URL.');
    appendOutput('- Additional manual test users: quality-manager@accredicore.local, dept-manager@accredicore.local, team-leader@accredicore.local, staff-user@accredicore.local');
    refreshWorkflow();
  }

  async function openActivationWebsite() {
    const url = 'https://accredicore.danandad.com/#activation';
    if (window.accredicore && typeof window.accredicore.openExternal === 'function') {
      await window.accredicore.openExternal(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function copyActivationUrl() {
    const url = 'https://accredicore.danandad.com/#activation';
    if (window.accredicore && typeof window.accredicore.copyText === 'function') {
      await window.accredicore.copyText(url);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
    }
    appendOutput(`Activation portal URL copied: ${url}`);
  }

  function showOfflineActivationModal() {
    const modal = byId('offline-activation-modal');
    if (!modal) return;
    modal.hidden = false;
  }

  function hideOfflineActivationModal() {
    const modal = byId('offline-activation-modal');
    if (!modal) return;
    modal.hidden = true;
  }

  function randomChunk(length) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = new Uint8Array(length);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < length; i += 1) bytes[i] = Math.floor(Math.random() * 255);
    }
    return Array.from(bytes).map((value) => alphabet[value % alphabet.length]).join('');
  }

  function buildInstallationCode(prefix) {
    return `ACH-${prefix}-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;
  }

  function buildOfflineActivationRequest() {
    const targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();
    const dbName = String(byId('db-name')?.value || '').trim();
    const code = buildInstallationCode('OFF');

    return {
      product: 'Arab Compliance Hub',
      request_type: 'offline_activation',
      installation_code: code,
      generated_at: new Date().toISOString(),
      target_directory: targetDir,
      database_name: dbName,
      platform: state.platform,
      instructions: 'Open https://accredicore.danandad.com/#activation from another device, enter this installation_code, then download the unique .env and activation.json after vendor approval.'
    };
  }

  async function requestOnlineActivation() {
    if (!(window.accredicore && typeof window.accredicore.requestOnlineActivation === 'function')) {
      appendOutput('ERROR: Online activation requires the native installer runtime.');
      return null;
    }

    const preference = state.downloadPreference;
    const email = String(preference && preference.email ? preference.email : '').trim().toLowerCase();
    if (!email) {
      appendOutput('ERROR: Registration email was not found in accredicore-installer-preference.json. Use offline activation and enter the same email used during registration on the vendor website.');
      return null;
    }

    const payload = {
      registration_email: email,
      institution_name: String((preference && preference.institution_name) || ''),
      installation_code: buildInstallationCode('ON'),
      deployment_mode: 'online',
      platform: state.platform,
      target_directory: String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim(),
      database_name: String(byId('db-name')?.value || '').trim()
    };

    appendOutput('Step 6 online selected. Sending activation request to https://accredicore.danandad.com/.');
    appendOutput(`Registration email: ${payload.registration_email}`);
    appendOutput(`Installation code: ${payload.installation_code}`);

    try {
      const result = await window.accredicore.requestOnlineActivation(payload);
      if (result.saved_files) {
        state.envPath = result.saved_files.env_path;
        state.activationPath = result.saved_files.activation_json_path;
        byId('env-file-path').value = state.envPath;
        byId('activation-file-path').value = state.activationPath;
      }
      appendOutput(`Online activation files generated and saved locally.`);
      appendOutput(`.env: ${state.envPath}`);
      appendOutput(`activation.json: ${state.activationPath}`);
      appendOutput('Next: click "Step 6. Import .env and activation.json".');
      refreshWorkflow();
      return result;
    } catch (error) {
      appendOutput('ERROR: Online activation failed. ' + (error && error.message ? error.message : String(error)));
      appendOutput('If this device cannot reach the portal, choose "No, this device is offline" and submit the code from another device.');
      return null;
    }
  }

  async function showActivationGuidance(mode) {
    const wrap = byId('activation-guidance');
    const title = byId('activation-guidance-title');
    const text = byId('activation-guidance-text');
    const downloadBtn = byId('download-activation-request-btn');
    const openBtn = byId('open-activation-site-btn');
    const copyBtn = byId('copy-activation-url-btn');
    if (!wrap || !title || !text) return;

    wrap.style.display = '';
    if (openBtn) openBtn.style.display = '';
    if (copyBtn) copyBtn.style.display = 'none';
    if (mode === 'online') {
      state.activationRequest = null;
      title.textContent = 'Online activation';
      text.textContent = 'The installer will send the registration email and installation code to https://accredicore.danandad.com/. If the email is registered, the portal returns a unique signed .env and activation.json for this installation and saves them locally.';
      if (openBtn) openBtn.style.display = 'none';
      if (copyBtn) copyBtn.style.display = 'none';
      if (downloadBtn) downloadBtn.style.display = 'none';
      await requestOnlineActivation();
      return;
    }

    state.activationRequest = buildOfflineActivationRequest();
    title.textContent = 'Offline activation code';
    text.textContent = `Installation code: ${state.activationRequest.installation_code}. Open https://accredicore.danandad.com/#activation from another device. Use the same email used during registration; the portal validates that email before showing the download buttons for .env and activation.json. After both files are downloaded, return to this installer, browse both files, then import them.`;
    if (openBtn) openBtn.style.display = '';
    if (copyBtn) copyBtn.style.display = '';
    if (downloadBtn) downloadBtn.style.display = '';
    appendOutput('Step 6 offline selected.');
    appendOutput(`Offline installation code: ${state.activationRequest.installation_code}`);
    appendOutput('Open https://accredicore.danandad.com/#activation from another device.');
    appendOutput('This offline device will not open the website automatically. Use "Copy portal URL" and send/open it on another internet-connected device.');
    appendOutput('Use the same email used during registration. If the email is found, the portal will show download buttons for .env and activation.json.');
    showOfflineActivationModal();
  }

  function downloadActivationRequest() {
    if (!state.activationRequest) {
      state.activationRequest = buildOfflineActivationRequest();
    }

    const blob = new Blob([JSON.stringify(state.activationRequest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'activation-request.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    appendOutput('activation-request.json download prepared. Use it on the vendor portal if code entry is inconvenient.');
  }

  function refreshWorkflow() {
    const checksPassed = state.checkCompleted && !state.dependencyIssues && (!state.portIssues || state.portResolved);
    const showInstall = state.checkCompleted && state.dependencyIssues;

    setButtonEnabled('check', true);
    setButtonVisible('install', showInstall);
    setButtonEnabled('install', showInstall);

    const rerunCheckBtn = byId('rerun-check-btn');
    if (rerunCheckBtn) {
      const showRerun = state.checkCompleted && state.installCompleted;
      rerunCheckBtn.style.display = showRerun ? '' : 'none';
      rerunCheckBtn.disabled = !showRerun;
    }

    const installBtn = getActionButton('install');
    if (installBtn) {
      installBtn.classList.toggle('primary', showInstall);
      installBtn.classList.toggle('secondary', !showInstall);
    }

    const applyBtn = byId('apply-port-decisions');
    if (applyBtn) applyBtn.disabled = !(state.checkCompleted && state.portIssues && !state.portResolved && allPortDecisionsComplete());

    const portWrap = byId('port-resolution-wrap');
    if (portWrap && (!state.checkCompleted || !getBusyPorts(state.lastReport).length)) portWrap.style.display = 'none';

    const githubWrap = byId('github-step-wrap');
    if (githubWrap) githubWrap.style.display = checksPassed ? '' : 'none';

    const dbWrap = byId('database-step-wrap');
    const configWrap = byId('config-step-wrap');
    const serverWrap = byId('server-step-wrap');
    const loginWrap = byId('login-step-wrap');
    if (dbWrap) dbWrap.style.display = state.repoValidated ? '' : 'none';
    if (configWrap) configWrap.style.display = state.dbBootstrapCompleted ? '' : 'none';
    if (serverWrap) serverWrap.style.display = state.configImported ? '' : 'none';
    if (loginWrap) loginWrap.style.display = state.serverStarted ? '' : 'none';

    const cloneBtn = byId('clone-repo-btn');
    const validateBtn = byId('validate-repo-btn');
    const dbBtn = byId('bootstrap-database-btn');
    const importBtn = byId('import-config-btn');
    const startServersBtn = byId('start-servers-btn');
    const showLoginBtn = byId('show-login-btn');

    const targetDir = getSelectedBasePath();
    const locationReady = !!targetDir;
    if (cloneBtn) cloneBtn.disabled = !checksPassed || !locationReady;
    if (validateBtn) validateBtn.disabled = !checksPassed || !state.cloneCompleted;
    const dbInputsValid = !validateDbInputs();
    const postgresReady = hasPostgresClient(state.lastReport);
    if (dbBtn) {
      dbBtn.style.display = postgresReady ? '' : 'none';
      dbBtn.disabled = !(state.repoValidated && postgresReady && dbInputsValid);
    }
    if (importBtn) importBtn.disabled = !(state.dbBootstrapCompleted && state.envPath && state.activationPath);
    if (startServersBtn) startServersBtn.disabled = !state.configImported;
    if (showLoginBtn) showLoginBtn.disabled = !state.serverStarted;

    refreshNextStepPanel();

    const dbStatus = byId('database-step-status');
    const configStatus = byId('config-step-status');
    const serverStatus = byId('server-step-status');
    const loginStatus = byId('login-step-status');

    if (!state.checkCompleted) {
      setWorkflowStatus('Step 1 is active. Run "Check requirements" first.');
      setGithubStepStatus('Step 4 is locked until requirement checks are complete.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (state.portIssues && !state.portResolved) {
      setWorkflowStatus('Port conflict detected. Choose an action for each conflicting port, then click "Apply port decisions".');
      setGithubStepStatus('Step 4 is locked until the port decision step is complete.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (state.dependencyIssues) {
      setWorkflowStatus('Missing dependencies detected. Click "Step 2. Install dependencies" now. After it finishes, click "Re-run Step 1 Check".');
      setGithubStepStatus('Step 4 is locked until all required dependencies pass.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (!state.cloneCompleted) {
      setWorkflowStatus('Checks passed. Step 4 is active: start clone source code.');
      setGithubStepStatus('Choose the project location, then click "Step 4. Start clone source code". The installer will create the target folder automatically.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (!state.repoValidated) {
      setWorkflowStatus('Repository clone completed. Validate the repository content next.');
      setGithubStepStatus('Step 4 is active: validate repository content.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (!state.dbBootstrapCompleted) {
      setWorkflowStatus(postgresReady
        ? 'Repository validation completed. Step 5A/5B is active: create the database, import the AccrediCore structure, then test the connection.'
        : 'Repository validation completed, but PostgreSQL client/server is missing. Run Step 2 Install Dependencies and rerun Step 1 check before Step 5.');
      setGithubStepStatus('Step 4 completed successfully.');
      if (dbStatus) dbStatus.textContent = postgresReady
        ? (dbInputsValid ? 'Provide database connection values, then click "Create database and import structure".' : validateDbInputs())
        : 'PostgreSQL client/server is missing. Run Step 2 Install Dependencies, restart the installer if needed, then run Step 1 check again.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (!state.configImported) {
      setWorkflowStatus('Database bootstrap completed. Step 6 is active: request and import .env plus activation.json.');
      setGithubStepStatus('Step 4 completed successfully.');
      if (dbStatus) dbStatus.textContent = 'Database structure imported successfully.';
      if (configStatus) {
        configStatus.textContent = state.envPath && state.activationPath
          ? 'Ready to import configuration files.'
          : 'Open the activation website, then choose the .env file and activation.json file.';
      }
      if (serverStatus) serverStatus.textContent = 'Step 7 is locked until configuration import succeeds.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (!state.serverStarted) {
      setWorkflowStatus(state.serverStartFailed
        ? 'Server startup failed. The installer tried to open Docker Desktop automatically. Complete Docker login/register if requested, wait until Docker is running, then run Step 7 again.'
        : 'Configuration files imported successfully. Step 7 is active: start backend and frontend.');
      setGithubStepStatus('Step 4 completed successfully.');
      if (dbStatus) dbStatus.textContent = 'Database structure imported successfully.';
      if (configStatus) configStatus.textContent = 'Configuration files imported successfully.';
      if (serverStatus) serverStatus.textContent = state.serverStartFailed
        ? 'Docker Desktop engine is not running. Complete Docker login/register if requested, wait until Docker is ready, then click Step 7 again.'
        : 'Ready to start backend and frontend services.';
      if (loginStatus) loginStatus.textContent = 'Step 8 is locked until the servers are launched.';
      return;
    }

    if (!state.loginShown) {
      setWorkflowStatus('Servers were launched. Step 8 is active: show login URL and root account.');
      setGithubStepStatus('Step 4 completed successfully.');
      if (dbStatus) dbStatus.textContent = 'Database structure imported successfully.';
      if (configStatus) configStatus.textContent = 'Configuration files imported successfully.';
      if (serverStatus) serverStatus.textContent = 'Backend and frontend startup commands were launched.';
      if (loginStatus) loginStatus.textContent = 'Ready to show login URL and root account.';
      return;
    }

    setWorkflowStatus('All workflow steps completed successfully. The local app is ready for browser login testing.');
    setGithubStepStatus('Step 4 completed successfully.');
    if (dbStatus) dbStatus.textContent = 'Database structure imported successfully.';
    if (configStatus) configStatus.textContent = 'Configuration files imported successfully.';
    if (serverStatus) serverStatus.textContent = 'Backend and frontend startup commands were launched.';
    if (loginStatus) loginStatus.style.display = 'none';
  }

  function refreshNextStepPanel() {
    const panel = byId('next-step-panel');
    if (!panel) return;

    const title = byId('next-step-title');
    const text = byId('next-step-text');
    const install = byId('next-install-dependencies-btn');
    const rerun = byId('next-rerun-check-btn');
    const validate = byId('next-validate-repo-btn');
    const db = byId('next-bootstrap-database-btn');
    const config = byId('next-import-config-btn');
    const docker = byId('next-open-docker-btn');
    const servers = byId('next-start-servers-btn');
    const login = byId('next-show-login-btn');

    [install, rerun, validate, db, config, docker, servers, login].forEach((btn) => {
      if (btn) btn.style.display = 'none';
    });

    if (state.dependencyIssues && !state.installCompleted) {
      panel.style.display = '';
      if (title) title.textContent = translate('nextInstallTitle');
      if (text) text.textContent = translate('nextInstallText');
      if (install) install.style.display = '';
      return;
    }

    if (state.installCompleted) {
      panel.style.display = '';
      if (title) title.textContent = translate('nextRerunCheckTitle');
      if (text) text.textContent = state.installCompleted
        ? translate('nextRerunAfterInstall')
        : translate('nextRerunAfterWarning');
      if (rerun) rerun.style.display = '';
      return;
    }

    if (state.cloneCompleted && !state.repoValidated) {
      panel.style.display = '';
      if (title) title.textContent = 'Step 4 — Validate Source Code';
      if (text) text.textContent = 'Clone completed successfully. Validate the repository content before database setup.';
      if (validate) validate.style.display = '';
      return;
    }

    if (state.repoValidated && !state.dbBootstrapCompleted) {
      panel.style.display = '';
      if (title) title.textContent = state.dbBootstrapFailed
        ? translate('nextFixDatabaseTitle')
        : 'Step 5A/5B — Database Set-up';
      if (hasPostgresClient(state.lastReport)) {
        if (text) text.textContent = state.dbBootstrapFailed
          ? translate('nextFixDatabaseText')
          : 'Create/reset the database safely, import the table structure from the cloned AccrediCore repository, then run the connection smoke test. Step 6 appears only after this succeeds.';
        if (db) db.style.display = '';
      } else {
        if (text) text.textContent = state.dbBootstrapFailed
          ? translate('nextFixDatabaseText')
          : 'PostgreSQL client/server is missing. Run Step 2 Install Dependencies and rerun Step 1 Check Requirements before database setup.';
      }
      return;
    }

    if (state.dbBootstrapCompleted && !state.configImported) {
      panel.style.display = '';
      if (title) title.textContent = 'Step 6 — Import Configuration';
      if (text) text.textContent = 'Database setup is complete. Import the unique .env and activation.json files to finish configuration.';
      if (config) config.style.display = '';
      return;
    }

    if (state.configImported && !state.serverStarted) {
      panel.style.display = '';
      if (title) title.textContent = state.serverStartFailed
        ? translate('nextFixServersTitle')
        : 'Step 7 — Start Backend and Frontend';
      if (text) text.textContent = state.serverStartFailed
        ? translate('nextFixServersText')
        : 'Configuration import succeeded. Start local backend services and the frontend development server.';
      if (docker && state.serverStartFailed) docker.style.display = '';
      if (servers) servers.style.display = '';
      return;
    }

    if (state.serverStarted && !state.loginShown) {
      panel.style.display = '';
      if (title) title.textContent = 'Step 8 — Login Access';
      if (text) text.textContent = 'Servers were launched. Show the local login URL and root account for smoke testing.';
      if (login) login.style.display = '';
      return;
    }

    panel.style.display = 'none';
  }

  async function browseCustomFolder() {
    if (!(window.accredicore && typeof window.accredicore.selectFolder === 'function')) return;
    const selected = await window.accredicore.selectFolder();
    if (selected) {
      byId('custom-base-path').value = selected;
      refreshTargetPreview();
    }
  }

  async function init() {
    const platform = await detectPlatform();
    await loadHomeInfo();

    const languageSelect = byId('language-select');
    if (languageSelect) {
      languageSelect.addEventListener('change', () => applyLanguage(languageSelect.value));
    }
    applyLanguage('en');

    setText('platform-name', platform);
    setText('runtime-name', state.runtime);

    if (state.runtime === 'browser') {
      appendOutput('Browser-only mode detected.');
      appendOutput('Step 1 cannot run native requirement checks from a normal browser tab.');
      appendOutput('Windows users: close this browser-only launcher, then run Start-Installer-for-windows.bat from the extracted installer root folder.');
      appendOutput('The BAT launcher will show a warning first. It will ask permission before opening the Node.js download page or running npm install.');
      appendOutput('Technical fallback: install Node.js LTS, run npm install, then run npm run app from the installer folder.');
      appendOutput('');
      renderBrowserModeBlocker();
      return;
    }

    const buttons = document.querySelectorAll('[data-action]');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => runStandardAction(btn.dataset.action));
    });

    const rerunCheckBtn = byId('rerun-check-btn');
    if (rerunCheckBtn) rerunCheckBtn.addEventListener('click', () => runStandardAction('check'));

    const applyBtn = byId('apply-port-decisions');
    if (applyBtn) applyBtn.addEventListener('click', applyPortDecisions);

    const nextInstallBtn = byId('next-install-dependencies-btn');
    if (nextInstallBtn) nextInstallBtn.addEventListener('click', () => runStandardAction('install'));

    const nextRerunCheckBtn = byId('next-rerun-check-btn');
    if (nextRerunCheckBtn) nextRerunCheckBtn.addEventListener('click', () => runStandardAction('check'));

    const locationSelect = byId('project-location');
    const folderName = byId('project-folder-name');
    const customBase = byId('custom-base-path');
    const browseBtn = byId('browse-custom-folder');

    if (locationSelect) locationSelect.addEventListener('change', refreshTargetPreview);
    if (folderName) folderName.addEventListener('input', refreshTargetPreview);
    if (customBase) customBase.addEventListener('input', refreshTargetPreview);
    if (browseBtn) browseBtn.addEventListener('click', browseCustomFolder);

    const cloneBtn = byId('clone-repo-btn');
    const validateBtn = byId('validate-repo-btn');
    const dbBtn = byId('bootstrap-database-btn');
    const browseEnvBtn = byId('browse-env-btn');
    const browseActivationBtn = byId('browse-activation-btn');
    const importConfigBtn = byId('import-config-btn');
    const openActivationSiteBtn = byId('open-activation-site-btn');
    const copyActivationUrlBtn = byId('copy-activation-url-btn');
    const modalCopyActivationUrlBtn = byId('modal-copy-activation-url-btn');
    const modalDownloadActivationRequestBtn = byId('modal-download-activation-request-btn');
    const closeOfflineActivationModalBtn = byId('close-offline-activation-modal-btn');
    const modalCloseSecondaryBtn = byId('modal-close-secondary-btn');
    const offlineActivationModal = byId('offline-activation-modal');
    const activationOnlineBtn = byId('activation-online-btn');
    const activationOfflineBtn = byId('activation-offline-btn');
    const downloadActivationRequestBtn = byId('download-activation-request-btn');
    const startServersBtn = byId('start-servers-btn');
    const showLoginBtn = byId('show-login-btn');
    const openLoginUrlBtn = byId('open-login-url-btn');
    const nextValidateRepoBtn = byId('next-validate-repo-btn');
    const nextBootstrapDatabaseBtn = byId('next-bootstrap-database-btn');
    const nextImportConfigBtn = byId('next-import-config-btn');
    const nextOpenDockerBtn = byId('next-open-docker-btn');
    const nextStartServersBtn = byId('next-start-servers-btn');
    const nextShowLoginBtn = byId('next-show-login-btn');

    if (cloneBtn) cloneBtn.addEventListener('click', cloneRepo);
    if (validateBtn) validateBtn.addEventListener('click', validateRepo);
    if (dbBtn) dbBtn.addEventListener('click', bootstrapDatabase);
    if (browseEnvBtn) browseEnvBtn.addEventListener('click', () => browseForConfig('env'));
    if (browseActivationBtn) browseActivationBtn.addEventListener('click', () => browseForConfig('activation'));
    if (importConfigBtn) importConfigBtn.addEventListener('click', importConfig);
    if (openActivationSiteBtn) openActivationSiteBtn.addEventListener('click', openActivationWebsite);
    if (copyActivationUrlBtn) copyActivationUrlBtn.addEventListener('click', copyActivationUrl);
    if (modalCopyActivationUrlBtn) modalCopyActivationUrlBtn.addEventListener('click', copyActivationUrl);
    if (modalDownloadActivationRequestBtn) modalDownloadActivationRequestBtn.addEventListener('click', downloadActivationRequest);
    if (closeOfflineActivationModalBtn) closeOfflineActivationModalBtn.addEventListener('click', hideOfflineActivationModal);
    if (modalCloseSecondaryBtn) modalCloseSecondaryBtn.addEventListener('click', hideOfflineActivationModal);
    if (offlineActivationModal) {
      offlineActivationModal.addEventListener('click', (event) => {
        if (event.target === offlineActivationModal) hideOfflineActivationModal();
      });
    }
    if (activationOnlineBtn) activationOnlineBtn.addEventListener('click', () => showActivationGuidance('online'));
    if (activationOfflineBtn) activationOfflineBtn.addEventListener('click', () => showActivationGuidance('offline'));
    if (downloadActivationRequestBtn) downloadActivationRequestBtn.addEventListener('click', downloadActivationRequest);
    if (startServersBtn) startServersBtn.addEventListener('click', startServers);
    if (showLoginBtn) showLoginBtn.addEventListener('click', showLoginDetails);
    if (openLoginUrlBtn) openLoginUrlBtn.addEventListener('click', openLoginUrl);
    if (nextValidateRepoBtn) nextValidateRepoBtn.addEventListener('click', validateRepo);
    if (nextBootstrapDatabaseBtn) nextBootstrapDatabaseBtn.addEventListener('click', bootstrapDatabase);
    if (nextImportConfigBtn) nextImportConfigBtn.addEventListener('click', () => {
      const wrap = byId('config-step-wrap');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (nextOpenDockerBtn) nextOpenDockerBtn.addEventListener('click', openDockerDesktop);
    if (nextStartServersBtn) nextStartServersBtn.addEventListener('click', () => {
      const wrap = byId('server-step-wrap');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (nextShowLoginBtn) nextShowLoginBtn.addEventListener('click', () => {
      const wrap = byId('login-step-wrap');
      if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    ['db-host', 'db-port', 'db-name', 'db-user', 'db-password'].forEach((id) => {
      const input = byId(id);
      if (input) input.addEventListener('input', refreshWorkflow);
    });

    if (locationSelect && !locationSelect.value) locationSelect.value = 'documents';
    await applyDownloadPreference();
    refreshTargetPreview();
    setButtonVisible('install', false);
    refreshWorkflow();
  }

  window.AccrediCoreGui = { init };
  document.addEventListener('DOMContentLoaded', init);
})();

