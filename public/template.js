// Store templates globally for filtering
let allTemplates = [];

// Parent Category Configuration with subcategories
const parentCategories = {
  "html-website": {
    name: "Web Templates",
    subcategories: [
      "portfolio",
      "business",
      "e-commerce",
      "blog",
      "landing page",
      "dashboard",
      "agency",
      "restaurant",
    ],
  },
  "sheet-template": {
    name: "Sheet Templates",
    subcategories: [
      "budget",
      "inventory",
      "project management",
      "schedule",
      "finance",
      "hr",
      "analytics",
      "tracker",
    ],
  },
  "notion-template": {
    name: "Notion",
    subcategories: [
      "productivity",
      "education",
      "personal",
      "work",
      "planning",
      "database",
      "creative",
      "health",
    ],
  },
  resume: {
    name: "Resumes",
    subcategories: [
      "modern",
      "creative",
      "professional",
      "executive",
      "minimalist",
      "academic",
      "tech",
      "design",
    ],
  },
};

// Get badge text based on template data
function getBadgeText(template) {
  if (template.isFree) return "FREE";
  if (template.badge) return template.badge.toUpperCase();
  if (template.popular) return "POPULAR";
  return "PREMIUM";
}

// Get badge class based on template data
function getBadgeClass(template) {
  if (template.isFree) return "free";
  if (template.badge && template.badge.toLowerCase().includes("new"))
    return "new";
  if (template.badge && template.badge.toLowerCase().includes("popular"))
    return "popular";
  return "premium";
}

// Render templates to the grid
function renderTemplates(templates) {
  const grid = document.getElementById("all-templates-grid");
  if (!grid) return;

  if (!templates || templates.length === 0) {
    grid.innerHTML =
      '<div class="text-center" style="grid-column: 1 / -1; padding: 40px; color: var(--text-medium);">No templates found in this category.</div>';
    return;
  }

  grid.innerHTML = templates
    .map((template) => {
      // Price HTML - Fixed spacing for free and discounted cards
      let priceHtml = "";
      if (template.isFree) {
        priceHtml = `
                        <div class="price-container">
                            <div class="price free" style="margin-bottom: 2px;">FREE</div>
                            ${template.price && template.price !== "0" ? `<div class="original-price">₹${template.price}</div>` : ""}
                        </div>
                    `;
      } else if (
        template.discountedPrice &&
        template.discountedPrice !== "" &&
        Number(template.discountedPrice) < Number(template.price)
      ) {
        priceHtml = `
                        <div class="price-container">
                            <div class="price" style="margin-bottom: 2px;">₹${template.discountedPrice}</div>
                            <div class="original-price">₹${template.price}</div>
                        </div>
                    `;
      } else {
        priceHtml = `<div class="price-container"><div class="price" style="margin-bottom: 2px;">₹${template.price}</div></div>`;
      }

      // Badge HTML
      const badgeClass = getBadgeClass(template);
      const badgeText = getBadgeText(template);

      // Check if preview URL exists
      const hasPreview =
        template.livePreviewUrl ||
        (template.previewUrl && template.previewUrl.trim() !== "");

      return `
                    <div class="product-card" data-category="${template.category || ""}">
                        <div class="product-image" style="background-image: url('${
                          template.previewUrl ||
                          "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1674&q=80"
                        }')">
                            <div class="product-badge ${badgeClass}">${badgeText}</div>
                            ${
                              hasPreview
                                ? `
                            <div class="product-overlay">
                                <button class="preview-btn" data-preview="${template.livePreviewUrl || template.previewUrl || "#"}" onclick="handlePreviewClick(event, '${template.livePreviewUrl || template.previewUrl || "#"}')">
                                    <i class="fas fa-eye"></i> Live Preview
                                </button>
                            </div>
                            `
                                : ""
                            }
                        </div>
                        <div class="product-info">
                            <h3 class="product-title">${template.name}</h3>
                            <p class="product-description">${template.description}</p>
                            <div class="product-footer">
                                ${priceHtml}
                                <div class="product-actions">
                                    <button class="action-btn details-btn" onclick="handleDetailsClick('${template._id}')">
                                        Details
                                    </button>
                                    <button class="action-btn buy-btn ${template.isFree ? "free" : ""}" 
                                        onclick="handleBuyClick('${template._id}', '${template.name.replace(/'/g, "\\'")}', '${template.price}', ${template.isFree})">
                                        ${template.isFree ? "Download" : "Get Now"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
    })
    .join("");
}

// Handle preview button clicks
function handlePreviewClick(event, previewUrl) {
  event.stopPropagation();
  event.preventDefault();

  if (previewUrl && previewUrl !== "#") {
    window.open(previewUrl, "_blank");
  }
}

// Handle details button click
function handleDetailsClick(templateId) {
  window.location.href = `detail.html?id=${templateId}`;
}

// Handle buy button click
function handleBuyClick(templateId, templateName, templatePrice, isFree) {
  if (isFree || templatePrice == 0) {
    window.location.href = `payment.html?id=${templateId}&name=${encodeURIComponent(templateName)}&price=0&free=true`;
  } else {
    window.location.href = `payment.html?id=${templateId}&name=${encodeURIComponent(templateName)}&price=${templatePrice}`;
  }
}

// Show subcategories for a parent category
function showSubcategories(parentCategory) {
  const subcategoryTabs = document.getElementById("subcategory-tabs");

  if (parentCategory === "all") {
    subcategoryTabs.classList.remove("active");
    subcategoryTabs.innerHTML = "";
    return;
  }

  const categoryData = parentCategories[parentCategory];
  if (!categoryData) {
    subcategoryTabs.classList.remove("active");
    subcategoryTabs.innerHTML = "";
    return;
  }

  // Create "All [Category]" button
  const allButton = `<button class="subcategory-tab active" data-parent="${parentCategory}" data-subcategory="all">All ${categoryData.name}</button>`;

  // Create subcategory buttons
  const subcategoryButtons = categoryData.subcategories
    .map(
      (subcat) =>
        `<button class="subcategory-tab" data-parent="${parentCategory}" data-subcategory="${subcat}">${subcat.charAt(0).toUpperCase() + subcat.slice(1)}</button>`,
    )
    .join("");

  subcategoryTabs.innerHTML = allButton + subcategoryButtons;
  subcategoryTabs.classList.add("active");

  // Add click event listeners to subcategory tabs
  document.querySelectorAll(".subcategory-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all subcategory tabs
      document.querySelectorAll(".subcategory-tab").forEach((t) => {
        t.classList.remove("active");
      });

      // Add active class to clicked tab
      this.classList.add("active");

      const parentCat = this.dataset.parent;
      const subcat = this.dataset.subcategory;

      filterTemplatesBySubcategory(parentCat, subcat);
    });
  });
}

// Filter templates by parent category and subcategory
function filterTemplatesByParentAndSubcategory(
  parentCategory,
  subcategory = "all",
) {
  if (parentCategory === "all") {
    renderTemplates(allTemplates);
    return;
  }

  const filtered = allTemplates.filter((template) => {
    const templateCategory = (template.category || "").toLowerCase();

    // Check if template belongs to the parent category
    for (const parent in parentCategories) {
      if (parent === parentCategory) {
        if (subcategory === "all") {
          // Return all templates in this parent category
          return parentCategories[parent].subcategories.some(
            (cat) => cat.toLowerCase() === templateCategory,
          );
        } else {
          // Return only templates in the specific subcategory
          return subcategory.toLowerCase() === templateCategory;
        }
      }
    }
    return false;
  });
  renderTemplates(filtered);
}

// Alias function for backward compatibility
function filterTemplatesByParent(parentCategory) {
  filterTemplatesByParentAndSubcategory(parentCategory, "all");
}

// New function to filter by subcategory
function filterTemplatesBySubcategory(parentCategory, subcategory) {
  filterTemplatesByParentAndSubcategory(parentCategory, subcategory);
}

// Fetch templates from backend
async function fetchAndRenderTemplates() {
  const grid = document.getElementById("all-templates-grid");
  grid.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading templates...</p>
            </div>
        `;

  const CACHE_KEY = "templify_templates_cache";
  const CACHE_TIME_KEY = "templify_templates_cache_time";
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Try to use cache first
  let useCache = false;
  let cachedTemplates = null;
  try {
    const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
    if (cacheTime && Date.now() - Number(cacheTime) < CACHE_DURATION) {
      const cacheData = localStorage.getItem(CACHE_KEY);
      if (cacheData) {
        cachedTemplates = JSON.parse(cacheData);
        useCache = true;
      }
    }
  } catch (e) {
    // Ignore cache errors
  }

  if (useCache && Array.isArray(cachedTemplates)) {
    allTemplates = cachedTemplates.filter(
      (t) => (t.status || "").toLowerCase() === "active",
    );
    renderTemplates(allTemplates);
    // Also fetch in background to update cache
    fetch("https://templify-zhhw.onrender.com/api/templates")
      .then((res) => res.json())
      .then((templates) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(templates));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      })
      .catch(() => {});
    return;
  }

  // No valid cache, fetch from API
  try {
    const res = await fetch("https://templify-zhhw.onrender.com/api/templates");
    let templates = await res.json();
    // Only show templates with status 'active'
    allTemplates = templates.filter(
      (t) => (t.status || "").toLowerCase() === "active",
    );
    renderTemplates(allTemplates);
    // Save to cache
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(templates));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {}
  } catch (err) {
    grid.innerHTML = `
                <div class="text-center" style="grid-column: 1 / -1; padding: 40px; color: #ef4444;">
                    Failed to load templates. Please try again later.
                </div>
            `;
    console.error("Error loading templates:", err);
  }
}

// Initialize category system
function initCategorySystem() {
  const categoryTabs = document.querySelectorAll(".category-tab");

  // Category tab click handler
  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", function (e) {
      e.stopPropagation();
      const parentCategory = this.dataset.parent;

      // Remove active class from all tabs
      categoryTabs.forEach((t) => t.classList.remove("active"));

      // Add active class to clicked tab
      this.classList.add("active");

      // Show/hide subcategories based on selected category
      showSubcategories(parentCategory);

      // Filter templates based on parent category
      filterTemplatesByParent(parentCategory);
    });
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderTemplates();
  initCategorySystem();
});
