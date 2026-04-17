const state = {
  confirmed: false,
  checked: false,
  canContinue: false,
  actualData: null,
  step2Decision: null,
  selectedPortStrategy: null,
  projectBasePath: "C:\\Users\\Saifuddin",
  projectMainPath: "C:\\Users\\Saifuddin\\accredicore-main"
};

const qs = (s) => document.querySelector(s);
const modal = qs("#modal");
const modalTitle = qs("#modalTitle");
const progressFill = qs("#progressFill");
const progressText = qs("#progressText");
const progressList = qs("#progressList");
const modalCloseRow = qs("#modalCloseRow");
const modalCloseBtn = qs("#modalCloseBtn");
const footerStatus = qs("#footerStatus");

function openModal(title) {
  modalTitle.textContent = title;
  progressFill.style.width = "0%";
  progressText.textContent = "Initializing...";
  progressList.innerHTML = "";
  modalCloseRow.classList.add("hidden");
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runProgress(title, steps) {
  openModal(title);
  for (let i = 0; i < steps.length; i++) {
    progressText.textContent = steps[i];
    const item = document.createElement("div");
    item.className = "progress-item";
    item.textContent = steps[i];
    progressList.appendChild(item);
    await sleep(250);
    item.classList.add("done");
    progressFill.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
  }
  progressText.textContent = "Completed";
  modalCloseRow.classList.remove("hidden");
}

function normalizeStatus(status) {
  const s = (status || "").toLowerCase();
  if (s === "passed") return "passed";
  if (s === "warning") return "warning";
  if (s === "missing" || s === "failed") return "missing";
  return "neutral";
}

function summaryText(summary) {
  const values = Object.values(summary || {});
  const passed = values.filter(v => v === "Passed").length;
  const warning = values.filter(v => v === "Warning").length;
  const missing = values.filter(v => v === "Missing").length;
  return `${passed} Passed Â· ${warning} Warning Â· ${missing} Missing`;
}

function setButtonEnabled(btn, enabled, primary = true) {
  btn.disabled = !enabled;
  btn.className = enabled ? (primary ? "btn-primary" : "btn-secondary") : "btn-muted";
}

function renderActualData(data) {
  state.actualData = data;

  if (data?.system) {
    qs("#osName").textContent = data.system.operating_system || "Unknown";
    qs("#osVersion").textContent = data.system.os_version || "Unknown";
    qs("#arch").textContent = data.system.architecture || "Unknown";
  }
  if (data?.generated_at) {
    qs("#checkTime").textContent = data.generated_at;
  }

  const summary = data?.summary || {};
  qs("#resultsSummary").textContent = summaryText(summary);

  Object.entries(summary).forEach(([key, value]) => {
    const badge = document.querySelector(`[data-key="${key}"]`);
    if (badge) {
      badge.textContent = value;
      badge.className = `status ${normalizeStatus(value)}`;
    }
  });

  const checks = data?.checks || {};
  const orderedKeys = [
    "git", "node", "package_manager", "docker", "disk_space", "internet", "ports", "write_access"
  ];

  const list = qs("#resultsList");
  list.innerHTML = "";

  orderedKeys.forEach((key) => {
    const item = checks[key];
    if (!item) return;

    let detail = item.detail || "";
    if (key === "git" && item.version) detail = `Version detected: ${item.version}`;
    if (key === "node" && item.version) detail = `Version detected: ${item.version}`;
    if (key === "docker" && item.version) detail = `Version detected: ${item.version}`;
    if (key === "disk_space" && item.free_gb !== undefined) detail = `${item.free_gb} GB available on the selected drive.`;
    if (key === "ports" && Array.isArray(item.ports)) {
      const inUse = item.ports.filter(p => p.in_use);
      detail = inUse.length
        ? inUse.map(p => `Port ${p.port} is in use by ${p.process_name || "unknown process"}`).join("; ")
        : "Required ports are available.";
    }

    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <div>
        <div class="result-title">${item.title || key}</div>
        <div class="result-desc">${detail}</div>
      </div>
      <span class="status ${normalizeStatus(item.status)}">${item.status}</span>
    `;
    list.appendChild(row);
  });

  qs("#requirementsSection").classList.remove("hidden");
  qs("#resultsSection").classList.remove("hidden");
  qs("#actionsSection").classList.remove("hidden");

  setButtonEnabled(qs("#continueBtn"), true, true);
  footerStatus.textContent = "Actual requirement results loaded";
  state.checked = true;
  state.canContinue = true;

  evaluateStep2(data);
}

function evaluateStep2(data) {
  const summary = data?.summary || {};
  const checks = data?.checks || {};

  const missingKeys = Object.entries(summary).filter(([k, v]) => v === "Missing").map(([k]) => k);
  const warningKeys = Object.entries(summary).filter(([k, v]) => v === "Warning").map(([k]) => k);

  const step2Section = qs("#step2Section");
  const step3Section = qs("#step3Section");
  const step2MissingWrap = qs("#step2MissingWrap");
  const step2PortWrap = qs("#step2PortWrap");
  const step2AllPassWrap = qs("#step2AllPassWrap");
  const continueToStep3Btn = qs("#continueToStep3Btn");

  step2Section.classList.remove("hidden");
  step3Section.classList.add("hidden");
  step2MissingWrap.classList.add("hidden");
  step2PortWrap.classList.add("hidden");
  step2AllPassWrap.classList.add("hidden");
  setButtonEnabled(continueToStep3Btn, false, true);

  const nonPortMissing = missingKeys.filter(k => k !== "ports");
  const onlyPortWarning = warningKeys.length > 0 && warningKeys.every(k => k === "ports") && nonPortMissing.length === 0;
  const allPassed = missingKeys.length === 0 && warningKeys.length === 0;

  if (nonPortMissing.length > 0) {
    state.step2Decision = "install";
    qs("#step2Intro").textContent = "Some required components are missing. Step 2 should continue with installation before deployment can proceed.";
    renderMissingItems(nonPortMissing, checks);
    step2MissingWrap.classList.remove("hidden");
    footerStatus.textContent = "Step 2 requires installation of missing components";
    return;
  }

  if (onlyPortWarning) {
    state.step2Decision = "ports";
    qs("#step2Intro").textContent = "No installation is required. Only port conflicts were detected, so you can confirm an alternative and continue.";
    renderPortAlternatives(checks.ports);
    step2PortWrap.classList.remove("hidden");
    footerStatus.textContent = "Step 2 requires port conflict confirmation";
    return;
  }

  if (allPassed) {
    state.step2Decision = "skip";
    qs("#step2Intro").textContent = "All requirements passed. Step 2 can be skipped.";
    step2AllPassWrap.classList.remove("hidden");
    setButtonEnabled(continueToStep3Btn, true, true);
    footerStatus.textContent = "All requirements passed. Step 2 can be skipped";
    return;
  }

  state.step2Decision = "mixed";
  qs("#step2Intro").textContent = "Warnings were detected. Review them before continuing.";
  if (warningKeys.includes("ports")) {
    renderPortAlternatives(checks.ports);
    step2PortWrap.classList.remove("hidden");
  }
}

function renderMissingItems(keys, checks) {
  const wrap = qs("#missingList");
  wrap.innerHTML = "";
  keys.forEach((key) => {
    const item = checks[key];
    if (!item) return;
    const row = document.createElement("div");
    row.className = "requirement-row";
    row.innerHTML = `
      <div>
        <div class="req-title">${item.title}</div>
        <div class="req-desc">${item.detail || "This component must be installed before deployment can continue."}</div>
      </div>
      <span class="status missing">Missing</span>
    `;
    wrap.appendChild(row);
  });
}

function renderPortAlternatives(portCheck) {
  const box = qs("#portConflictBox");
  const altList = qs("#portAlternatives");
  altList.innerHTML = "";

  const used = (portCheck?.ports || []).filter(p => p.in_use);
  if (!used.length) {
    box.textContent = "No active port conflict was detected.";
    return;
  }

  box.textContent = used.map(p => `Port ${p.port} is currently used by ${p.process_name || "unknown process"}.`).join(" ");

  used.forEach(p => {
    const alt = p.port + 1;
    const item = document.createElement("div");
    item.className = "port-alt-item";
    item.textContent = `Use port ${alt} instead of ${p.port} for AccrediCore while ${p.process_name || "unknown"} keeps running.`;
    altList.appendChild(item);
  });
}

async function loadActualResults() {
  if (!state.confirmed) {
    alert("Please confirm that this is your device first.");
    return;
  }

  footerStatus.textContent = "Loading actual requirement results...";

  await runProgress("Loading actual Windows checker results...", [
    "Preparing GUI environment",
    "Opening system-requirements.json",
    "Reading actual checker output",
    "Rendering latest requirement status"
  ]);

  try {
    const response = await fetch("../checker/output/system-requirements.json?ts=" + Date.now());
    if (!response.ok) throw new Error("Could not load system-requirements.json");
    const data = await response.json();
    renderActualData(data);
  } catch (err) {
    footerStatus.textContent = "Failed to load actual requirement results";
    alert("Actual JSON could not be loaded. Please run the actual launcher PowerShell file so the GUI opens through a local server.");
    console.error(err);
  }
}

async function simulateInstallMissing() {
  await runProgress("Installing missing components...", [
    "Preparing installation plan",
    "Downloading required dependency packages",
    "Installing missing components",
    "Validating installed tools",
    "Completing Step 2"
  ]);
  qs("#step2Intro").textContent = "Missing components have been simulated for installation. You may continue to Step 3.";
  setButtonEnabled(qs("#continueToStep3Btn"), true, true);
  footerStatus.textContent = "Step 2 installation completed";
}

function showStep3() {
  qs("#step3Section").classList.remove("hidden");
  qs("#step3Section").scrollIntoView({ behavior: "smooth", block: "start" });
  footerStatus.textContent = "Step 3 is ready";
}

async function simulateStep3Download() {
  await runProgress("Deploying source code from ZIP...", [
    "Choosing target project folder",
    "Downloading source ZIP package",
    "Extracting ZIP into target folder",
    "Preparing Git working tree",
    "Step 3 completed"
  ]);

  const resultBox = qs("#step3ResultBox");
  resultBox.classList.remove("hidden");
  resultBox.className = "inline-note success-note";
  resultBox.textContent = `Source package prepared for ${state.projectMainPath}. This project folder can live anywhere. XAMPP htdocs is optional and not required unless your runtime stack needs it.`;
  footerStatus.textContent = "Step 3 source deployment prepared";
}

document.addEventListener("DOMContentLoaded", () => {
  qs("#targetFolderBadge").textContent = state.projectMainPath;

  qs("#confirmDeviceBtn").addEventListener("click", () => {
    state.confirmed = true;
    qs("#wrongDeviceNote").classList.add("hidden");
    qs("#requirementsSection").classList.remove("hidden");
    qs("#actionsSection").classList.remove("hidden");
    footerStatus.textContent = "Device confirmed. Ready to load actual results";
  });

  qs("#wrongDeviceBtn").addEventListener("click", () => {
    state.confirmed = false;
    qs("#wrongDeviceNote").classList.remove("hidden");
    footerStatus.textContent = "Process stopped because the device was not confirmed";
  });

  qs("#startHereBtn").addEventListener("click", loadActualResults);
  qs("#checkRequirementsBtn").addEventListener("click", loadActualResults);

  qs("#installMissingBtn")?.addEventListener("click", async () => {
    await simulateInstallMissing();
    setButtonEnabled(qs("#continueToStep3Btn"), true, true);
  });

  qs("#useAltPortsBtn")?.addEventListener("click", () => {
    state.selectedPortStrategy = "alternative";
    footerStatus.textContent = "Alternative ports confirmed for Step 3";
    setButtonEnabled(qs("#continueToStep3Btn"), true, true);
  });

  qs("#configureLaterBtn")?.addEventListener("click", () => {
    state.selectedPortStrategy = "later";
    footerStatus.textContent = "Port configuration deferred to Step 3";
    setButtonEnabled(qs("#continueToStep3Btn"), true, true);
  });

  qs("#rerunCheckBtn")?.addEventListener("click", async () => {
    await loadActualResults();
  });

  qs("#continueToStep3Btn").addEventListener("click", () => {
    if (qs("#continueToStep3Btn").disabled) return;
    showStep3();
  });

  qs("#downloadSourceBtn").addEventListener("click", async () => {
    await simulateStep3Download();
  });

  qs("#showStep3PathBtn").addEventListener("click", () => {
    const note = qs("#step3PathNote");
    note.classList.remove("hidden");
    note.className = "inline-note warning-note";
    note.textContent = `Recommended target path: ${state.projectMainPath}. You may also use another folder outside XAMPP. Use htdocs only if your stack specifically needs Apache/PHP from that directory.`;
  });

  qs("#continueBtn").addEventListener("click", () => {
    if (qs("#continueBtn").disabled) return;
    qs("#step2Section").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  qs("#exitBtn").addEventListener("click", () => {
    footerStatus.textContent = "Installer flow closed by user";
    alert("You can close this window now.");
  });

  modalCloseBtn.addEventListener("click", closeModal);
});
