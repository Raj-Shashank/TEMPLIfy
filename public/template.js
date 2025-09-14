// Razorpay key (replace with your real key)
const RAZORPAY_KEY_ID = "rzp_live_sx5YOFYvieWsEx";
//const API_URL = "https://templify-zhhw.onrender.com/api/templates";
const API_URL = "http://localhost:3000/api/templates";

// Store templates globally for filtering
let allTemplates = [];

// Function to generate star rating HTML
function generateStarRating(rating) {
  let starsHtml = "";
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }

  return starsHtml;
}

// Render templates to the grid, optionally filtered by category
function renderTemplates(templates) {
  const grid = document.getElementById("all-templates");
  if (!grid) return;

  if (!templates || templates.length === 0) {
    grid.innerHTML =
      '<div class="text-center py-5">No templates available at the moment.</div>';
    return;
  }

  // Mark some templates as free (for demonstration)
  // In a real scenario, this would come from the backend
  const templatesWithFree = templates.map((template, index) => {
    // Make first and third templates free for demonstration
    if (index === 0 || index === 2) {
      return {
        ...template,
        isFree: true,
        originalPrice: template.price,
        price: 0,
        rating: 4.5, // Add rating for demonstration
      };
    }
    return {
      ...template,
      isFree: false,
      rating: 4.2 + Math.random() * 0.8, // Random rating between 4.2 and 5.0
    };
  });

  grid.innerHTML = templatesWithFree
    .map(
      (template) => `
    <div class="product-card" data-category="${template.category}">
      <div class="product-image" style="background-image: url('${
        template.previewUrl ||
        "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1674&q=80"
      }')">
        ${
          template.status === "active"
            ? `<span class="product-badge ${
                template.isFree ? "free-badge" : ""
              }">${template.isFree ? "Free" : "Active"}</span>`
            : ""
        }
        <div class="product-overlay">
          <button class="preview-btn" data-preview="${
            template.livePreviewUrl
              ? template.livePreviewUrl
              : template.previewUrl || "#"
          }">
            <i class="fas fa-eye"></i> Live Preview
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3>${template.name}</h3>
        <p>${template.description}</p>
        
        <div class="product-rating">
          <div class="stars">
            ${generateStarRating(template.rating || 4.5)}
          </div>
          <span class="rating-count">${(template.rating || 4.5).toFixed(
            1
          )}</span>
        </div>
        
        <div class="product-footer">
          <div class="price-container">
            ${
              template.isFree
                ? `<span class="original-price">₹${
                    template.originalPrice || "999"
                  }</span>
                <span class="product-price free-price">FREE</span>`
                : `<span class="product-price">₹${template.price}</span>`
            }
          </div>
          <div class="product-actions">
            <button class="view-details-btn" data-id="${template._id}">
              <i class="fas fa-info-circle"></i> Details
            </button>
            <button class="buy-button ${template.isFree ? "free-button" : ""}" 
              data-id="${template._id}"
              data-name="${template.name}"
              data-price="${template.price}">
              <i class="fas ${
                template.isFree ? "fa-download" : "fa-shopping-cart"
              }"></i> 
              ${template.isFree ? "Download" : "Get Template"}
            </button>
          </div>
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
  grid.innerHTML = `
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>Loading Templates... Please wait for a while!</p>
    </div>
  `;

  try {
    const res = await fetch(API_URL);
    allTemplates = await res.json();
    renderTemplates(allTemplates);
  } catch (err) {
    grid.innerHTML = `
      <div class="text-center py-5">
        <div class="alert alert-danger">Failed to load templates. Please try again later.</div>
      </div>
    `;
    console.error("Error loading templates:", err);
  }
}

// Filter templates by category
function filterTemplates(category) {
  if (category === "all") {
    renderTemplates(allTemplates);
    return;
  }

  const filtered = allTemplates.filter(
    (t) => t.category && t.category.toLowerCase() === category.toLowerCase()
  );
  renderTemplates(filtered);
}

// Initialize filters
function initFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      // Remove active from all, add to clicked
      filterBtns.forEach((b) => b.classList.remove("active"));
      this.classList.add("active");
      const filter = this.dataset.filter;
      filterTemplates(filter);
    });
  });
}

// Initialize event listeners
function initEventListeners() {
  // Handle buy button clicks
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("buy-button")) {
      const templateId = e.target.getAttribute("data-id");
      const templateName = e.target.getAttribute("data-name");
      const templatePrice = e.target.getAttribute("data-price");
      // If free template, go to payment.html with free flag
      if (templatePrice == 0) {
        window.location.href = `payment.html?id=${templateId}&name=${encodeURIComponent(
          templateName
        )}&price=0&free=true`;
      } else {
        window.location.href = `payment.html?id=${templateId}&name=${encodeURIComponent(
          templateName
        )}&price=${templatePrice}`;
      }
      return;
    }

    // Handle view details button click
    if (e.target.classList.contains("view-details-btn")) {
      const templateId = e.target.getAttribute("data-id");
      window.location.href = `detail.html?id=${templateId}`;
    }

    // Handle preview buttons
    if (
      e.target.classList.contains("preview-btn") ||
      e.target.parentElement.classList.contains("preview-btn")
    ) {
      e.preventDefault();
      const btn = e.target.classList.contains("preview-btn")
        ? e.target
        : e.target.parentElement;
      const url = btn.dataset.preview;
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

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderTemplates();
  initFilters();
  initEventListeners();
});
