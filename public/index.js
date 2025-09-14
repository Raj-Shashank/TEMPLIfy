document.addEventListener("DOMContentLoaded", async function () {
  //const API_BASE_URL = "https://templify-zhhw.onrender.com";
  const API_BASE_URL = "http://localhost:3000";

  // Function to generate star rating HTML
  function generateStarRating(rating) {
    let starsHtml = '';
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
        
        // Mark some templates as free (for demonstration)
        // In a real scenario, this would come from the backend
        const templatesWithFree = newestTemplates.map((template, index) => {
          // Make first and third templates free for demonstration
          if (index === 0 || index === 2) {
            return {
              ...template,
              isFree: true,
              originalPrice: template.price,
              price: 0,
              rating: 4.5 // Add rating for demonstration
            };
          }
          return {
            ...template,
            isFree: false,
            rating: 4.2 + Math.random() * 0.8 // Random rating between 4.2 and 5.0
          };
        });
        
        productsGrid.innerHTML = templatesWithFree.map((template, idx) => `
          <div class="product-card">
            <div class="product-image" style="background-image: url('${template.previewUrl || "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1674&q=80"}')">
              ${template.status === "active" ? `<span class="product-badge ${template.isFree ? 'free-badge' : ''}">${template.isFree ? 'Free' : 'Active'}</span>` : ""}
              <div class="product-overlay">
                <button class="preview-btn" data-preview="${template.livePreviewUrl ? template.livePreviewUrl : template.previewUrl || "#"}">
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
                <span class="rating-count">${(template.rating || 4.5).toFixed(1)}</span>
              </div>
              
              <div class="product-footer">
                <div class="price-container">
                  ${template.isFree ? 
                    `<span class="original-price">₹${template.originalPrice || '999'}</span>
                      <span class="product-price free-price">FREE</span>` : 
                    `<span class="product-price">₹${template.price}</span>`
                  }
                </div>
                <div class="product-actions">
                  <button class="view-details-btn" data-id="${template._id}">
                    <i class="fas fa-info-circle"></i> Details
                  </button>
                  <button class="buy-button ${template.isFree ? 'free-button' : ''}" 
                    data-id="${template._id}"
                    data-price="${template.price}"
                    data-name="${template.name}">
                    <i class="fas ${template.isFree ? 'fa-download' : 'fa-shopping-cart'}"></i> 
                    ${template.isFree ? 'Download' : 'Get Template'}
                  </button>
                </div>
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
        
        // If free template, handle differently
        if (templatePrice == 0) {
          // For free templates, redirect to detail page or handle download
          window.location.href = `detail.html?id=${templateId}&free=true`;
        } else {
          window.location.href = `payment.html?id=${templateId}&price=${templatePrice}&name=${encodeURIComponent(templateName)}`;
        }
      }
      
      // Handle view details button click
      if (e.target.classList.contains("view-details-btn")) {
        const templateId = e.target.getAttribute("data-id");
        window.location.href = `detail.html?id=${templateId}`;
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