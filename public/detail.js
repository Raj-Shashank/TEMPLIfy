// detail.js - Dynamically renders template details in detail.html
// Assumes API endpoint: /api/templates/:id

document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("template-detail-container");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    container.innerHTML =
      '<div class="text-center py-5">No template selected.</div>';
    return;
  }

  container.innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div><p>Loading Template Details...</p></div>';

  try {
    const res = await fetch(`http://localhost:3000/api/templates/${id}`);
    if (!res.ok) throw new Error("Not found");
    const template = await res.json();
    renderTemplateDetail(template, container);
    // Animate features list like the static page
    setTimeout(() => {
      const featureItems = document.querySelectorAll(".feature-list li");
      featureItems.forEach((item, index) => {
        item.style.opacity = 0;
        item.style.transform = "translateX(-20px)";
        item.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        setTimeout(() => {
          item.style.opacity = 1;
          item.style.transform = "translateX(0)";
        }, 100 + index * 100);
      });
    }, 100);
  } catch (err) {
    container.innerHTML =
      '<div class="text-center py-5"><div class="alert alert-danger">Failed to load template details.</div></div>';
  }
});

function renderTemplateDetail(template, container) {
  // Features and tags
  const features = Array.isArray(template.features)
    ? template.features
    : template.features
    ? template.features.split(/,|\n/)
    : [];
  const tags = Array.isArray(template.tags)
    ? template.tags
    : template.tags
    ? template.tags.split(/,|\n/)
    : [];

  // Clean price display logic (single block)
  let priceHtml = "";
  if (template.isFree) {
    priceHtml = "FREE";
  } else if (
    typeof template.discountedPrice !== "undefined" &&
    template.discountedPrice !== null &&
    template.discountedPrice !== "" &&
    Number(template.discountedPrice) < Number(template.price)
  ) {
    priceHtml =
      '<span class="original-price" style="text-decoration:line-through;color:#888;font-size:1.2rem;margin-right:10px;">&#8377;' +
      template.price +
      '</span> <span class="discounted-price" style="color:#2563eb;font-size:2.2rem;font-weight:700;">&#8377;' +
      template.discountedPrice +
      "</span>";
  } else {
    priceHtml = "&#8377;" + template.price;
  }

  container.innerHTML = `
    <div class="template-detail-header">
      <div>
        <h2 class="template-detail-title">${template.name || "Template"}</h2>
        <div class="template-detail-meta">
          <div class="template-meta-item">
            <i class="fas fa-tag"></i>
            <span>${template.category || "-"}</span>
          </div>
          <div class="template-meta-item">
            <i class="fas fa-star"></i>
            <span>${(template.rating || 4.5).toFixed(1)} (${
    template.reviews || 0
  } Reviews)</span>
          </div>
        </div>
        <div>
          ${tags
            .map((tag) => `<span class="tag">${tag.trim()}</span>`)
            .join("")}
        </div>
      </div>
      <div class="close-detail-page" onclick="window.history.back()">
        <i class="fas fa-times"></i>
      </div>
    </div>
    <div class="template-detail-body">
      <div class="template-hero-image">
        <img src="${
          template.previewUrl ||
          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
        }" alt="${template.name || "Template"}">
      </div>
      <div class="template-description">
        <h3>About This Template</h3>
        <p>${template.description || "No description provided."}</p>
      </div>
      <div class="template-features">
        <h3>Key Features</h3>
        <ul class="feature-list">
          ${features.map((f) => `<li>${f.trim()}</li>`).join("")}
        </ul>
      </div>
      <div class="purchase-container">
        <div class="template-price">${priceHtml}</div>
        <ul class="template-details-list">
          <li><span>Category:</span><span>${
            template.category || "-"
          }</span></li>
          <li><span>Layout:</span><span>${template.layout || "-"}</span></li>
          <li><span>Framework:</span><span>${
            template.framework || "-"
          }</span></li>
          <li><span>Files Included:</span><span>${
            template.filesIncluded || "-"
          }</span></li>
          <li><span>Support:</span><span>${template.support || "-"}</span></li>
        </ul>
        <div class="template-actions">
          ${
            template.livePreviewUrl
              ? `<a href="${template.livePreviewUrl}" class="btn btn-demo" target="_blank"><i class="fas fa-eye"></i> Live Preview</a>`
              : ""
          }
          ${
            template.isFree
              ? `<a href="payment.html?id=${
                  template._id
                }&name=${encodeURIComponent(
                  template.name
                )}&price=0&free=true" class="btn btn-purchase"><i class="fas fa-download"></i> Download</a>`
              : `<a href="payment.html?id=${
                  template._id
                }&name=${encodeURIComponent(template.name)}&price=${
                  template.discountedPrice &&
                  Number(template.discountedPrice) < Number(template.price)
                    ? template.discountedPrice
                    : template.price
                }&originalPrice=${
                  template.price
                }" class="btn btn-purchase"><i class="fas fa-shopping-cart"></i> Purchase Now</a>`
          }
        </div>
      </div>
    </div>
    <div class="template-footer">
      <p>© 2025 TEMPLIfy. All rights reserved.</p>
    </div>
  `;
}
