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
// Backend logic (unchanged core, improved grouping)
// ============================
const form = document.getElementById("healthForm");
const resultCard = document.getElementById("result");
const recommendationText = document.getElementById("recommendationText");
const forecastDetails = document.getElementById("forecastDetails");
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

    // Show result card
    resultCard.classList.remove("hidden");
    recommendationText.innerHTML = ""; // Clear old content

    const text = data.recommendation || "No response from AI.";

    // 🔹 Split text by ** markers and group title + content
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

    // 🔹 Show forecast details
    forecastDetails.textContent = `📍 Destination: ${data.city}
🗓️ Date: ${data.date}
🌡️ Forecast: ${data.forecast.min}°C – ${data.forecast.max}°C, ${data.forecast.description}`;
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
