// ============================
// Navbar scroll transparency
// ============================
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

// ============================
// Theme toggle (dark/light)
// ============================
const themeToggle = document.getElementById("themeToggle");
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const icon = themeToggle.querySelector("i");
  if (document.body.classList.contains("dark")) {
    icon.classList.replace("fa-moon", "fa-sun");
  } else {
    icon.classList.replace("fa-sun", "fa-moon");
  }
});

// ============================
// Backend logic (main app flow)
// ============================
const form = document.getElementById("healthForm");
const resultCard = document.getElementById("result");
const recommendationText = document.getElementById("recommendationText");
const forecastDetails = document.getElementById("forecastDetails");
const weatherChart = document.getElementById("weatherChart");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Analyzing your health and weather data...";

  const payload = {
    temp: parseFloat(document.getElementById("temp").value),
    symptoms: document.getElementById("symptoms").value
      ? document
          .getElementById("symptoms")
          .value.split(",")
          .map((s) => s.trim())
      : [],
    other: document.getElementById("other").value,
    city: document.getElementById("city").value.trim(),
    date: document.getElementById("date").value,
  };

  try {
    const response = await fetch("http://127.0.0.1:8000/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // ============================
    // Show AI Recommendation
    // ============================
    resultCard.classList.remove("hidden");
    recommendationText.innerHTML = ""; // Clear old content

    const text = data.recommendation || "No response from AI.";

    // Split text by ** markers and display as grouped sections
    const parts = text.split(/\*\*(.*?)\*\*/g).map((p) => p.trim()).filter((p) => p);
    for (let i = 0; i < parts.length; i += 2) {
      const title = parts[i];
      const content = parts[i + 1] ? parts[i + 1].replace(/^[:\-]\s*/, "") : "";

      const messageDiv = document.createElement("div");
      messageDiv.classList.add("chat-message");
      messageDiv.innerHTML = `
        <strong>${title}</strong><br>
        <span>${content}</span>
      `;

      setTimeout(() => {
        recommendationText.appendChild(messageDiv);
      }, i * 400);
    }

    // ============================
    // Show forecast details
    // ============================
    forecastDetails.textContent = `📍 Destination: ${data.city}
🗓️ Date: ${data.date}
🌡️ Forecast: ${data.forecast.min}°C – ${data.forecast.max}°C, ${data.forecast.description}`;

    // ============================
    // Weather Forecast Graph (±3 days)
    // ============================
    if (data.forecastGraph && Array.isArray(data.forecastGraph)) {
      weatherChart.classList.remove("hidden");

      const labels = data.forecastGraph.map((d) => d.date);
      const temps = data.forecastGraph.map((d) => d.temp);

      // Destroy old chart if exists
      if (window.weatherChartInstance) {
        window.weatherChartInstance.destroy();
      }

      const ctx = weatherChart.getContext("2d");
      window.weatherChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Temperature (°C)",
              data: temps,
              borderColor: "#2563eb",
              backgroundColor: "rgba(37, 99, 235, 0.2)",
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: "#1e3a8a",
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: "7-Day Temperature Forecast",
              color: "#333",
              font: { size: 16, weight: "bold" },
            },
          },
          scales: {
            y: {
              beginAtZero: false,
              title: { display: true, text: "°C" },
            },
            x: {
              title: { display: true, text: "Date" },
            },
          },
        },
      });
    } else {
      // Hide chart if no data
      weatherChart.classList.add("hidden");
    }
  } catch (err) {
    resultCard.classList.remove("hidden");
    recommendationText.textContent = `❌ Error: ${err.message}`;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Check Recommendation";
  }
});

// ============================
// Smooth scroll for nav links
// ============================
document.querySelectorAll('.nav-links a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth",
    });
  });
});

// ============================
// Typewriter animation (optional)
// ============================
function typeWriter(element, text, speed = 30) {
  let i = 0;
  function typing() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }
  typing();
}
