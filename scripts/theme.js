function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  const icon = document.querySelector(".theme-toggle i");

  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  icon.className = newTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
}

function initializeTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  const icon = document.querySelector(".theme-toggle i");
  icon.className = savedTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
}
