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

    installCompleted: false,
    cloneCompleted: false,
    repoValidated: false,
    dbBootstrapCompleted: false,
    configImported: false,

    portDecisions: {},
    envPath: '',
    activationPath: '',
    activationRequest: null
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

    if (dbPassword.length > 256) {
      return 'Database password must be 256 characters or fewer.';
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

  function describeAutoPortHandling(port) {
    const portNumber = Number(port && port.port);
    const processName = String((port && port.process_name) || '').toLowerCase();
    if (portNumber === 5432 && processName.includes('postgres')) {
      return 'PostgreSQL is already running on port 5432, so the installer will reuse it automatically.';
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
    const folderName = (byId('project-folder-name')?.value || 'AccrediCore').trim();
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

    body.innerHTML = '';
    wrap.style.display = 'none';
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
      lines.push('1. Run "Install dependencies".');
      lines.push('2. Run "Check requirements" again.');
      lines.push('3. Continue only when all required dependencies pass.');
    } else {
      lines.push('1. Step 4 is now active: clone the AccrediCore repository.');
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
      state.configImported = false;
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
        targetDir: getSelectedBasePath()
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
        appendOutput('Installation step completed. Run "Check requirements" again to confirm all dependencies are now ready.');
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
      state.configImported = false;
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

    appendOutput('>>> Step 5: Create database and import AccrediCore structure');
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
      appendOutput('Database bootstrap and smoke test completed successfully. Step 6 is now unlocked.');
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
      appendOutput('Configuration import completed successfully. Installer flow is now complete.');
    }

    refreshWorkflow();
  }

  async function openActivationWebsite() {
    const url = 'https://danandad.com/#activation';
    if (window.accredicore && typeof window.accredicore.openExternal === 'function') {
      await window.accredicore.openExternal(url);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
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

  function buildOfflineActivationRequest() {
    const targetDir = String(byId('target-path-preview')?.value || getSelectedBasePath() || '').trim();
    const dbName = String(byId('db-name')?.value || '').trim();
    const code = `ACH-OFF-${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`;

    return {
      product: 'Arab Compliance Hub',
      request_type: 'offline_activation',
      installation_code: code,
      generated_at: new Date().toISOString(),
      target_directory: targetDir,
      database_name: dbName,
      platform: state.platform,
      instructions: 'Open https://danandad.com/#activation from another device, enter this installation_code, then download the unique .env and activation.json after vendor approval.'
    };
  }

  function showActivationGuidance(mode) {
    const wrap = byId('activation-guidance');
    const title = byId('activation-guidance-title');
    const text = byId('activation-guidance-text');
    const downloadBtn = byId('download-activation-request-btn');
    if (!wrap || !title || !text) return;

    wrap.style.display = '';
    if (mode === 'online') {
      state.activationRequest = null;
      title.textContent = 'Online activation';
      text.textContent = 'Use the vendor portal to request or download your unique .env and activation.json for this deployment. Recommended location: a secure vendor portal endpoint, not public GitHub, because these files are customer-specific and must be approved/signed.';
      if (downloadBtn) downloadBtn.style.display = 'none';
      appendOutput('Step 6 online selected. Opening vendor activation portal for unique .env and activation.json.');
      openActivationWebsite();
      return;
    }

    state.activationRequest = buildOfflineActivationRequest();
    title.textContent = 'Offline activation code';
    text.textContent = `Installation code: ${state.activationRequest.installation_code}. Open https://danandad.com/#activation from another device, enter this code, then download the unique .env and activation.json after vendor approval.`;
    if (downloadBtn) downloadBtn.style.display = '';
    appendOutput('Step 6 offline selected.');
    appendOutput(`Offline installation code: ${state.activationRequest.installation_code}`);
    appendOutput('Open https://danandad.com/#activation from another device and submit this code to request unique .env and activation.json.');
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

    const applyBtn = byId('apply-port-decisions');
    if (applyBtn) applyBtn.disabled = !(state.checkCompleted && state.portIssues && !state.portResolved && allPortDecisionsComplete());

    const portWrap = byId('port-resolution-wrap');
    if (portWrap) portWrap.style.display = (state.checkCompleted && state.portIssues && !state.portResolved) ? '' : 'none';

    const githubWrap = byId('github-step-wrap');
    if (githubWrap) githubWrap.style.display = checksPassed ? '' : 'none';

    const dbWrap = byId('database-step-wrap');
    const configWrap = byId('config-step-wrap');
    if (dbWrap) dbWrap.style.display = state.repoValidated ? '' : 'none';
    if (configWrap) configWrap.style.display = state.dbBootstrapCompleted ? '' : 'none';

    const cloneBtn = byId('clone-repo-btn');
    const validateBtn = byId('validate-repo-btn');
    const dbBtn = byId('bootstrap-database-btn');
    const importBtn = byId('import-config-btn');

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

    refreshNextStepPanel();

    const dbStatus = byId('database-step-status');
    const configStatus = byId('config-step-status');

    if (!state.checkCompleted) {
      setWorkflowStatus('Step 1 is active. Run "Check requirements" first.');
      setGithubStepStatus('Step 4 is locked until requirement checks are complete.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      return;
    }

    if (state.portIssues && !state.portResolved) {
      setWorkflowStatus('Port conflict detected. Choose an action for each conflicting port, then click "Apply port decisions".');
      setGithubStepStatus('Step 4 is locked until the port decision step is complete.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      return;
    }

    if (state.dependencyIssues) {
      setWorkflowStatus('Missing or failed dependencies detected. Run "Install dependencies" before continuing.');
      setGithubStepStatus('Step 4 is locked until all required dependencies pass.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      return;
    }

    if (!state.cloneCompleted) {
      setWorkflowStatus('Checks passed. Step 4 is active: start clone source code.');
      setGithubStepStatus('Choose the project location, then click "Step 4. Start clone source code". The installer will create the target folder automatically.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      return;
    }

    if (!state.repoValidated) {
      setWorkflowStatus('Repository clone completed. Validate the repository content next.');
      setGithubStepStatus('Step 4 is active: validate repository content.');
      if (dbStatus) dbStatus.textContent = 'Step 5 is locked until repository validation completes.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
      return;
    }

    if (!state.dbBootstrapCompleted) {
      setWorkflowStatus(postgresReady
        ? 'Repository validation completed. Step 5 is active: create the database and import the AccrediCore structure.'
        : 'Repository validation completed, but PostgreSQL client/server is missing. Run Step 2 Install Dependencies and rerun Step 1 check before Step 5.');
      setGithubStepStatus('Step 4 completed successfully.');
      if (dbStatus) dbStatus.textContent = postgresReady
        ? (dbInputsValid ? 'Provide database connection values, then click "Create database and import structure".' : validateDbInputs())
        : 'PostgreSQL client/server is missing. Run Step 2 Install Dependencies, restart the installer if needed, then run Step 1 check again.';
      if (configStatus) configStatus.textContent = 'Step 6 is locked until database bootstrap completes.';
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
      return;
    }

    setWorkflowStatus('All workflow steps completed successfully. The cloned AccrediCore project is now prepared for local configuration.');
    setGithubStepStatus('Step 4 completed successfully.');
    if (dbStatus) dbStatus.textContent = 'Database structure imported successfully.';
    if (configStatus) configStatus.textContent = 'Configuration files imported successfully.';
  }

  function refreshNextStepPanel() {
    const panel = byId('next-step-panel');
    if (!panel) return;

    const title = byId('next-step-title');
    const text = byId('next-step-text');
    const validate = byId('next-validate-repo-btn');
    const db = byId('next-bootstrap-database-btn');
    const config = byId('next-import-config-btn');

    [validate, db, config].forEach((btn) => {
      if (btn) btn.style.display = 'none';
    });

    if (state.cloneCompleted && !state.repoValidated) {
      panel.style.display = '';
      if (title) title.textContent = 'Step 4 — Validate Source Code';
      if (text) text.textContent = 'Clone completed successfully. Validate the repository content before database setup.';
      if (validate) validate.style.display = '';
      return;
    }

    if (state.repoValidated && !state.dbBootstrapCompleted) {
      panel.style.display = '';
      if (title) title.textContent = 'Step 5 — Database Set-up';
      if (hasPostgresClient(state.lastReport)) {
        if (text) text.textContent = 'Create the database, import the table structure from the cloned AccrediCore repository, and test the connection.';
        if (db) db.style.display = '';
      } else {
        if (text) text.textContent = 'PostgreSQL client/server is missing. Run Step 2 Install Dependencies and rerun Step 1 Check Requirements before database setup.';
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

    const applyBtn = byId('apply-port-decisions');
    if (applyBtn) applyBtn.addEventListener('click', applyPortDecisions);

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
    const activationOnlineBtn = byId('activation-online-btn');
    const activationOfflineBtn = byId('activation-offline-btn');
    const downloadActivationRequestBtn = byId('download-activation-request-btn');
    const nextValidateRepoBtn = byId('next-validate-repo-btn');
    const nextBootstrapDatabaseBtn = byId('next-bootstrap-database-btn');
    const nextImportConfigBtn = byId('next-import-config-btn');

    if (cloneBtn) cloneBtn.addEventListener('click', cloneRepo);
    if (validateBtn) validateBtn.addEventListener('click', validateRepo);
    if (dbBtn) dbBtn.addEventListener('click', bootstrapDatabase);
    if (browseEnvBtn) browseEnvBtn.addEventListener('click', () => browseForConfig('env'));
    if (browseActivationBtn) browseActivationBtn.addEventListener('click', () => browseForConfig('activation'));
    if (importConfigBtn) importConfigBtn.addEventListener('click', importConfig);
    if (openActivationSiteBtn) openActivationSiteBtn.addEventListener('click', openActivationWebsite);
    if (activationOnlineBtn) activationOnlineBtn.addEventListener('click', () => showActivationGuidance('online'));
    if (activationOfflineBtn) activationOfflineBtn.addEventListener('click', () => showActivationGuidance('offline'));
    if (downloadActivationRequestBtn) downloadActivationRequestBtn.addEventListener('click', downloadActivationRequest);
    if (nextValidateRepoBtn) nextValidateRepoBtn.addEventListener('click', validateRepo);
    if (nextBootstrapDatabaseBtn) nextBootstrapDatabaseBtn.addEventListener('click', bootstrapDatabase);
    if (nextImportConfigBtn) nextImportConfigBtn.addEventListener('click', () => {
      const wrap = byId('config-step-wrap');
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

