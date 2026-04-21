const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

function getPlatformKey() {
  if (process.platform === 'win32') return 'windows';
  if (process.platform === 'darwin') return 'macos';
  if (process.platform === 'linux') return 'linux';
  return 'unknown';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1180,
    minHeight: 760,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const platformKey = getPlatformKey();
  const platformGui = {
    windows: path.join(__dirname, '..', 'windows', 'gui', 'index.html'),
    linux: path.join(__dirname, '..', 'linux', 'gui', 'index.html'),
    macos: path.join(__dirname, '..', 'macos', 'gui', 'index.html')
  };

  const installerEntry = platformGui[platformKey] || path.join(__dirname, '..', 'index.html');
  win.loadFile(installerEntry);
}

function scriptForAction(platformKey, action) {
  const base = path.join(__dirname, '..');

  const map = {
    windows: {
      check: ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/checker/Run-RequirementCheck.ps1')]],
      install: ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/installer/Install-Dependencies.ps1')]],
      'create-folder': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step3-CreateTargetFolder.ps1')]],
      'clone-repo': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step3-CloneRepoFromGitHub.ps1')]],
      'validate-repo': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step3-ValidateRepository.ps1')]],
      'bootstrap-database': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step4-BootstrapDatabase.ps1')]],
      'import-config': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step5-ImportActivationConfig.ps1')]],
      'start-servers': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step6-StartLocalServers.ps1')]],
      git: ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Step3-CommitAndPushProject.ps1')]],
      build: ['cmd.exe', ['/c', 'npm', 'run', 'dist:win']],
      'stop-process': ['powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(base, 'windows/bootstrap/Stop-ProcessByPid.ps1')]]
    },
    linux: {
      check: ['bash', [path.join(base, 'linux/checker/Run-RequirementCheck.sh')]],
      install: ['bash', [path.join(base, 'linux/installer/Install-Dependencies.sh')]],
      build: ['bash', ['-lc', 'npm run dist:linux']]
    },
    macos: {
      check: ['bash', [path.join(base, 'macos/checker/Run-RequirementCheck.sh')]],
      install: ['bash', [path.join(base, 'macos/installer/Install-Dependencies.sh')]],
      build: ['bash', ['-lc', 'npm run dist:mac']]
    }
  };

  return map[platformKey] && map[platformKey][action];
}

function addDynamicArgs(platformKey, action, args, payload) {
  const next = [...args];

  if (platformKey === 'windows') {
    if (action === 'check' && payload.workingDirectory) {
      next.push('-WorkingDirectory', payload.workingDirectory);
    }
    if (action === 'create-folder' && payload.targetDir) {
      next.push('-TargetDir', payload.targetDir);
    }
    if (action === 'clone-repo') {
      if (payload.repoUrl) next.push('-RepoUrl', payload.repoUrl);
      if (payload.targetDir) next.push('-TargetDir', payload.targetDir);
    }
    if (action === 'validate-repo' && payload.targetDir) {
      next.push('-ProjectRoot', payload.targetDir);
    }
    if (action === 'git') {
      if (payload.targetDir) next.push('-ProjectRoot', payload.targetDir);
      if (payload.remoteUrl) next.push('-RemoteUrl', payload.remoteUrl);
      next.push('-CommitMessage', 'Production-ready installer bootstrap');
    }
    if (action === 'bootstrap-database') {
      if (payload.targetDir) next.push('-ProjectRoot', payload.targetDir);
      if (payload.dbHost) next.push('-DbHost', payload.dbHost);
      if (payload.dbPort) next.push('-DbPort', String(payload.dbPort));
      if (payload.dbName) next.push('-DbName', payload.dbName);
      if (payload.dbUser) next.push('-DbUser', payload.dbUser);
      if (payload.dbPassword !== undefined) next.push('-DbPassword', payload.dbPassword);
    }
    if (action === 'import-config') {
      if (payload.targetDir) next.push('-ProjectRoot', payload.targetDir);
      if (payload.envPath) next.push('-EnvSourcePath', payload.envPath);
      if (payload.activationPath) next.push('-ActivationSourcePath', payload.activationPath);
    }
    if (action === 'start-servers') {
      if (payload.targetDir) next.push('-ProjectRoot', payload.targetDir);
      if (payload.dbHost) next.push('-DbHost', payload.dbHost);
      if (payload.dbPort) next.push('-DbPort', String(payload.dbPort));
      if (payload.dbName) next.push('-DbName', payload.dbName);
      if (payload.dbUser) next.push('-DbUser', payload.dbUser);
      if (payload.dbPassword !== undefined) next.push('-DbPassword', payload.dbPassword);
      if (payload.frontendPort) next.push('-FrontendPort', String(payload.frontendPort));
      if (payload.localApiPort) next.push('-LocalApiPort', String(payload.localApiPort));
    }
    if (action === 'stop-process' && payload.pid) {
      next.push('-Pid', payload.pid);
    }
  }

  return next.filter(Boolean);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: cwd || path.join(__dirname, '..'),
      shell: false,
      env: process.env
    });

    let output = '';
    child.stdout.on('data', data => output += data.toString());
    child.stderr.on('data', data => output += data.toString());
    child.on('error', reject);
    child.on('close', code => resolve({ code, output }));
  });
}

ipcMain.handle('accredicore:get-platform', async () => getPlatformKey());

ipcMain.handle('accredicore:get-home-info', async () => {
  const home = app.getPath('home');
  return {
    home,
    desktop: app.getPath('desktop'),
    downloads: app.getPath('downloads'),
    documents: app.getPath('documents'),
    username: path.basename(home)
  };
});

ipcMain.handle('accredicore:get-download-preference', async () => {
  const candidates = [
    path.join(app.getPath('downloads'), 'accredicore-installer-preference.json'),
    path.join(__dirname, '..', 'accredicore-installer-preference.json')
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return { ...parsed, source_path: filePath };
    } catch (_error) {}
  }

  return null;
});

ipcMain.handle('accredicore:request-online-activation', async (_event, payload) => {
  const endpoint = 'https://accredicore.danandad.com/vendor-portal/api/installer-activation.php';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Online activation request failed.');
  }

  const outputDir = path.join(__dirname, '..', 'activation-downloads', data.request_id || Date.now().toString());
  fs.mkdirSync(outputDir, { recursive: true });

  const envPath = path.join(outputDir, '.env');
  const activationPath = path.join(outputDir, 'activation.json');
  fs.writeFileSync(envPath, String(data.files && data.files.env_content ? data.files.env_content : ''), 'utf8');
  fs.writeFileSync(activationPath, JSON.stringify(data.files.activation_json, null, 2) + '\n', 'utf8');

  return {
    ...data,
    saved_files: {
      env_path: envPath,
      activation_json_path: activationPath
    }
  };
});

ipcMain.handle('accredicore:run-action', async (_event, payload) => {
  const platformKey = getPlatformKey();
  const entry = scriptForAction(platformKey, payload.action);
  if (!entry) throw new Error(`No script is configured for action "${payload.action}" on ${platformKey}.`);

  const [command, args] = entry;
  const finalArgs = addDynamicArgs(platformKey, payload.action, args, payload);
  return runCommand(command, finalArgs, path.join(__dirname, '..'));
});

ipcMain.handle('accredicore:open-path', async (_event, targetPath) => shell.openPath(targetPath));
ipcMain.handle('accredicore:select-file', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('accredicore:select-folder', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('accredicore:open-external', async (_event, url) => shell.openExternal(url));
ipcMain.handle('accredicore:copy-text', async (_event, text) => {
  clipboard.writeText(String(text || ''));
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

