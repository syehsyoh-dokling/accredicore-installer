const state = {
  confirmed: false,
  checked: false,
  canContinue: false,
  results: [
    { key: "git", title: "Git", desc: "Version detected: 2.48.1", badge: "Passed", className: "passed" },
    { key: "node", title: "Node.js", desc: "Version detected: v22.3.0", badge: "Passed", className: "passed" },
    { key: "npm", title: "npm / pnpm", desc: "npm found, pnpm not found. You can continue, but pnpm is recommended.", badge: "Warning", className: "warning" },
    { key: "docker", title: "Docker Desktop", desc: "Docker was not detected in the system path. Install is required before setup continues.", badge: "Missing", className: "missing" },
    { key: "disk", title: "Disk Space", desc: "128 GB available on the selected drive.", badge: "Passed", className: "passed" },
    { key: "internet", title: "Internet Connection", desc: "Connection OK. Remote repository and package registry are reachable.", badge: "Passed", className: "passed" },
    { key: "ports", title: "Required Ports", desc: "Port 3000 is already in use. You may need to reconfigure local services.", badge: "Warning", className: "warning" },
    { key: "write", title: "Write Access", desc: "Installer confirmed write access to the default working directory.", badge: "Passed", className: "passed" }
  ]
};

const qs = (s) => document.querySelector(s);
const qsa = (s) => [...document.querySelectorAll(s)];

const modal = qs("#modal");
const modalTitle = qs("#modalTitle");
const progressFill = qs("#progressFill");
const progressText = qs("#progressText");
const progressList = qs("#progressList");
const modalCloseRow = qs("#modalCloseRow");
const modalCloseBtn = qs("#modalCloseBtn");
const footerStatus = qs("#footerStatus");

function setCheckTime() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  qs("#checkTime").textContent = `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

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

    await sleep(450);

    item.classList.add("done");
    progressFill.style.width = `${Math.round(((i + 1) / steps.length) * 100)}%`;
  }
  progressText.textContent = "Completed";
  modalCloseRow.classList.remove("hidden");
}

function renderResults() {
  const list = qs("#resultsList");
  list.innerHTML = "";
  state.results.forEach((item) => {
    const row = document.createElement("div");
    row.className = "result-row";
    row.innerHTML = `
      <div>
        <div class="result-title">${item.title}</div>
        <div class="result-desc">${item.desc}</div>
      </div>
      <span class="status ${item.className}">${item.badge}</span>
    `;
    list.appendChild(row);
  });

  state.results.forEach((item) => {
    const badge = document.querySelector(`[data-key="${item.key}"]`);
    if (badge) {
      badge.textContent = item.badge;
      badge.className = `status ${item.className}`;
    }
  });
}

function unlockAfterCheck() {
  qs("#resultsSection").classList.remove("hidden");
  qs("#stepsSection").classList.remove("hidden");
  qs("#actionsSection").classList.remove("hidden");
  qs("#continueBtn").disabled = false;
  qs("#continueBtn").className = "btn-primary";
  footerStatus.textContent = "Requirement check completed";
  state.checked = true;
  state.canContinue = true;
  renderResults();
}

async function doRequirementCheck() {
  if (!state.confirmed) {
    alert("Please confirm that this is your device first.");
    return;
  }

  footerStatus.textContent = "Checking system requirements...";
  await runProgress("Checking minimum requirements...", [
    "Reading local environment information",
    "Checking Git availability",
    "Checking Node.js version",
    "Checking npm / pnpm availability",
    "Checking Docker Desktop availability",
    "Checking disk space",
    "Checking internet connection",
    "Checking required ports",
    "Checking write access to working directory"
  ]);
  unlockAfterCheck();
}

document.addEventListener("DOMContentLoaded", () => {
  setCheckTime();

  qs("#confirmDeviceBtn").addEventListener("click", () => {
    state.confirmed = true;
    qs("#wrongDeviceNote").classList.add("hidden");
    qs("#requirementsSection").classList.remove("hidden");
    qs("#actionsSection").classList.remove("hidden");
    footerStatus.textContent = "Device confirmed. Ready to check minimum requirements";
  });

  qs("#wrongDeviceBtn").addEventListener("click", () => {
    state.confirmed = false;
    qs("#wrongDeviceNote").classList.remove("hidden");
    footerStatus.textContent = "Process stopped because the device was not confirmed";
  });

  qs("#startHereBtn").addEventListener("click", doRequirementCheck);
  qs("#checkRequirementsBtn").addEventListener("click", doRequirementCheck);

  qs("#continueToStep2Btn").addEventListener("click", () => {
    alert("Stage 1 complete. In the next stage, we will wire Step 2 (Install Missing Components) with its own runnable logic.");
  });

  qs("#stopAfterStep1Btn").addEventListener("click", () => {
    footerStatus.textContent = "Stopped after Step 1 by user choice";
    alert("Stopped after Step 1.");
  });

  qs("#continueBtn").addEventListener("click", () => {
    if (!state.canContinue) return;
    qs("#stepsSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  qs("#fixMissingItemsBtn").addEventListener("click", () => {
    alert("This button will be connected in the next stage.");
  });

  qs("#exitBtn").addEventListener("click", () => {
    footerStatus.textContent = "Installer flow closed by user";
    alert("You can close this window now.");
  });

  modalCloseBtn.addEventListener("click", closeModal);
});
