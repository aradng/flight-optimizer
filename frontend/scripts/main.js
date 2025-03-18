const API_BASE = "http://arad-vm.perm:1234/api";
let selectedOrigins = []; // Removed defaults
let selectedDestinations = []; // Removed defaults
let currentType = "origin";
let isTableView = false;

function saveToLocalStorage() {
  const formData = {
    origins: selectedOrigins,
    destinations: selectedDestinations,
    passengers: document.getElementById("passengers").value,
    minDays: document.getElementById("minDays").value,
    maxDays: document.getElementById("maxDays").value,
    dateRange: $("#dateRange").val(),
  };
  localStorage.setItem("flightFormData", JSON.stringify(formData));
}

function loadFromLocalStorage() {
  const savedData = localStorage.getItem("flightFormData");
  if (savedData) {
    const data = JSON.parse(savedData);
    selectedOrigins = data.origins;
    selectedDestinations = data.destinations;
    document.getElementById("passengers").value = data.passengers || 1;
    document.getElementById("minDays").value = data.minDays || 5;
    document.getElementById("maxDays").value = data.maxDays || 10;
    if (data.dateRange) {
      $("#dateRange").val(data.dateRange);
    }
  }
}

function setType(type) {
  currentType = type;
  document
    .getElementById("originToggle")
    .classList.toggle("active", type === "origin");
  document
    .getElementById("destinationToggle")
    .classList.toggle("active", type === "destination");

  const airportItems = document.querySelectorAll(".airport-item");
  airportItems.forEach((item) => {
    item.classList.remove("origin", "destination");
    item.classList.add(type);
  });
}

function toggleView() {
  isTableView = !isTableView;
  document.getElementById("viewToggleBtn").textContent = `Switch to ${
    isTableView ? "Card" : "Table"
  } View`;
  const results = document.getElementById("results").lastResults;
  if (results) renderResults(results);
}

document.addEventListener("DOMContentLoaded", function () {
  loadFromLocalStorage();
  initializeDatePicker();
  initializeTheme();
  updateList("origins-list", selectedOrigins);
  updateList("destinations-list", selectedDestinations);

  document
    .getElementById("flightForm")
    .addEventListener("submit", async function (event) {
      event.preventDefault();
      showSpinner();
      try {
        const dateRange = $("#dateRange").data("daterangepicker");
        const formData = {
          from_date: dateRange.startDate.format("YYYY-MM-DD"),
          to_date: dateRange.endDate.format("YYYY-MM-DD"),
          passengers: parseInt(document.getElementById("passengers").value),
          min_days: parseInt(document.getElementById("minDays").value),
          max_days: parseInt(document.getElementById("maxDays").value),
          origins: selectedOrigins,
          destinations: selectedDestinations,
        };

        const response = await fetch(`${API_BASE}/flights`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const results = await response.json();
        renderResults(results);
      } catch (error) {
        console.error("Error fetching flights:", error);
      } finally {
        hideSpinner();
      }
    });

  // Add change event listeners for saving
  ["passengers", "minDays", "maxDays"].forEach((id) => {
    document.getElementById(id).addEventListener("change", saveToLocalStorage);
  });

  $("#dateRange").on("apply.daterangepicker", function () {
    saveToLocalStorage();
  });
});

function initializeDatePicker() {
  $("#dateRange").daterangepicker({
    locale: { format: "YYYY-MM-DD" },
    opens: "left",
    showDropdowns: true,
    startDate: "2025-04-01",
    endDate: "2025-04-30",
    hideOffsetDates: true,
    autoUpdateInput: true,
    linkedCalendars: false,
  });
}

// Update adjustValue to save after changes
function adjustValue(id, delta) {
  const input = document.getElementById(id);
  const currentValue = parseInt(input.value) || 0;
  const min = parseInt(input.min) || 1;
  const max = parseInt(input.max) || 30;

  let newValue = currentValue + delta;
  newValue = Math.max(min, Math.min(max, newValue));

  input.value = newValue;
  saveToLocalStorage();
}

// Update any functions that modify origins/destinations to save changes
function updateList(listId, items) {
  const list = document.getElementById(listId);
  list.innerHTML = "";
  items.forEach((item) => {
    const listItem = document.createElement("div");
    listItem.className = "list-item";
    listItem.innerHTML = item;
    listItem.onclick = () => removeItem(listId, item);
    list.appendChild(listItem);
  });
  saveToLocalStorage();
}

function removeItem(listId, item) {
  if (listId === "origins-list") {
    selectedOrigins = selectedOrigins.filter((i) => i !== item);
    updateList("origins-list", selectedOrigins);
  } else if (listId === "destinations-list") {
    selectedDestinations = selectedDestinations.filter((i) => i !== item);
    updateList("destinations-list", selectedDestinations);
  }
  saveToLocalStorage();
}
