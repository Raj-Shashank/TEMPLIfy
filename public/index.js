document.addEventListener("DOMContentLoaded", async function () {
  const API_BASE_URL = "https://templify-zhhw.onrender.com";
  // Fetch templates from backend and render dynamically
  const productsGrid = document.querySelector(".products-grid");
  if (productsGrid) {
    // Show loading spinner while fetching
    productsGrid.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading premium templates...</p>
      </div>
    `;
    try {
      const res = await fetch(`${API_BASE_URL}/api/templates`);
      const templates = await res.json();
      if (templates.length === 0) {
        productsGrid.innerHTML = '<div class="text-center py-5">No templates available at the moment.</div>';
      } else {
        // Show only the newest 6 templates
        const newestTemplates = templates.slice(0, 6);
        productsGrid.innerHTML = newestTemplates.map((template, idx) => `
          <div class="product-card">
            <div class="product-image" style="background-image: url('${template.previewUrl || "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1674&q=80"}')">
              ${template.status === "active" ? '<span class="product-badge">Active</span>' : ""}
              <div class="product-overlay">
                <button class="preview-btn" data-preview="${template.livePreviewUrl ? template.livePreviewUrl : template.previewUrl || "#"}">
                  <i class="fas fa-eye"></i> Live Preview
                </button>
              </div>
            </div>
            <div class="product-info">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
              <div class="product-footer">
                <span class="product-price">₹${template.price}</span>
                <button class="buy-button" 
                  data-id="${template._id}"
                  data-price="${template.price}"
                  data-name="${template.name}">
                  <i class="fas fa-shopping-cart"></i> Get Template
                </button>
              </div>
            </div>
          </div>
        `).join("");
      }
    } catch (err) {
      productsGrid.innerHTML = '<div class="text-center py-5">Failed to load templates. Please try again later.</div>';
      console.error("Error loading templates:", err);
    }
  }

  // Handle buy button clicks (re-bind after dynamic render)
  document.querySelectorAll(".products-grid").forEach((grid) => {
    grid.addEventListener("click", function (e) {
      if (e.target.classList.contains("buy-button")) {
        const templateId = e.target.getAttribute("data-id");
        const templatePrice = e.target.getAttribute("data-price");
        const templateName = e.target.getAttribute("data-name");
        window.location.href = `payment.html?id=${templateId}&price=${templatePrice}&name=${encodeURIComponent(templateName)}`;
      }
      // Handle preview button click
      if (e.target.classList.contains("preview-btn")) {
        e.preventDefault();
        const url = e.target.dataset.preview;
        if (url && url !== "#") window.open(url, "_blank");
      }
    });
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    });
  });
  
  // Filter buttons functionality
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
    });
  });
});