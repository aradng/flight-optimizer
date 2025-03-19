function formatDate(dateStr, isJalali = false) {
  if (isJalali) return dateStr;
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatPrice(rials) {
  return Math.floor(rials / 10)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function renderResults(results) {
  document.getElementById("results").lastResults = results;
  const container = document.getElementById("results");

  container.innerHTML = isTableView
    ? renderTableView(results)
    : renderCardView(results);
}

function renderTableView(results) {
  return `
        <table class="results-table">
            <thead>
                <tr>
                    <th>Outbound Flight</th>
                    <th>Departure Route</th>
                    <th>Return Flight</th>
                    <th>Arrival Route</th>
                    <th>Price (Rials)</th>
                </tr>
            </thead>
            <tbody>
                ${results
                  .map(
                    (r) => `
                    <tr>
                        <td>${formatDate(r.date_departure)}<br>${
                      r.jdate_departure
                    }</td>
                        <td>${r.origin_departure} → ${
                      r.destination_departure
                    }</td>
                        <td>${formatDate(r.date_arrival)}<br>${
                      r.jdate_arrival
                    }</td>
                        <td>${r.origin_arrival} → ${r.destination_arrival}</td>
                        <td class="price-tag">${formatPrice(r.total_price)}</td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>`;
}

function renderCardView(results) {
  return `
        <div class="card-view">
            ${results
              .map(
                (r) => `
                <div class="flight-card">
                    <div>
                        <strong>Outbound Flight</strong><br>
                        Route: ${r.origin_departure} → ${
                  r.destination_departure
                }<br>
                        Date: ${formatDate(r.date_departure)}<br>
                        Jalali: ${r.jdate_departure}<br>
                        Price: ${formatPrice(r.price_departure)} Rials
                    </div>
                    <div>
                        <strong>Return Flight</strong><br>
                        Route: ${r.origin_arrival} → ${
                  r.destination_arrival
                }<br>
                        Date: ${formatDate(r.date_arrival)}<br>
                        Jalali: ${r.jdate_arrival}<br>
                        Price: ${formatPrice(r.price_arrival)} Rials
                    </div>
                    <div class="price-tag">Total Price: ${formatPrice(
                      r.total_price
                    )} Rials</div>
                </div>
            `
              )
              .join("")}
        </div>`;
}
