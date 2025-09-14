
// API Configuration
//const API_BASE_URL = "https://templify-zhhw.onrender.com/api";
const API_BASE_URL = "http://localhost:3000/api";

// Helper: Fetch wrapper
async function apiRequest(endpoint, options = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        ...options,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// DOM Elements
const sections = {
    dashboard: document.getElementById("dashboardSection"),
    templates: document.getElementById("templatesSection"),
    coupons: document.getElementById("couponsSection"),
    analytics: document.getElementById("analyticsSection"),
    payments: document.getElementById("paymentsSection"),
};

// Tab Navigation
document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        const tabId = e.target.id.replace("Tab", "");
        Object.values(sections).forEach(
            (section) => (section.style.display = "none")
        );
        sections[tabId].style.display = "block";

        // Update active tab
        document
            .querySelectorAll(".nav-link")
            .forEach((navLink) => navLink.classList.remove("active"));
        e.target.classList.add("active");

        // Load data when switching tabs
        if (tabId === "coupons") loadCoupons();
        if (tabId === "analytics") loadAnalytics();
        if (tabId === "payments") loadPayments();
    });
});

// Toggle Free/Paid Template
document.getElementById("templateIsFree").addEventListener("change", function() {
    const priceControl = document.getElementById("priceControl");
    const pricingLabel = document.getElementById("pricingLabel");
    
    if (this.checked) {
        pricingLabel.textContent = "Free";
        priceControl.style.opacity = "0.5";
        priceControl.style.pointerEvents = "none";
        document.getElementById("templatePrice").value = "0";
    } else {
        pricingLabel.textContent = "Paid";
        priceControl.style.opacity = "1";
        priceControl.style.pointerEvents = "auto";
        document.getElementById("templatePrice").value = "99";
    }
});

// Preview Image Upload (client-side preview only)
document
    .getElementById("templatePreview")
    .addEventListener("change", function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (event) {
                document.getElementById("previewImageContainer").innerHTML = `
                    <img src="${event.target.result}" class="img-thumbnail" alt="Preview">
                `;
            };
            reader.readAsDataURL(file);
        }
    });

// Save Template (with file upload)
document
    .getElementById("saveTemplateBtn")
    .addEventListener("click", async function () {
        const name = document.getElementById("templateName").value;
        const description = document.getElementById("templateDescription").value;
        const category = document.getElementById("templateCategory").value;
        const isFree = document.getElementById("templateIsFree").checked;
        const price = document.getElementById("templatePrice").value;
        const status = document.getElementById("templateStatus").value;
        const tags = document.getElementById("templateTags").value;
        const templateFile = document.getElementById("templateFile").files[0];
        const previewFile = document.getElementById("templatePreview").files[0];
        const livePreviewUrl = document.getElementById(
            "templateLivePreviewUrl"
        ).value;
        const features = document.getElementById("templateFeatures").value;
        const requirements = document.getElementById("templateRequirements").value;
        const instructions = document.getElementById("templateInstructions").value;

        if (
            !name ||
            !description ||
            !category ||
            !templateFile ||
            !previewFile
        ) {
            alert("Please fill all required fields and upload both files!");
            return;
        }

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("isFree", isFree);
            formData.append("price", price);
            formData.append("status", status);
            formData.append("tags", tags);
            formData.append("templateFile", templateFile);
            formData.append("previewFile", previewFile);
            formData.append("livePreviewUrl", livePreviewUrl);
            formData.append("features", features);
            formData.append("requirements", requirements);
            formData.append("instructions", instructions);

            const res = await fetch(`${API_BASE_URL}/templates/upload`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error(await res.text());
            alert("Template added successfully!");
            bootstrap.Modal.getInstance(
                document.getElementById("addTemplateModal")
            ).hide();
            document.getElementById("templateForm").reset();
            document.getElementById("previewImageContainer").innerHTML = "";
            loadTemplates();
        } catch (error) {
            console.error("Error adding template:", error);
            alert("Error adding template. Check console for details.");
        }
    });

// Save Coupon
document
    .getElementById("saveCouponBtn")
    .addEventListener("click", async function () {
        const code = document.getElementById("couponCode").value;
        const discount = document.getElementById("couponDiscount").value;
        const type = document.getElementById("couponType").value;
        const maxUsage = document.getElementById("couponMaxUsage").value;
        const validUntil = document.getElementById("couponValidUntil").value;
        const status = document.getElementById("couponStatus").value;

        if (!code || !discount || !maxUsage || !validUntil) {
            alert("Please fill all required fields!");
            return;
        }

        try {
            const couponData = {
                code,
                discount: parseInt(discount),
                type,
                maxUsage: parseInt(maxUsage),
                validUntil,
                status
            };

            const res = await fetch(`${API_BASE_URL}/coupons`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(couponData),
            });
            
            if (!res.ok) throw new Error(await res.text());
            alert("Coupon added successfully!");
            bootstrap.Modal.getInstance(
                document.getElementById("addCouponModal")
            ).hide();
            document.getElementById("couponForm").reset();
            loadCoupons();
        } catch (error) {
            console.error("Error adding coupon:", error);
            alert("Error adding coupon. Check console for details.");
        }
    });

// Load Templates (fetch from backend)
async function loadTemplates() {
    const container = document.getElementById("templatesContainer");
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading templates...</span>
            </div>
            <p class="mt-3">Loading templates from backend...</p>
        </div>
    `;

    // Apply status filter
    const statusFilter = document.getElementById("statusFilter").value;
    // Apply pricing filter
    const pricingFilter = document.getElementById("pricingFilter").value;
    // Apply search
    const searchTerm = document
        .getElementById("templateSearch")
        .value.toLowerCase();

    try {
        let url = "/templates";
        const params = [];
        if (statusFilter !== "all") params.push(`status=${statusFilter}`);
        if (pricingFilter !== "all") params.push(`pricing=${pricingFilter}`);
        if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
        if (params.length) url += `?${params.join("&")}`;
        
        const templates = await apiRequest(url);
        
        container.innerHTML = "";
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h5>No templates found</h5>
                    <p class="text-muted">Try adjusting your search or filter criteria</p>
                </div>
            `;
            return;
        }
        
        templates.forEach((template) => {
            // Determine badge color based on status
            let badgeClass = "badge-draft";
            if (template.status === "active") badgeClass = "badge-active";
            if (template.status === "archived") badgeClass = "badge-archived";
            
            // Add free badge if template is free
            const freeBadge = template.isFree ? '<span class="badge badge-free ms-2">Free</span>' : '';
            
            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card template-card h-100">
                        <img src="${template.previewUrl || 'https://via.placeholder.com/800x600/f8f9fc/5e6278?text=Template+Preview'}" 
                                class="card-img-top" 
                                alt="${template.name}" 
                                style="height: 180px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${template.name}${freeBadge}</h5>
                            <p class="card-text text-muted">${template.description.substring(0, 60)}...</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="badge ${badgeClass}">${template.status}</span>
                                <span class="text-primary fw-bold">${template.isFree ? 'FREE' : '₹' + template.price}</span>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${template._id}">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-info ms-1 details-btn" data-id="${template._id}">
                                <i class="fas fa-info-circle"></i> Details
                            </button>
                            <button class="btn btn-sm btn-outline-danger float-end delete-btn" data-id="${template._id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", () => editTemplate(btn.dataset.id));
        });
        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", () => deleteTemplate(btn.dataset.id));
        });
        document.querySelectorAll(".details-btn").forEach((btn) => {
            btn.addEventListener("click", () => showTemplateDetails(btn.dataset.id));
        });
        
        updateTemplateCounts();
    } catch (error) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Failed to load templates. Please try again later.
                </div>
            </div>
        `;
        console.error("Error loading templates:", error);
    }
}

// Load Coupons
async function loadCoupons() {
    const tableBody = document.getElementById("couponsTable");
    tableBody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading coupons...</span>
                </div>
                <p class="mt-3">Loading coupon records...</p>
            </td>
        </tr>
    `;

    try {
        const coupons = await apiRequest("/coupons");
        
        tableBody.innerHTML = "";
        
        if (coupons.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <i class="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                        <h5>No coupons found</h5>
                        <p class="text-muted">Create your first coupon to get started</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        coupons.forEach((coupon) => {
            const statusClass = coupon.status === 'active' ? 'badge bg-success' : 
                                coupon.status === 'expired' ? 'badge bg-danger' : 'badge bg-secondary';
            
            tableBody.innerHTML += `
                <tr>
                    <td><span class="coupon-badge">${coupon.code}</span></td>
                    <td>${coupon.type === 'percentage' ? coupon.discount + '%' : '₹' + coupon.discount}</td>
                    <td>${coupon.type}</td>
                    <td>${coupon.maxUsage}</td>
                    <td>${coupon.usedCount || 0}</td>
                    <td>${new Date(coupon.validUntil).toLocaleDateString()}</td>
                    <td><span class="${statusClass}">${coupon.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-coupon-btn" data-id="${coupon._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-1 delete-coupon-btn" data-id="${coupon._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll(".edit-coupon-btn").forEach((btn) => {
            btn.addEventListener("click", () => editCoupon(btn.dataset.id));
        });
        document.querySelectorAll(".delete-coupon-btn").forEach((btn) => {
            btn.addEventListener("click", () => deleteCoupon(btn.dataset.id));
        });
        
    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load coupons. Please try again later.
                    </div>
                </td>
            </tr>
        `;
        console.error("Error loading coupons:", error);
    }
}

// Show Template Details
async function showTemplateDetails(templateId) {
    // Fetch template data
    let template;
    try {
        template = await apiRequest(`/templates/${templateId}`);
    } catch (err) {
        alert("Failed to load template data");
        return;
    }

    // Build modal HTML
    const modal = document.getElementById("editTemplateModal");
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Template Details: ${template.name}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Template Name</label>
                                <p>${template.name}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Description</label>
                                <p>${template.description}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Category</label>
                                <p>${template.category}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Pricing</label>
                                <p>${template.isFree ? 'FREE' : '₹' + template.price}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Status</label>
                                <p><span class="badge ${template.status === 'active' ? 'badge-active' : template.status === 'draft' ? 'badge-draft' : 'badge-archived'}">${template.status}</span></p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Tags</label>
                                <p>${template.tags ? template.tags.join(', ') : 'No tags'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Live Preview URL</label>
                                <p>${template.livePreviewUrl || 'Not provided'}</p>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Preview Image</label>
                                <div class="mt-2 text-center">
                                    <img src="${template.previewUrl || 'https://via.placeholder.com/300x200/f8f9fc/5e6278?text=No+Preview'}" class="img-thumbnail" style="max-width:200px;">
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h6>Detailed Information</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Key Features</label>
                                    <ul class="feature-list">
                                        ${template.features && template.features.length > 0 ? 
                                            template.features.map(feature => `<li>${feature}</li>`).join('') : 
                                            '<li>No features specified</li>'}
                                    </ul>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label fw-bold">Requirements</label>
                                    <ul class="feature-list">
                                        ${template.requirements && template.requirements.length > 0 ? 
                                            template.requirements.map(req => `<li>${req}</li>`).join('') : 
                                            '<li>No requirements specified</li>'}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-bold">Usage Instructions</label>
                            <p>${template.instructions || 'No instructions provided'}</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" class="btn btn-primary" onclick="editTemplate('${template._id}')">
                        <i class="fas fa-edit me-1"></i> Edit Template
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Edit Template
async function editTemplate(templateId) {
    // Fetch template data
    let template;
    try {
        template = await apiRequest(`/templates/${templateId}`);
    } catch (err) {
        alert("Failed to load template data");
        return;
    }

    // Build modal HTML
    const modal = document.getElementById("editTemplateModal");
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Template</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editTemplateForm">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="editTemplateName" class="form-label">Template Name*</label>
                                    <input type="text" class="form-control" id="editTemplateName" value="${template.name}" required>
                                </div>
                                <div class="mb-3">
                                    <label for="editTemplateDescription" class="form-label">Description*</label>
                                    <textarea class="form-control" id="editTemplateDescription" rows="3" required>${template.description}</textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="editTemplateCategory" class="form-label">Category*</label>
                                    <select class="form-select" id="editTemplateCategory" required>
                                        <option value="">Select...</option>
                                        <option${template.category === "Portfolio" ? " selected" : ""}>Portfolio</option>
                                        <option${template.category === "E-commerce" ? " selected" : ""}>E-commerce</option>
                                        <option${template.category === "Blog" ? " selected" : ""}>Blog</option>
                                        <option${template.category === "Landing Page" ? " selected" : ""}>Landing Page</option>
                                        <option${template.category === "Business" ? " selected" : ""}>Business</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Pricing Type</label>
                                    <div class="d-flex align-items-center">
                                        <label class="toggle-switch">
                                            <input type="checkbox" id="editTemplateIsFree" ${template.isFree ? "checked" : ""}>
                                            <span class="toggle-slider"></span>
                                        </label>
                                        <span class="form-check-label" id="editPricingLabel">${template.isFree ? "Free" : "Paid"}</span>
                                    </div>
                                </div>
                                <div class="mb-3 price-control" id="editPriceControl">
                                    <label for="editTemplatePrice" class="form-label">Price (₹)*</label>
                                    <input type="number" class="form-control" id="editTemplatePrice" min="0" value="${template.price}" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="editTemplateStatus" class="form-label">Status*</label>
                                    <select class="form-select" id="editTemplateStatus" required>
                                        <option value="draft"${template.status === "draft" ? " selected" : ""}>Draft</option>
                                        <option value="active"${template.status === "active" ? " selected" : ""}>Active</option>
                                        <option value="archived"${template.status === "archived" ? " selected" : ""}>Archived</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="editTemplateTags" class="form-label">Tags (comma separated)</label>
                                    <input type="text" class="form-control" id="editTemplateTags" value="${template.tags ? template.tags.join(", ") : ""}">
                                </div>
                                <div class="mb-3">
                                    <label for="editTemplateFile" class="form-label">Template File (ZIP)</label>
                                    <input class="form-control" type="file" id="editTemplateFile" accept=".zip">
                                    <small class="form-text text-muted">Leave blank to keep existing file.</small>
                                </div>
                                <div class="mb-3">
                                    <label for="editTemplatePreview" class="form-label">Preview Image</label>
                                    <input class="form-control" type="file" id="editTemplatePreview" accept="image/*">
                                    <div class="mt-2 text-center" id="editPreviewImageContainer">
                                        ${template.previewUrl ? `<img src="${template.previewUrl}" class="img-thumbnail" style="max-width:120px;">` : ""}
                                    </div>
                                    <small class="form-text text-muted">Leave blank to keep existing image.</small>
                                </div>
                                <div class="mb-3">
                                    <label for="editTemplateLivePreviewUrl" class="form-label">Live Preview URL</label>
                                    <input type="url" class="form-control" id="editTemplateLivePreviewUrl" value="${template.livePreviewUrl || ""}" placeholder="https://your-demo-link.com">
                                    <small class="form-text text-muted">Optional. If provided, the Live Preview button will open this link.</small>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Detailed Information Section -->
                        <div class="detail-section">
                            <h6>Detailed Information</h6>
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTemplateFeatures" class="form-label">Key Features (one per line)</label>
                                        <textarea class="form-control" id="editTemplateFeatures" rows="3" placeholder="Responsive design&#10;Clean code&#10;Easy to customize">${template.features ? template.features.join("\n") : ""}</textarea>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="editTemplateRequirements" class="form-label">Requirements (one per line)</label>
                                        <textarea class="form-control" id="editTemplateRequirements" rows="3" placeholder="WordPress 5.0+&#10;PHP 7.4+&#10;MySQL 5.6+">${template.requirements ? template.requirements.join("\n") : ""}</textarea>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="editTemplateInstructions" class="form-label">Usage Instructions</label>
                                <textarea class="form-control" id="editTemplateInstructions" rows="3" placeholder="Step-by-step instructions for using this template...">${template.instructions || ""}</textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="updateTemplateBtn">Update Template</button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Toggle Free/Paid for edit
    const isFreeCheckbox = document.getElementById("editTemplateIsFree");
    const priceControl = document.getElementById("editPriceControl");
    const pricingLabel = document.getElementById("editPricingLabel");
    
    if (template.isFree) {
        priceControl.style.opacity = "0.5";
        priceControl.style.pointerEvents = "none";
    }
    
    isFreeCheckbox.addEventListener("change", function() {
        if (this.checked) {
            pricingLabel.textContent = "Free";
            priceControl.style.opacity = "0.5";
            priceControl.style.pointerEvents = "none";
            document.getElementById("editTemplatePrice").value = "0";
        } else {
            pricingLabel.textContent = "Paid";
            priceControl.style.opacity = "1";
            priceControl.style.pointerEvents = "auto";
            document.getElementById("editTemplatePrice").value = template.price || "99";
        }
    });

    // Preview image update
    document
        .getElementById("editTemplatePreview")
        .addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    document.getElementById(
                        "editPreviewImageContainer"
                    ).innerHTML = `<img src="${event.target.result}" class="img-thumbnail" style="max-width:120px;">`;
                };
                reader.readAsDataURL(file);
            }
        });

    // Update button logic
    document.getElementById("updateTemplateBtn").onclick = async function () {
        const name = document.getElementById("editTemplateName").value;
        const description = document.getElementById(
            "editTemplateDescription"
        ).value;
        const category = document.getElementById("editTemplateCategory").value;
        const isFree = document.getElementById("editTemplateIsFree").checked;
        const price = document.getElementById("editTemplatePrice").value;
        const status = document.getElementById("editTemplateStatus").value;
        const tags = document.getElementById("editTemplateTags").value;
        const templateFile = document.getElementById("editTemplateFile").files[0];
        const previewFile = document.getElementById("editTemplatePreview").files[0];
        const livePreviewUrl = document.getElementById(
            "editTemplateLivePreviewUrl"
        ).value;
        const features = document.getElementById("editTemplateFeatures").value;
        const requirements = document.getElementById("editTemplateRequirements").value;
        const instructions = document.getElementById("editTemplateInstructions").value;
        
        if (!name || !description || !category) {
            alert("Please fill all required fields!");
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("isFree", isFree);
            formData.append("price", price);
            formData.append("status", status);
            formData.append("tags", tags);
            if (templateFile) formData.append("templateFile", templateFile);
            if (previewFile) formData.append("previewFile", previewFile);
            formData.append("livePreviewUrl", livePreviewUrl);
            formData.append("features", features);
            formData.append("requirements", requirements);
            formData.append("instructions", instructions);
            
            const res = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
                method: "PUT",
                body: formData,
            });
            
            if (!res.ok) throw new Error(await res.text());
            alert("Template updated successfully!");
            bsModal.hide();
            loadTemplates();
        } catch (error) {
            console.error("Error updating template:", error);
            alert("Error updating template. Check console for details.");
        }
    };
}

// Edit Coupon
async function editCoupon(couponId) {
    // Fetch coupon data
    let coupon;
    try {
        coupon = await apiRequest(`/coupons/${couponId}`);
    } catch (err) {
        alert("Failed to load coupon data");
        return;
    }

    // Build modal HTML
    const modal = document.getElementById("editCouponModal");
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Edit Coupon</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="editCouponForm">
                        <div class="mb-3">
                            <label for="editCouponCode" class="form-label">Coupon Code*</label>
                            <input type="text" class="form-control" id="editCouponCode" value="${coupon.code}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCouponDiscount" class="form-label">Discount Value*</label>
                            <input type="number" class="form-control" id="editCouponDiscount" min="0" value="${coupon.discount}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCouponType" class="form-label">Discount Type*</label>
                            <select class="form-select" id="editCouponType" required>
                                <option value="percentage" ${coupon.type === 'percentage' ? 'selected' : ''}>Percentage</option>
                                <option value="fixed" ${coupon.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="editCouponMaxUsage" class="form-label">Maximum Usage*</label>
                            <input type="number" class="form-control" id="editCouponMaxUsage" min="1" value="${coupon.maxUsage}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCouponValidUntil" class="form-label">Valid Until*</label>
                            <input type="date" class="form-control" id="editCouponValidUntil" value="${new Date(coupon.validUntil).toISOString().split('T')[0]}" required>
                        </div>
                        <div class="mb-3">
                            <label for="editCouponStatus" class="form-label">Status*</label>
                            <select class="form-select" id="editCouponStatus" required>
                                <option value="active" ${coupon.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${coupon.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="updateCouponBtn">Update Coupon</button>
                </div>
            </div>
        </div>
    `;
    
    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    // Update button logic
    document.getElementById("updateCouponBtn").onclick = async function () {
        const code = document.getElementById("editCouponCode").value;
        const discount = document.getElementById("editCouponDiscount").value;
        const type = document.getElementById("editCouponType").value;
        const maxUsage = document.getElementById("editCouponMaxUsage").value;
        const validUntil = document.getElementById("editCouponValidUntil").value;
        const status = document.getElementById("editCouponStatus").value;

        if (!code || !discount || !maxUsage || !validUntil) {
            alert("Please fill all required fields!");
            return;
        }

        try {
            const couponData = {
                code,
                discount: parseInt(discount),
                type,
                maxUsage: parseInt(maxUsage),
                validUntil,
                status
            };

            const res = await fetch(`${API_BASE_URL}/coupons/${couponId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(couponData),
            });
            
            if (!res.ok) throw new Error(await res.text());
            alert("Coupon updated successfully!");
            bsModal.hide();
            loadCoupons();
        } catch (error) {
            console.error("Error updating coupon:", error);
            alert("Error updating coupon. Check console for details.");
        }
    };
}

// Delete Template (using backend API)
async function deleteTemplate(templateId) {
    if (confirm("Are you sure you want to delete this template?")) {
        try {
            await apiRequest(`/templates/${templateId}`, { method: "DELETE" });
            alert("Template deleted successfully!");
            loadTemplates();
        } catch (error) {
            console.error("Error deleting template:", error);
            alert("Error deleting template. Check console for details.");
        }
    }
}

// Delete Coupon
async function deleteCoupon(couponId) {
    if (confirm("Are you sure you want to delete this coupon?")) {
        try {
            await apiRequest(`/coupons/${couponId}`, { method: "DELETE" });
            alert("Coupon deleted successfully!");
            loadCoupons();
        } catch (error) {
            console.error("Error deleting coupon:", error);
            alert("Error deleting coupon. Check console for details.");
        }
    }
}

// Update Template Counts (fetch from backend)
async function updateTemplateCounts() {
    try {
        const all = await apiRequest("/templates");
        document.getElementById("totalTemplates").textContent = all.length;
        
        const active = all.filter((t) => t.status === "active");
        document.getElementById("activeTemplates").textContent = active.length;
        
        // Calculate total revenue (simplified for demo)
        const paidTemplates = all.filter(t => !t.isFree);
        const totalRevenue = paidTemplates.reduce((sum, template) => sum + (template.price || 0), 0);
        document.getElementById("totalRevenue").textContent = `₹${totalRevenue.toLocaleString()}`;
        
        // Update trend indicators
        document.querySelectorAll('.stat-card .text-white-50').forEach(el => {
            el.innerHTML = '<i class="fas fa-arrow-up me-1"></i> Updated just now';
        });
        
    } catch (error) {
        document.getElementById("totalTemplates").textContent = "0";
        document.getElementById("activeTemplates").textContent = "0";
        document.getElementById("totalRevenue").textContent = "₹0";
        console.error("Error updating counts:", error);
    }
}

// Load Analytics (stubbed, replace with backend data as needed)
function loadAnalytics() {
    // Implement analytics charts
    const downloadsCtx = document
        .getElementById("downloadsChart")
        .getContext("2d");
    const popularCtx = document
        .getElementById("popularTemplatesChart")
        .getContext("2d");
    const revenueCtx = document
        .getElementById("revenueChart")
        .getContext("2d");
    const engagementCtx = document
        .getElementById("engagementChart")
        .getContext("2d");

    // Sample data - replace with actual data
    new Chart(downloadsCtx, {
        type: "line",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
                {
                    label: "Downloads",
                    data: [12, 19, 3, 5, 2, 3],
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    borderColor: "rgba(0, 123, 255, 1)",
                    borderWidth: 1,
                },
            ],
        },
    });

    new Chart(popularCtx, {
        type: "doughnut",
        data: {
            labels: ["Portfolio", "E-commerce", "Blog", "Landing", "Business"],
            datasets: [
                {
                    data: [12, 19, 3, 5],
                    backgroundColor: [
                        "rgba(255, 99, 132, 0.7)",
                        "rgba(54, 162, 235, 0.7)",
                        "rgba(255, 206, 86, 0.7)",
                        "rgba(75, 192, 192, 0.7)",
                    ],
                },
            ],
        },
    });
    
    new Chart(revenueCtx, {
        type: "bar",
        data: {
            labels: ["Q1", "Q2", "Q3", "Q4"],
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: [8500, 10500, 12000, 9500],
                    backgroundColor: "rgba(6, 214, 160, 0.7)",
                },
            ],
        },
    });
    
    new Chart(engagementCtx, {
        type: "radar",
        data: {
            labels: ["Visits", "Downloads", "Time on Site", "Purchases", "Reviews"],
            datasets: [
                {
                    label: "Engagement",
                    data: [85, 72, 90, 65, 78],
                    backgroundColor: "rgba(67, 97, 238, 0.2)",
                    borderColor: "rgba(67, 97, 238, 1)",
                },
            ],
        },
    });
}

// Load Payments (stubbed, replace with backend data as needed)
async function loadPayments() {
    // TODO: Replace with backend API call
    // Example: const payments = await apiRequest('/payments');
    // ...render payments table...
    
    // For now, show a loading message
    const tableBody = document.getElementById("paymentsTable");
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading payments...</span>
                </div>
                <p class="mt-3">Loading payment records...</p>
            </td>
        </tr>
    `;
    
    // Simulate API call delay
    setTimeout(() => {
        tableBody.innerHTML = `
            <tr>
                <td>#PAY-001</td>
                <td>Modern Portfolio</td>
                <td>john@example.com</td>
                <td>₹1,299</td>
                <td>Aug 14, 2025</td>
                <td><span class="badge bg-success">Completed</span></td>
            </tr>
            <tr>
                <td>#PAY-002</td>
                <td>E-commerce Pro</td>
                <td>sarah@example.com</td>
                <td>₹2,499</td>
                <td>Aug 13, 2025</td>
                <td><span class="badge bg-success">Completed</span></td>
            </tr>
            <tr>
                <td>#PAY-003</td>
                <td>Minimal Blog</td>
                <td>mike@example.com</td>
                <td>₹899</td>
                <td>Aug 12, 2025</td>
                <td><span class="badge bg-warning text-dark">Pending</span></td>
            </tr>
            <tr>
                <td>#PAY-004</td>
                <td>Corporate Business</td>
                <td>emma@example.com</td>
                <td>₹1,799</td>
                <td>Aug 11, 2025</td>
                <td><span class="badge bg-success">Completed</span></td>
            </tr>
            <tr>
                <td>#PAY-005</td>
                <td>Restaurant Booking</td>
                <td>david@example.com</td>
                <td>₹1,499</td>
                <td>Aug 10, 2025</td>
                <td><span class="badge bg-danger">Failed</span></td>
            </tr>
        `;
    }, 1500);
}

// Initialize charts
function initCharts() {
    // Dashboard charts
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            datasets: [{
                label: 'Revenue (₹)',
                data: [8500, 12500, 9800, 15200, 11000, 18000, 14500, 24850],
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                tension: 0.3,
                fill: true
            }, {
                label: 'Downloads',
                data: [42, 58, 45, 72, 60, 85, 76, 98],
                borderColor: '#06d6a0',
                backgroundColor: 'rgba(6, 214, 160, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
    
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: ['Portfolio', 'E-commerce', 'Blog', 'Landing Page', 'Business', 'Other'],
            datasets: [{
                data: [35, 25, 20, 15, 5],
                backgroundColor: [
                    '#4361ee',
                    '#06d6a0',
                    '#ffd166',
                    '#ef476f',
                    '#7e8299'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    // Initialize charts
    initCharts();
    
    // Load initial data
    loadTemplates();
    updateTemplateCounts();

    // Search and filter events
    document
        .getElementById("searchButton")
        .addEventListener("click", loadTemplates);
    document.getElementById("templateSearch").addEventListener("keyup", (e) => {
        if (e.key === "Enter") loadTemplates();
    });
    document
        .getElementById("statusFilter")
        .addEventListener("change", loadTemplates);
    document
        .getElementById("pricingFilter")
        .addEventListener("change", loadTemplates);

    // Coupon search events
    document
        .getElementById("couponSearchButton")
        .addEventListener("click", loadCoupons);
    document.getElementById("couponSearch").addEventListener("keyup", (e) => {
        if (e.key === "Enter") loadCoupons();
    });
    document
        .getElementById("couponStatusFilter")
        .addEventListener("change", loadCoupons);

    // Auto-refresh templates every 30 seconds in admin panel
    setInterval(loadTemplates, 30000);
});