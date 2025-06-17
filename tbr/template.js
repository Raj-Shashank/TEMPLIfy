// Fetch templates from backend and render dynamically
async function fetchAndRenderTemplates() {
  const grid = document.getElementById("all-templates");
  grid.innerHTML =
    '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch("http://localhost:3000/api/templates");
    const templates = await res.json();
    if (templates.length === 0) {
      grid.innerHTML =
        '<div class="alert alert-info">No templates available.</div>';
    } else {
      grid.innerHTML = templates
        .map(
          (template) => `
                <div class="template-card" data-category="${template.category}">
                    ${
                      template.status === "active"
                        ? `<span class="template-badge">Active</span>`
                        : ""
                    }
                    <div class="template-image" style="background-image: url('${
                      template.previewUrl ||
                      "https://via.placeholder.com/600x400/2D2D2D/999?text=No+Preview"
                    }')">
                        <div class="template-overlay">
                            <button class="preview-btn" data-preview="${
                              template.previewUrl || "#"
                            }">Live Preview</button>
                        </div>
                    </div>
                    <div class="template-info">
                        <h3>${template.name}</h3>
                        <p>${template.description}</p>
                        <div class="template-footer">
                            <span class="template-price">₹${
                              template.price
                            }</span>
                            <button class="buy-button" 
                                    data-id="${template._id}"
                                    data-name="${template.name}"
                                    data-price="${template.price}"
                                    data-folder="${template._id}">
                                Get Template
                            </button>
                        </div>
                    </div>
                </div>
            `
        )
        .join("");
    }
  } catch (err) {
    grid.innerHTML =
      '<div class="alert alert-danger">Failed to load templates.</div>';
  }
}

// Main Functions
document.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderTemplates();
  initFilters();
  initEventListeners();
});

function initEventListeners() {
  // Handle buy button clicks
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("buy-button")) {
      const productData = {
        id: e.target.dataset.id,
        name: e.target.dataset.name,
        price: e.target.dataset.price,
        folder: e.target.dataset.folder,
      };

      // Store ALL data in localStorage
      localStorage.setItem("currentProduct", JSON.stringify(productData));

      // Redirect to payment page
      window.location.href = "payment.html";
    }

    // Handle preview buttons
    if (e.target.classList.contains("preview-btn")) {
      e.preventDefault();
      const url = e.target.dataset.preview;
      if (url && url !== "#") window.open(url, "_blank");
    }
  });
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });
}
