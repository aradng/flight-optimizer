async function fetchAirports() {
  const query = document.getElementById("airport").value;
  if (query.length < 2) return;
  const response = await fetch(`${API_BASE}/airports?q=${query}`);
  const airports = await response.json();
  renderAirportList(airports);
}

function renderAirportList(airports) {
  const list = document.getElementById("airport-list");
  const baseColumnWidth = 220;
  const itemsPerRow = Math.max(
    3,
    Math.floor(window.innerWidth / baseColumnWidth)
  );
  const totalItems = itemsPerRow * 2;

  list.style.gridTemplateColumns = `repeat(${itemsPerRow}, 1fr)`;
  list.innerHTML = "";

  list.innerHTML = airports
    .slice(0, totalItems)
    .map(
      (a) => `
        <li class="airport-item ${currentType}" onclick="addAirport('${a.code}')">
            <div class="airport-code">${a.code}</div>
            <div>${a.name}</div>
            <div>${a.city}</div>
            <div>${a.country}</div>
        </li>
    `
    )
    .join("");
}

function addAirport(code) {
  if (currentType === "origin" && !selectedOrigins.includes(code)) {
    selectedOrigins.push(code);
    updateList("origins-list", selectedOrigins);
  } else if (
    currentType === "destination" &&
    !selectedDestinations.includes(code)
  ) {
    selectedDestinations.push(code);
    updateList("destinations-list", selectedDestinations);
  }
}

function removeAirport(code, elementId) {
  if (elementId === "origins-list") {
    selectedOrigins = selectedOrigins.filter((c) => c !== code);
    updateList("origins-list", selectedOrigins);
  } else {
    selectedDestinations = selectedDestinations.filter((c) => c !== code);
    updateList("destinations-list", selectedDestinations);
  }
}

function updateList(elementId, list) {
  document.getElementById(elementId).innerHTML = list
    .map(
      (code) =>
        `<span class='list-item' onclick="removeAirport('${code}', '${elementId}')">${code} ×</span>`
    )
    .join("");
}
