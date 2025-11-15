// Razorpay key (replace with your real key)
const RAZORPAY_KEY_ID = "rzp_live_sx5YOFYvieWsEx";
const API_URL = "https://templify-zhhw.onrender.com/api/templates";

// Store templates globally for filtering
let allTemplates = [];

// Parent Category Configuration
const parentCategories = {
    "HTML Website": ["Portfolio", "Business", "E-commerce", "Blog", "Landing Page", "Dashboard", "Agency", "Restaurant"],
    "Sheet Template": ["Budget", "Inventory", "Project Management", "Schedule", "Finance", "HR", "Analytics", "Tracker"],
    "Notion Template": ["Productivity", "Education", "Personal", "Work", "Planning", "Database", "Creative", "Health"],
    "Resume": ["Modern", "Creative", "Professional", "Executive", "Minimalist", "Academic", "Tech", "Design"]
};

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

    // Use templates as received from backend (isFree is real)
    grid.innerHTML = templates
        .map((template) => {
            let priceHtml = "";
            if (template.isFree) {
                priceHtml = `<span class="original-price">₹${
                    template.originalPrice || template.price || "999"
                }</span> <span class="product-price free-price">FREE</span>`;
            } else if (
                template.discountedPrice !== undefined &&
                template.discountedPrice !== null &&
                template.discountedPrice !== "" &&
                Number(template.discountedPrice) < Number(template.price)
            ) {
                priceHtml = `<span class="original-price">₹${template.price}</span> <span class="product-price discounted">₹${template.discountedPrice}</span>`;
            } else {
                priceHtml = `<span class="product-price">₹${template.price}</span>`;
            }
            
            // Find parent category for this template
            let parentCategory = "HTML Website"; // Default
            for (const parent in parentCategories) {
                if (parentCategories[parent].includes(template.category)) {
                    parentCategory = parent;
                    break;
                }
            }

            return `
                <div class="product-card" data-category="${template.category}" data-parent-category="${parentCategory}">
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
                            <span class="rating-count">${(template.rating || 4.5).toFixed(1)}</span>
                        </div>
                        <div class="product-footer">
                            <div class="price-container">
                                ${priceHtml}
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
            `;
        })
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
            (t) => (t.status || "").toLowerCase() === "active"
        );
        renderTemplates(allTemplates);
        // Also fetch in background to update cache for next time
        fetch(API_URL)
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
        const res = await fetch(API_URL);
        let templates = await res.json();
        // Only show templates with status 'active' (case-insensitive)
        allTemplates = templates.filter(
            (t) => (t.status || "").toLowerCase() === "active"
        );
        renderTemplates(allTemplates);
        // Save to cache
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(templates));
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}
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

// Filter templates by parent category
function filterTemplatesByParent(parentCategory) {
    if (parentCategory === "all") {
        renderTemplates(allTemplates);
        return;
    }

    const filtered = allTemplates.filter(template => {
        for (const parent in parentCategories) {
            if (parent === parentCategory && parentCategories[parent].includes(template.category)) {
                return true;
            }
        }
        return false;
    });
    renderTemplates(filtered);
}

// Filter templates by subcategory
function filterTemplatesBySubcategory(subcategory) {
    if (subcategory === "all") {
        renderTemplates(allTemplates);
        return;
    }

    const filtered = allTemplates.filter(
        t => t.category && t.category.toLowerCase() === subcategory.toLowerCase()
    );
    renderTemplates(filtered);
}

// Initialize parent category system
function initParentCategories() {
    const parentCategoryBtns = document.querySelectorAll('.parent-category-btn');
    const subcategoryContainers = document.querySelectorAll('.subcategory-container');
    const filterBar = document.querySelector('.filter-bar');
    
    // Hide all subcategory containers initially
    subcategoryContainers.forEach(container => {
        container.classList.remove('active');
    });
    
    // Parent category button click handler
    parentCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parentCategory = this.dataset.parent;
            
            // Remove active class from all parent buttons
            parentCategoryBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all subcategory containers
            subcategoryContainers.forEach(container => {
                container.classList.remove('active');
            });
            
            // Reset all subcategory buttons
            document.querySelectorAll('.subcategory-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Reset filter bar buttons
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
            });
            filterBtns[0].classList.add('active'); // Activate "All Templates" in filter bar
            
            // If "All Templates" is selected, show original filter bar and all templates
            if (parentCategory === 'all') {
                filterBar.style.display = 'flex';
                renderTemplates(allTemplates);
            } else {
                // Show the corresponding subcategory container
                const subcategoryContainer = document.getElementById(`${parentCategory}-subcategories`);
                if (subcategoryContainer) {
                    subcategoryContainer.classList.add('active');
                }
                
                // Hide original filter bar
                filterBar.style.display = 'none';
                
                // Filter templates based on parent category
                filterTemplatesByParent(parentCategory);
            }
        });
    });
    
    // Subcategory button click handler
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('subcategory-btn')) {
            const subcategory = e.target.dataset.category;
            const container = e.target.closest('.subcategory-container');
            
            // Remove active class from all subcategory buttons in the same container
            container.querySelectorAll('.subcategory-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // Add active class to clicked button
            e.target.classList.add('active');
            
            // Filter templates based on subcategory
            filterTemplatesBySubcategory(subcategory);
        }
    });
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
    initParentCategories();
    initFilters();
    initEventListeners();
});