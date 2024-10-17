// Constants
const MEDICATIONS = {
  elvanse: {
    name: "Elvanse® 60mg",
    onset: 60,
    duration: 6,
    peakTime: 180,
  },
  amfexa: {
    name: "Amfexa® 10mg",
    onset: 30,
    duration: 3.25,
    peakTime: 90,
  },
};

const SYNC_CODE_LENGTH = 6;
const SYNC_EXPIRY_HOURS = 24;

// Event Listeners
document.addEventListener("DOMContentLoaded", initializePage);
window.addEventListener("beforeunload", () => {
  localStorage.setItem("lastAccessed", Date.now().toString());
});

// Core Initialization
function initializePage() {
  loadDarkModeState();
  loadPreviousTimings();
  loadLocalStorageData();

  // Set up event listeners for form elements
  document
    .getElementById("insertCurrentTime")
    .addEventListener("click", insertCurrentTime);
  document
    .getElementById("toggle-break")
    .addEventListener("change", toggleBreakSettings);
  document
    .getElementById("medication")
    .addEventListener("change", handleMedicationChange);
  document
    .getElementById("calculateButton")
    .addEventListener("click", calculateTimes);
  document.getElementById("resetButton").addEventListener("click", resetForm);
  document
    .getElementById("darkModeToggle")
    .addEventListener("click", toggleDarkMode);
}

// Form Handling Functions
function insertCurrentTime() {
  const now = new Date();
  document.getElementById("startTime").value = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toggleBreakSettings() {
  const isBreakChecked = document.getElementById("toggle-break").checked;
  document.getElementById("advanced-settings").style.display = isBreakChecked
    ? "block"
    : "none";
  if (!isBreakChecked) {
    document.getElementById("breakTime").value = 0;
  }
}

function handleMedicationChange() {
  const medication = document.getElementById("medication").value;
  const breakContainer = document.getElementById("break-container");
  breakContainer.style.display = medication === "both" ? "block" : "none";
  if (medication !== "both") {
    document.getElementById("toggle-break").checked = false;
    toggleBreakSettings();
  }
}

function resetForm() {
  document.getElementById("medForm").reset();
  document.getElementById("result").innerHTML = "";
  resetProgressBar();
  handleMedicationChange();
}

// Core Calculation Functions
function calculateTimes() {
  const resultContainer = document.getElementById("result");
  resultContainer.innerHTML = "";
  resetProgressBar();

  const medication = document.getElementById("medication").value;
  const startTime = document.getElementById("startTime").value;
  const breakTime = Number(document.getElementById("breakTime").value) || 0;

  if (!startTime || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
    showError("Please enter a valid start time in HH:MM format.");
    return;
  }

  try {
    let outputText = "";
    let totalDurationInHours = 0;

    if (medication === "both") {
      if (breakTime > 240) {
        throw new Error("Break time should not exceed 4 hours");
      }
      outputText += calculateForMed(MEDICATIONS.elvanse, startTime);
      totalDurationInHours += MEDICATIONS.elvanse.duration;

      if (breakTime > 0) {
        outputText += `<p><strong>Break Time:</strong> ${breakTime} minutes</p>`;
        totalDurationInHours += breakTime / 60;
      }

      outputText += calculateForMed(
        MEDICATIONS.amfexa,
        startTime,
        MEDICATIONS.amfexa.onset + breakTime
      );
      totalDurationInHours += MEDICATIONS.amfexa.duration;
    } else if (medication in MEDICATIONS) {
      outputText += calculateForMed(MEDICATIONS[medication], startTime);
      totalDurationInHours = MEDICATIONS[medication].duration;
    }

    updateProgressBar(startTime, totalDurationInHours);
    resultContainer.innerHTML = `<div class="calculation-result">${outputText}</div>`;

    saveToLocalStorage({
      startTime,
      medication,
      breakTime,
      calculation: outputText,
    });
  } catch (error) {
    showError(error.message);
  }
}

// Helper Functions
function calculateForMed(
  { name, onset, duration, peakTime },
  startTime,
  additionalOnset = 0
) {
  const [hours, minutes] = startTime.split(":").map(Number);
  const start = new Date();
  start.setHours(hours, minutes);
  const onsetTime = new Date(
    start.getTime() + (onset + additionalOnset) * 60000
  );
  const peakTimeDate = new Date(
    start.getTime() + (peakTime + additionalOnset) * 60000
  );
  const endTime = new Date(onsetTime.getTime() + duration * 3600000);

  return `
        <div class="med-timing">
            <p><strong>Medication:</strong> ${name}</p>
            <p><strong>Start Time:</strong> ${formatTime(start)}</p>
            <p><strong>Onset Time:</strong> ${formatTime(onsetTime)}</p>
            <p><strong>Peak Effect:</strong> ${formatTime(peakTimeDate)}</p>
            <p><strong>End Time:</strong> ${formatTime(endTime)}</p>
        </div>
    `;
}

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function showError(message) {
  const resultContainer = document.getElementById("result");
  resultContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// Progress Bar Functions
function resetProgressBar() {
  const progressBar = document.querySelector(".progress-bar .progress");
  const breakProgressBar = document.querySelector(
    ".progress-bar .break-progress"
  );
  const progressLabel = document.querySelector(".progress-bar .progress-label");

  progressBar.style.width = "0%";
  progressBar.style.background = "var(--progress-color)";
  breakProgressBar.style.width = "0%";
  progressLabel.textContent = "0%";
}

function updateProgressBar(startTime, totalDurationInHours) {
  if (window.progressInterval) clearInterval(window.progressInterval);
  if (window.progressTimeout) clearTimeout(window.progressTimeout);

  try {
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    const end = new Date(start.getTime() + totalDurationInHours * 3600000);

    const progressBar = document.querySelector(".progress-bar .progress");
    const progressLabel = document.querySelector(
      ".progress-bar .progress-label"
    );

    const updateProgress = () => {
      const now = new Date();
      const elapsed = Math.max(0, now - start);
      const total = end - start;
      const progressPercentage = Math.min((elapsed / total) * 100, 100);

      progressBar.style.width = `${progressPercentage}%`;
      progressLabel.textContent = `${Math.round(progressPercentage)}%`;

      if (now >= end) {
        progressBar.style.background = "var(--progress-expired-color)";
        if (window.progressInterval) clearInterval(window.progressInterval);
      }
    };

    window.progressInterval = setInterval(updateProgress, 1000);
    window.progressTimeout = setTimeout(() => {
      updateProgress();
      if (window.progressInterval) clearInterval(window.progressInterval);
    }, totalDurationInHours * 3600000);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        updateProgress();
      }
    });

    updateProgress();
  } catch (error) {
    console.error("Progress bar update failed:", error);
    if (window.progressInterval) clearInterval(window.progressInterval);
  }
}

// Local Storage Functions
function saveToLocalStorage(data) {
  try {
    const { startTime, medication, breakTime, calculation } = data;
    localStorage.setItem("lastStartTime", startTime);
    localStorage.setItem("lastMedication", medication);
    localStorage.setItem("lastBreakTime", breakTime);
    localStorage.setItem("lastCalculation", btoa(calculation));
    localStorage.setItem("lastUpdated", Date.now().toString());
  } catch (error) {
    console.warn("Failed to save to localStorage:", error);
  }
}

// Dark Mode Functions
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
  );
}

function loadDarkModeState() {
  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
  }
}

// Load Previous Data Functions
function loadPreviousTimings() {
  try {
    const lastStartTime = localStorage.getItem("lastStartTime");
    const lastMedication = localStorage.getItem("lastMedication");
    const lastBreakTime = localStorage.getItem("lastBreakTime");
    const lastCalculation = localStorage.getItem("lastCalculation");

    if (lastStartTime)
      document.getElementById("startTime").value = lastStartTime;
    if (lastMedication)
      document.getElementById("medication").value = lastMedication;
    if (lastBreakTime)
      document.getElementById("breakTime").value = lastBreakTime;
    if (lastCalculation) {
      const resultContainer = document.getElementById("result");
      resultContainer.innerHTML = `<div class="calculation-result">${atob(
        lastCalculation
      )}</div>`;
    }

    handleMedicationChange();
  } catch (error) {
    console.warn("Failed to load previous timings:", error);
  }
}

function loadLocalStorageData() {
  try {
    const lastUpdated = localStorage.getItem("lastUpdated");
    const lastAccessed = localStorage.getItem("lastAccessed");
    const currentDate = new Date();

    document.getElementById("localStorageUpdated").textContent = lastUpdated
      ? new Date(parseInt(lastUpdated)).toLocaleString()
      : "Never";
    document.getElementById("lastAccessed").textContent = lastAccessed
      ? new Date(parseInt(lastAccessed)).toLocaleString()
      : "First Visit";
    document.getElementById("currentDateTime").textContent =
      currentDate.toLocaleString();

    localStorage.setItem("lastAccessed", currentDate.getTime().toString());
  } catch (error) {
    console.warn("Failed to load localStorage data:", error);
  }
}

function generateSyncCode() {
  const timestamp = Date.now();
  const data = {
    medication: document.getElementById("medication").value,
    startTime: document.getElementById("startTime").value,
    breakTime: document.getElementById("breakTime").value,
    timestamp: timestamp,
    expires: timestamp + SYNC_EXPIRY_HOURS * 60 * 60 * 1000,
  };

  // Generate a random 6-character code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    // Store in localStorage with the code as key
    localStorage.setItem(`sync_${code}`, JSON.stringify(data));

    // Show the code to the user
    const resultContainer = document.getElementById("result");
    resultContainer.innerHTML += `
            <div class="sync-code-container">
                <p>Share this code to sync your timing:</p>
                <div class="sync-code">${code}</div>
                <p>Code expires in ${SYNC_EXPIRY_HOURS} hours</p>
            </div>
        `;

    // Clean up old sync codes
    cleanupOldSyncCodes();
  } catch (error) {
    console.warn("Failed to generate sync code:", error);
    showError("Failed to generate sync code. LocalStorage might be full.");
  }
}

function applySyncCode(code) {
  const syncData = localStorage.getItem(`sync_${code.toUpperCase()}`);

  if (!syncData) {
    showError("Invalid sync code. Please try again.");
    return;
  }

  try {
    const data = JSON.parse(syncData);

    // Check if code has expired
    if (Date.now() > data.expires) {
      localStorage.removeItem(`sync_${code.toUpperCase()}`);
      showError("This sync code has expired. Please request a new one.");
      return;
    }

    // Apply the synced settings
    document.getElementById("medication").value = data.medication;
    document.getElementById("startTime").value = data.startTime;
    document.getElementById("breakTime").value = data.breakTime;

    // Update UI based on synced settings
    handleMedicationChange();
    calculateTimes();

    showSuccess("Settings successfully synced!");
  } catch (error) {
    console.error("Failed to apply sync code:", error);
    showError("Failed to apply sync code. Please try again.");
  }
}

function cleanupOldSyncCodes() {
  const currentTime = Date.now();

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("sync_")) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (currentTime > data.expires) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        // If the data is corrupt, remove it
        localStorage.removeItem(key);
      }
    }
  });
}

function showSuccess(message) {
  const resultContainer = document.getElementById("result");
  resultContainer.innerHTML += `<div class="success-message">${message}</div>`;
}
