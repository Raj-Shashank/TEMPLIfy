// Razorpay key (replace with your real key)
const RAZORPAY_KEY_ID = "rzp_live_sx5YOFYvieWsEx";

// Fetch templates from backend and render dynamically
async function fetchAndRenderTemplates() {
  const grid = document.getElementById("all-templates");
  grid.innerHTML =
    '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch("https://templify-zhhw.onrender.com/api/templates");
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
                              template.livePreviewUrl
                                ? template.livePreviewUrl
                                : template.previewUrl || "#"
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

// Store templates globally for filtering
let allTemplates = [];

// Render templates to the grid, optionally filtered by category
function renderTemplates(templates) {
  const grid = document.getElementById("all-templates");
  if (!grid) return;
  if (!templates || templates.length === 0) {
    grid.innerHTML = '<div class="alert alert-info">No templates available.</div>';
    return;
  }
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
                      template.livePreviewUrl
                        ? template.livePreviewUrl
                        : template.previewUrl || "#"
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

// Fetch templates from backend and store globally
async function fetchAndRenderTemplates() {
  const grid = document.getElementById("all-templates");
  grid.innerHTML =
    '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
  try {
    const res = await fetch("https://templify-zhhw.onrender.com/api/templates");
    allTemplates = await res.json();
    renderTemplates(allTemplates);
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

// Filtering logic for filter-controls buttons
function initFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active from all, add to clicked
      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const filter = this.dataset.filter;
      if (!filter || filter === "all") {
        renderTemplates(allTemplates);
      } else {
        // Filter by category (case-insensitive)
        const filtered = allTemplates.filter((t) => {
          console.log(t.category, filter);
          return (
            t.category && t.category.toLowerCase() === filter.toLowerCase()
          );
        });
        renderTemplates(filtered);
      }
    });
  });
}

function initEventListeners() {
  // Handle buy button clicks
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("buy-button")) {
      const templateId = e.target.getAttribute("data-id");
      const templateName = e.target.getAttribute("data-name");
      const templatePrice = e.target.getAttribute("data-price");
      // Redirect to payment page with templateId, name, price
      window.location.href = `payment.html?id=${templateId}&name=${encodeURIComponent(
        templateName
      )}&price=${templatePrice}`;
      return;
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
