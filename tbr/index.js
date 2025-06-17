document.addEventListener("DOMContentLoaded", async function () {
  // Fetch templates from backend and render dynamically
  const productsGrid = document.querySelector(".products-grid");
  if (productsGrid) {
    productsGrid.innerHTML =
      '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    try {
      const res = await fetch("http://localhost:3000/api/templates");
      const templates = await res.json();
      if (templates.length === 0) {
        productsGrid.innerHTML =
          '<div class="alert alert-info">No templates available.</div>';
      } else {
        productsGrid.innerHTML = templates
          .map(
            (template, idx) => `
          <div class="product-card">
            <div class="product-image" style="background-image: url('${
              template.previewUrl ||
              "https://via.placeholder.com/600x400/2D2D2D/999?text=No+Preview"
            }')">
              ${
                template.status === "active"
                  ? '<span class="product-badge">Active</span>'
                  : ""
              }
            </div>
            <div class="product-info">
              <h3>${template.name}</h3>
              <p>${template.description}</p>
              <div class="product-footer">
                <span class="product-price">₹${template.price}</span>
                <button class="buy-button" 
                  data-product="${template._id}"
                  data-price="${template.price}"
                  data-name="${template.name}">Get Template</button>
              </div>
            </div>
          </div>
        `
          )
          .join("");
      }
    } catch (err) {
      productsGrid.innerHTML =
        '<div class="alert alert-danger">Failed to load templates.</div>';
    }
  }

  // Handle buy button clicks (re-bind after dynamic render)
  document.querySelectorAll(".products-grid").forEach((grid) => {
    grid.addEventListener("click", function (e) {
      if (e.target.classList.contains("buy-button")) {
        const productId = e.target.getAttribute("data-product");
        const productPrice = e.target.getAttribute("data-price");
        const productName = e.target.getAttribute("data-name");
        window.location.href = `payment.html?product=${productId}&price=${productPrice}&name=${encodeURIComponent(
          productName
        )}`;
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
});
