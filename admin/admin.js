
        // API Configuration
        const API_BASE_URL = "https://templify-zhhw.onrender.com/api";

        // Helper: Fetch wrapper
        async function apiRequest(endpoint, options = {}) {
            const res = await fetch(`${API_BASE_URL}${endpoint}`, {
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                ...options
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
            payments: document.getElementById("paymentsSection")
        };

        // Mobile Menu Toggle
        document.querySelector('.mobile-menu-toggle').addEventListener('click', function() {
            document.querySelector('.sidebar').classList.add('active');
            document.querySelector('.sidebar-overlay').classList.add('active');
        });

        document.querySelector('.sidebar-overlay').addEventListener('click', function() {
            document.querySelector('.sidebar').classList.remove('active');
            this.classList.remove('active');
        });

        // Tab Navigation
        document.querySelectorAll(".nav-link").forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const tabId = e.target.id.replace("Tab", "");
                
                // Hide all sections
                Object.values(sections).forEach(section => section.style.display = "none");
                
                // Show selected section
                sections[tabId].style.display = "block";

                // Update active tab
                document.querySelectorAll(".nav-link").forEach(navLink => navLink.classList.remove("active"));
                e.target.classList.add("active");

                // Close mobile menu
                if (window.innerWidth < 768) {
                    document.querySelector('.sidebar').classList.remove('active');
                    document.querySelector('.sidebar-overlay').classList.remove('active');
                }

                // Load data when switching tabs
                if (tabId === "coupons") loadCoupons();
                if (tabId === "analytics") loadAnalytics();
                if (tabId === "payments") loadPayments();
            });
        });

        // Character Counter for Description
        function setupDescriptionCounter() {
            const descriptionInput = document.getElementById("templateDescription");
            const counterElement = document.getElementById("templateDescriptionCounter");
            
            if (descriptionInput && counterElement) {
                // Update counter on input
                descriptionInput.addEventListener("input", function() {
                    const currentLength = this.value.length;
                    const maxLength = 75;
                    
                    counterElement.textContent = `${currentLength}/${maxLength}`;
                    
                    // Update counter color based on length
                    if (currentLength >= maxLength) {
                        counterElement.className = "char-counter limit-reached";
                    } else if (currentLength >= maxLength - 10) {
                        counterElement.className = "char-counter limit-warning";
                    } else {
                        counterElement.className = "char-counter within-limit";
                    }
                });
                
                // Initial update
                descriptionInput.dispatchEvent(new Event("input"));
            }
        }

        // Toggle Free/Paid Template
        document.getElementById("templateIsFree").addEventListener("change", function() {
            const priceControl = document.getElementById("priceControl");
            const pricingLabel = document.getElementById("pricingLabel");
            const priceInput = document.getElementById("templatePrice");

            if (this.checked) {
                pricingLabel.textContent = "Free";
                priceControl.style.opacity = "0.5";
                priceControl.style.pointerEvents = "none";
                priceInput.value = "0";
                priceInput.required = false;
            } else {
                pricingLabel.textContent = "Paid";
                priceControl.style.opacity = "1";
                priceControl.style.pointerEvents = "auto";
                priceInput.value = "99";
                priceInput.required = true;
            }
        });

        // Preview Image Upload
        document.getElementById("templatePreview").addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById("previewImageContainer").innerHTML = `
                        <img src="${event.target.result}" class="img-thumbnail w-100" style="max-height: 180px; object-fit: contain;">
                    `;
                };
                reader.readAsDataURL(file);
            }
        });

        // Save Template with all features
        document.getElementById("saveTemplateBtn").addEventListener("click", async function() {
            const formData = new FormData();
            
            // Collect basic form data
            formData.append("name", document.getElementById("templateName").value);
            formData.append("description", document.getElementById("templateDescription").value);
            formData.append("category", document.getElementById("templateCategory").value);
            formData.append("isFree", document.getElementById("templateIsFree").checked);
            formData.append("price", document.getElementById("templatePrice").value);
            formData.append("status", document.getElementById("templateStatus").value);
            formData.append("tags", document.getElementById("templateTags").value);
            
            // Validate description length
            const description = document.getElementById("templateDescription").value;
            if (description.length > 75) {
                alert("Description must be 75 characters or less!");
                return;
            }
            
            // Collect badges
            const selectedBadges = Array.from(document.querySelectorAll('input[name="templateBadge"]:checked'))
                .map(cb => cb.value);
            formData.append("badges", selectedBadges.join(','));
            
            // Collect playlists
            const selectedPlaylists = Array.from(document.querySelectorAll('input[name="templatePlaylist"]:checked'))
                .map(cb => cb.value);
            formData.append("playlists", selectedPlaylists.join(','));
            
            // Collect detailed information
            formData.append("discountedPrice", document.getElementById("templateDiscountedPrice").value || "");
            formData.append("layout", document.getElementById("templateLayout").value);
            formData.append("framework", document.getElementById("templateFramework").value);
            formData.append("livePreviewUrl", document.getElementById("templateLivePreviewUrl").value);
            formData.append("features", document.getElementById("templateFeatures").value);
            formData.append("requirements", document.getElementById("templateRequirements").value);
            formData.append("filesIncluded", document.getElementById("templateFilesIncluded").value);
            formData.append("support", document.getElementById("templateSupport").value);
            formData.append("browsers", document.getElementById("templateBrowsers").value);
            formData.append("lastUpdated", document.getElementById("templateLastUpdated").value);
            formData.append("instructions", document.getElementById("templateInstructions").value);
            
            const templateFile = document.getElementById("templateFile").files[0];
            const previewFile = document.getElementById("templatePreview").files[0];
            
            if (templateFile) formData.append("templateFile", templateFile);
            if (previewFile) formData.append("previewFile", previewFile);

            // Validate required fields
            if (!formData.get("name") || !formData.get("description") || !formData.get("category")) {
                alert("Please fill all required fields!");
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/templates/upload`, {
                    method: "POST",
                    body: formData
                });
                
                if (!res.ok) throw new Error(await res.text());
                
                alert("Template added successfully!");
                bootstrap.Modal.getInstance(document.getElementById("addTemplateModal")).hide();
                document.getElementById("templateForm").reset();
                document.getElementById("previewImageContainer").innerHTML = "";
                document.getElementById("templateDescriptionCounter").textContent = "0/75";
                document.getElementById("templateDescriptionCounter").className = "char-counter within-limit";
                loadTemplates();
            } catch (error) {
                console.error("Error adding template:", error);
                alert("Error adding template. Check console for details.");
            }
        });

        // Save Coupon
        document.getElementById("saveCouponBtn").addEventListener("click", async function() {
            const couponData = {
                code: document.getElementById("couponCode").value,
                discount: parseInt(document.getElementById("couponDiscount").value),
                type: document.getElementById("couponType").value,
                maxUsage: parseInt(document.getElementById("couponMaxUsage").value),
                validUntil: document.getElementById("couponValidUntil").value,
                status: document.getElementById("couponStatus").value
            };

            if (!couponData.code || !couponData.discount || !couponData.maxUsage || !couponData.validUntil) {
                alert("Please fill all required fields!");
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/coupons`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(couponData)
                });

                if (!res.ok) throw new Error(await res.text());
                
                alert("Coupon added successfully!");
                bootstrap.Modal.getInstance(document.getElementById("addCouponModal")).hide();
                document.getElementById("couponForm").reset();
                loadCoupons();
            } catch (error) {
                console.error("Error adding coupon:", error);
                alert("Error adding coupon. Check console for details.");
            }
        });

        // Load Templates
        async function loadTemplates() {
            const container = document.getElementById("templatesContainer");
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading templates...</span>
                    </div>
                    <p class="mt-3 text-muted">Loading templates...</p>
                </div>
            `;

            try {
                const statusFilter = document.getElementById("statusFilter").value;
                const searchTerm = document.getElementById("templateSearch").value.toLowerCase();
                
                let url = "/templates";
                const params = [];
                if (statusFilter !== "all") params.push(`status=${statusFilter}`);
                if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
                if (params.length) url += `?${params.join("&")}`;

                const templates = await apiRequest(url);

                container.innerHTML = "";

                if (templates.length === 0) {
                    container.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                            <h5>No templates found</h5>
                            <p class="text-muted">Try adjusting your search criteria</p>
                        </div>
                    `;
                    return;
                }

                templates.forEach(template => {
                    let statusBadgeClass = "badge-draft";
                    if (template.status === "active") statusBadgeClass = "badge-active";
                    if (template.status === "archived") statusBadgeClass = "badge-archived";

                    const freeBadge = template.isFree ? '<span class="badge badge-free ms-1">Free</span>' : '';
                    
                    // Generate badges HTML
                    let badgesHtml = '';
                    if (template.badges && template.badges.length > 0) {
                        template.badges.forEach(badge => {
                            let badgeClass = '';
                            switch(badge) {
                                case 'new': badgeClass = 'badge-new'; break;
                                case 'popular': badgeClass = 'badge-popular'; break;
                                case 'featured': badgeClass = 'badge-featured'; break;
                                case 'premium': badgeClass = 'badge-premium'; break;
                                case 'trending': badgeClass = 'badge-trending'; break;
                                default: badgeClass = 'badge-draft';
                            }
                            badgesHtml += `<span class="badge ${badgeClass} me-1">${badge}</span>`;
                        });
                    }
                    
                    // Generate playlists indicator
                    let playlistsIndicator = '';
                    if (template.playlists && template.playlists.length > 0) {
                        playlistsIndicator = `<div class="mt-2 small"><i class="fas fa-music text-muted me-1"></i>${template.playlists.length} playlist(s)</div>`;
                    }

                    container.innerHTML += `
                        <div class="col-md-4 mb-4">
                            <div class="card template-card h-100">
                                <img src="${template.previewUrl || 'https://via.placeholder.com/800x600/f8f9fc/5e6278?text=Template+Preview'}" 
                                     class="card-img-top" 
                                     alt="${template.name}">
                                <div class="card-body">
                                    <h5 class="card-title">${template.name}${freeBadge}</h5>
                                    <div class="mb-2">
                                        ${badgesHtml}
                                    </div>
                                    <p class="card-text">${template.description?.substring(0, 80) || 'No description'}...</p>
                                    ${playlistsIndicator}
                                    <div class="d-flex justify-content-between align-items-center mt-3">
                                        <span class="badge ${statusBadgeClass}">${template.status}</span>
                                        <span class="text-primary fw-bold">
                                            ${template.isFree ? 'FREE' : '₹' + template.price}
                                        </span>
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

                // Add event listeners
                document.querySelectorAll(".edit-btn").forEach(btn => {
                    btn.addEventListener("click", () => editTemplate(btn.dataset.id));
                });
                document.querySelectorAll(".delete-btn").forEach(btn => {
                    btn.addEventListener("click", () => deleteTemplate(btn.dataset.id));
                });
                document.querySelectorAll(".details-btn").forEach(btn => {
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
                        <p class="mt-3 text-muted">Loading coupons...</p>
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
                                <p class="text-muted">Create your first coupon</p>
                            </td>
                        </tr>
                    `;
                    return;
                }

                coupons.forEach(coupon => {
                    const statusClass = coupon.status === "active" ? "badge bg-success" :
                                       coupon.status === "expired" ? "badge bg-danger" : "badge bg-secondary";

                    tableBody.innerHTML += `
                        <tr>
                            <td><span class="coupon-badge">${coupon.code}</span></td>
                            <td>${coupon.type === "percentage" ? coupon.discount + "%" : "₹" + coupon.discount}</td>
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

                // Add event listeners
                document.querySelectorAll(".edit-coupon-btn").forEach(btn => {
                    btn.addEventListener("click", () => editCoupon(btn.dataset.id));
                });
                document.querySelectorAll(".delete-coupon-btn").forEach(btn => {
                    btn.addEventListener("click", () => deleteCoupon(btn.dataset.id));
                });
            } catch (error) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center py-4">
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                Failed to load coupons.
                            </div>
                        </td>
                    </tr>
                `;
                console.error("Error loading coupons:", error);
            }
        }

        // Show Template Details
        async function showTemplateDetails(templateId) {
            try {
                const template = await apiRequest(`/templates/${templateId}`);
                
                // Generate badges HTML
                let badgesHtml = '';
                if (template.badges && template.badges.length > 0) {
                    template.badges.forEach(badge => {
                        let badgeClass = '';
                        switch(badge) {
                            case 'new': badgeClass = 'badge-new'; break;
                            case 'popular': badgeClass = 'badge-popular'; break;
                            case 'featured': badgeClass = 'badge-featured'; break;
                            case 'premium': badgeClass = 'badge-premium'; break;
                            case 'trending': badgeClass = 'badge-trending'; break;
                            default: badgeClass = 'badge-draft';
                        }
                        badgesHtml += `<span class="badge ${badgeClass} me-1">${badge}</span>`;
                    });
                } else {
                    badgesHtml = '<span class="text-muted">No badges assigned</span>';
                }
                
                // Generate playlists HTML
                let playlistsHtml = '';
                if (template.playlists && template.playlists.length > 0) {
                    template.playlists.forEach(playlist => {
                        let playlistName = '';
                        switch(playlist) {
                            case 'premium_products': playlistName = 'Premium Products'; break;
                            case 'trending_now': playlistName = 'Trending Now'; break;
                            case 'best_sellers': playlistName = 'Best Sellers'; break;
                            case 'new_arrivals': playlistName = 'New Arrivals'; break;
                            case 'editor_picks': playlistName = 'Editor\'s Picks'; break;
                            default: playlistName = playlist;
                        }
                        playlistsHtml += `<li class="mb-1"><i class="fas fa-music text-muted me-2"></i>${playlistName}</li>`;
                    });
                } else {
                    playlistsHtml = '<li class="text-muted">Not added to any playlists</li>';
                }
                
                // Generate features list
                let featuresHtml = '';
                if (template.features && template.features.length > 0) {
                    template.features.forEach(feature => {
                        featuresHtml += `<li>${feature}</li>`;
                    });
                } else {
                    featuresHtml = '<li class="text-muted">No features specified</li>';
                }
                
                // Generate requirements list
                let requirementsHtml = '';
                if (template.requirements && template.requirements.length > 0) {
                    template.requirements.forEach(req => {
                        requirementsHtml += `<li>${req}</li>`;
                    });
                } else {
                    requirementsHtml = '<li class="text-muted">No requirements specified</li>';
                }
                
                const modal = document.getElementById("editTemplateModal");
                modal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Template Details: ${template.name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-4">
                                    <div class="col-md-8">
                                        <h6 class="fw-bold mb-2">Template Information</h6>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-2">
                                                    <strong>Name:</strong> ${template.name}
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Category:</strong> ${template.category}
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Status:</strong> 
                                                    <span class="badge ${template.status === 'active' ? 'badge-active' : template.status === 'draft' ? 'badge-draft' : 'badge-archived'}">
                                                        ${template.status}
                                                    </span>
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Price:</strong> ${template.isFree ? 'FREE' : '₹' + template.price}
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-2">
                                                    <strong>Layout:</strong> ${template.layout || 'Not specified'}
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Framework:</strong> ${template.framework || 'Not specified'}
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Last Updated:</strong> ${template.lastUpdated || 'Not specified'}
                                                </div>
                                                <div class="mb-2">
                                                    <strong>Files Included:</strong> ${template.filesIncluded || 'Not specified'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4 text-center">
                                        <img src="${template.previewUrl || 'https://via.placeholder.com/300x200'}" 
                                             class="img-thumbnail w-100 mb-2" 
                                             style="max-height: 150px; object-fit: contain;">
                                        <div class="small text-muted">Preview Image</div>
                                    </div>
                                </div>
                                
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <h6 class="fw-bold mb-2">Badges</h6>
                                        <div class="d-flex flex-wrap gap-1 mb-3">
                                            ${badgesHtml}
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="fw-bold mb-2">Playlists</h6>
                                        <ul class="list-unstyled mb-0">
                                            ${playlistsHtml}
                                        </ul>
                                    </div>
                                </div>
                                
                                <div class="row mb-4">
                                    <div class="col-md-12">
                                        <h6 class="fw-bold mb-2">Description</h6>
                                        <p>${template.description || 'No description available'}</p>
                                    </div>
                                </div>
                                
                                <div class="row mb-4">
                                    <div class="col-md-6">
                                        <h6 class="fw-bold mb-2">Key Features</h6>
                                        <ul class="feature-list mb-0">
                                            ${featuresHtml}
                                        </ul>
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="fw-bold mb-2">Requirements</h6>
                                        <ul class="feature-list mb-0">
                                            ${requirementsHtml}
                                        </ul>
                                    </div>
                                </div>
                                
                                ${template.livePreviewUrl ? `
                                <div class="row mb-4">
                                    <div class="col-md-12">
                                        <h6 class="fw-bold mb-2">Live Preview</h6>
                                        <a href="${template.livePreviewUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                                            <i class="fas fa-external-link-alt me-1"></i> View Live Demo
                                        </a>
                                    </div>
                                </div>
                                ` : ''}
                                
                                ${template.instructions ? `
                                <div class="row">
                                    <div class="col-md-12">
                                        <h6 class="fw-bold mb-2">Usage Instructions</h6>
                                        <div class="bg-light p-3 rounded">
                                            ${template.instructions}
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
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

                new bootstrap.Modal(modal).show();
            } catch (error) {
                alert("Failed to load template details");
                console.error(error);
            }
        }

        // Edit Template with all features
        async function editTemplate(templateId) {
            try {
                const template = await apiRequest(`/templates/${templateId}`);
                
                const modal = document.getElementById("editTemplateModal");
                modal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit Template</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editTemplateForm">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Template Name*</label>
                                                <input type="text" class="form-control" id="editTemplateName" value="${template.name}" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Description* (Max 75 characters)</label>
                                                <textarea class="form-control" id="editTemplateDescription" rows="3" maxlength="75" required>${template.description}</textarea>
                                                <div class="char-counter within-limit" id="editTemplateDescriptionCounter">${template.description?.length || 0}/75</div>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Category*</label>
                                                <select class="form-select" id="editTemplateCategory" required>
                                                    <option value="">Select...</option>
                                                    <option ${template.category === 'Portfolio' ? 'selected' : ''}>Portfolio</option>
                                                    <option ${template.category === 'E-commerce' ? 'selected' : ''}>E-commerce</option>
                                                    <option ${template.category === 'Blog' ? 'selected' : ''}>Blog</option>
                                                    <option ${template.category === 'Landing Page' ? 'selected' : ''}>Landing Page</option>
                                                    <option ${template.category === 'Business' ? 'selected' : ''}>Business</option>
                                                    <option ${template.category === 'Corporate' ? 'selected' : ''}>Corporate</option>
                                                    <option ${template.category === 'Creative' ? 'selected' : ''}>Creative</option>
                                                    <option ${template.category === 'Agency' ? 'selected' : ''}>Agency</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label d-block">Pricing Type</label>
                                                <div class="d-flex align-items-center">
                                                    <label class="toggle-switch">
                                                        <input type="checkbox" id="editTemplateIsFree" ${template.isFree ? 'checked' : ''}>
                                                        <span class="toggle-slider"></span>
                                                    </label>
                                                    <span class="form-check-label ms-2" id="editPricingLabel">${template.isFree ? 'Free' : 'Paid'}</span>
                                                </div>
                                            </div>
                                            <div class="mb-3" id="editPriceControl">
                                                <label class="form-label">Price (₹)*</label>
                                                <input type="number" class="form-control" id="editTemplatePrice" min="0" value="${template.price}" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Discounted Price (Optional)</label>
                                                <input type="number" class="form-control" id="editTemplateDiscountedPrice" min="0" value="${template.discountedPrice || ''}" placeholder="Leave blank if no discount">
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Layout</label>
                                                <input type="text" class="form-control" id="editTemplateLayout" value="${template.layout || ''}" placeholder="e.g., Responsive, Fixed, Grid">
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Framework</label>
                                                <input type="text" class="form-control" id="editTemplateFramework" value="${template.framework || ''}" placeholder="e.g., Bootstrap 5, Tailwind CSS, React">
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label">Status*</label>
                                                <select class="form-select" id="editTemplateStatus" required>
                                                    <option value="draft" ${template.status === 'draft' ? 'selected' : ''}>Draft</option>
                                                    <option value="active" ${template.status === 'active' ? 'selected' : ''}>Active</option>
                                                    <option value="archived" ${template.status === 'archived' ? 'selected' : ''}>Archived</option>
                                                </select>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Tags (comma separated)</label>
                                                <input type="text" class="form-control" id="editTemplateTags" value="${template.tags ? template.tags.join(', ') : ''}">
                                            </div>
                                            
                                            <!-- Template Badges -->
                                            <div class="mb-3">
                                                <label class="form-label">Template Badges</label>
                                                <small class="text-muted d-block mb-2">Select badges to display on template card</small>
                                                <div class="badge-selector">
                                                    <label class="badge-option">
                                                        <input type="checkbox" name="editTemplateBadge" value="new" ${template.badges && template.badges.includes('new') ? 'checked' : ''}>
                                                        <span class="badge badge-new">New</span>
                                                    </label>
                                                    <label class="badge-option">
                                                        <input type="checkbox" name="editTemplateBadge" value="popular" ${template.badges && template.badges.includes('popular') ? 'checked' : ''}>
                                                        <span class="badge badge-popular">Popular</span>
                                                    </label>
                                                    <label class="badge-option">
                                                        <input type="checkbox" name="editTemplateBadge" value="featured" ${template.badges && template.badges.includes('featured') ? 'checked' : ''}>
                                                        <span class="badge badge-featured">Featured</span>
                                                    </label>
                                                    <label class="badge-option">
                                                        <input type="checkbox" name="editTemplateBadge" value="premium" ${template.badges && template.badges.includes('premium') ? 'checked' : ''}>
                                                        <span class="badge badge-premium">Premium</span>
                                                    </label>
                                                    <label class="badge-option">
                                                        <input type="checkbox" name="editTemplateBadge" value="trending" ${template.badges && template.badges.includes('trending') ? 'checked' : ''}>
                                                        <span class="badge badge-trending">Trending</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <!-- Playlist Assignment -->
                                            <div class="mb-3">
                                                <label class="form-label">Add to Playlist</label>
                                                <small class="text-muted d-block mb-2">Select playlists for homepage display</small>
                                                <div class="playlist-selector">
                                                    <label class="playlist-option">
                                                        <input type="checkbox" name="editTemplatePlaylist" value="premium_products" ${template.playlists && template.playlists.includes('premium_products') ? 'checked' : ''}>
                                                        <span class="badge badge-premium">Premium Products</span>
                                                    </label>
                                                    <label class="playlist-option">
                                                        <input type="checkbox" name="editTemplatePlaylist" value="trending_now" ${template.playlists && template.playlists.includes('trending_now') ? 'checked' : ''}>
                                                        <span class="badge badge-trending">Trending Now</span>
                                                    </label>
                                                    <label class="playlist-option">
                                                        <input type="checkbox" name="editTemplatePlaylist" value="best_sellers" ${template.playlists && template.playlists.includes('best_sellers') ? 'checked' : ''}>
                                                        <span class="badge badge-popular">Best Sellers</span>
                                                    </label>
                                                    <label class="playlist-option">
                                                        <input type="checkbox" name="editTemplatePlaylist" value="new_arrivals" ${template.playlists && template.playlists.includes('new_arrivals') ? 'checked' : ''}>
                                                        <span class="badge badge-new">New Arrivals</span>
                                                    </label>
                                                    <label class="playlist-option">
                                                        <input type="checkbox" name="editTemplatePlaylist" value="editor_picks" ${template.playlists && template.playlists.includes('editor_picks') ? 'checked' : ''}>
                                                        <span class="badge badge-featured">Editor's Picks</span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div class="mb-3">
                                                <label class="form-label">Template File (ZIP)</label>
                                                <input class="form-control" type="file" id="editTemplateFile" accept=".zip">
                                                <small class="form-text text-muted">Leave blank to keep existing file</small>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Preview Image</label>
                                                <input class="form-control" type="file" id="editTemplatePreview" accept="image/*">
                                                <div class="mt-2" id="editPreviewImageContainer">
                                                    ${template.previewUrl ? `<img src="${template.previewUrl}" class="img-thumbnail" style="max-width: 120px;">` : ''}
                                                </div>
                                                <small class="form-text text-muted">Leave blank to keep existing image</small>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Live Preview URL</label>
                                                <input type="url" class="form-control" id="editTemplateLivePreviewUrl" value="${template.livePreviewUrl || ''}" placeholder="https://your-demo-link.com">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Detailed Information Section -->
                                    <div class="detail-section">
                                        <h6>Detailed Information</h6>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label class="form-label">Key Features (one per line)</label>
                                                    <textarea class="form-control" id="editTemplateFeatures" rows="3" placeholder="Responsive design&#10;Clean code&#10;Easy to customize">${template.features ? template.features.join('\n') : ''}</textarea>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Files Included</label>
                                                    <input type="text" class="form-control" id="editTemplateFilesIncluded" value="${template.filesIncluded || ''}" placeholder="e.g., HTML, CSS, JS, Documentation">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Support Duration</label>
                                                    <input type="text" class="form-control" id="editTemplateSupport" value="${template.support || ''}" placeholder="e.g., 6 Months, 1 Year, Lifetime">
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <div class="mb-3">
                                                    <label class="form-label">Requirements (one per line)</label>
                                                    <textarea class="form-control" id="editTemplateRequirements" rows="3" placeholder="WordPress 5.0+&#10;PHP 7.4+&#10;MySQL 5.6+">${template.requirements ? template.requirements.join('\n') : ''}</textarea>
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Compatible Browsers</label>
                                                    <input type="text" class="form-control" id="editTemplateBrowsers" value="${template.browsers || ''}" placeholder="e.g., Chrome, Firefox, Safari, Edge">
                                                </div>
                                                <div class="mb-3">
                                                    <label class="form-label">Last Updated</label>
                                                    <input type="date" class="form-control" id="editTemplateLastUpdated" value="${template.lastUpdated || ''}">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Usage Instructions</label>
                                            <textarea class="form-control" id="editTemplateInstructions" rows="3" placeholder="Step-by-step instructions for using this template...">${template.instructions || ''}</textarea>
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

                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();

                // Setup character counter for edit description
                const editDescriptionInput = document.getElementById("editTemplateDescription");
                const editCounterElement = document.getElementById("editTemplateDescriptionCounter");
                
                if (editDescriptionInput && editCounterElement) {
                    editDescriptionInput.addEventListener("input", function() {
                        const currentLength = this.value.length;
                        const maxLength = 75;
                        
                        editCounterElement.textContent = `${currentLength}/${maxLength}`;
                        
                        // Update counter color based on length
                        if (currentLength >= maxLength) {
                            editCounterElement.className = "char-counter limit-reached";
                        } else if (currentLength >= maxLength - 10) {
                            editCounterElement.className = "char-counter limit-warning";
                        } else {
                            editCounterElement.className = "char-counter within-limit";
                        }
                    });
                    
                    // Initial update
                    editDescriptionInput.dispatchEvent(new Event("input"));
                }

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
                        document.getElementById("editTemplatePrice").required = false;
                    } else {
                        pricingLabel.textContent = "Paid";
                        priceControl.style.opacity = "1";
                        priceControl.style.pointerEvents = "auto";
                        document.getElementById("editTemplatePrice").value = template.price || "99";
                        document.getElementById("editTemplatePrice").required = true;
                    }
                });

                // Preview image update
                document.getElementById('editTemplatePreview')?.addEventListener('change', function(e) {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                            document.getElementById('editPreviewImageContainer').innerHTML = 
                                `<img src="${event.target.result}" class="img-thumbnail" style="max-width: 120px;">`;
                        };
                        reader.readAsDataURL(file);
                    }
                });

                // Update button
                document.getElementById('updateTemplateBtn').onclick = async function() {
                    const formData = new FormData();
                    formData.append("name", document.getElementById("editTemplateName").value);
                    formData.append("description", document.getElementById("editTemplateDescription").value);
                    formData.append("category", document.getElementById("editTemplateCategory").value);
                    formData.append("isFree", document.getElementById("editTemplateIsFree").checked);
                    formData.append("price", document.getElementById("editTemplatePrice").value);
                    formData.append("status", document.getElementById("editTemplateStatus").value);
                    formData.append("tags", document.getElementById("editTemplateTags").value);
                    
                    // Validate description length
                    const description = document.getElementById("editTemplateDescription").value;
                    if (description.length > 75) {
                        alert("Description must be 75 characters or less!");
                        return;
                    }
                    
                    // Collect badges
                    const selectedBadges = Array.from(document.querySelectorAll('input[name="editTemplateBadge"]:checked'))
                        .map(cb => cb.value);
                    formData.append("badges", selectedBadges.join(','));
                    
                    // Collect playlists
                    const selectedPlaylists = Array.from(document.querySelectorAll('input[name="editTemplatePlaylist"]:checked'))
                        .map(cb => cb.value);
                    formData.append("playlists", selectedPlaylists.join(','));
                    
                    // Collect detailed information
                    formData.append("discountedPrice", document.getElementById("editTemplateDiscountedPrice").value || "");
                    formData.append("layout", document.getElementById("editTemplateLayout").value);
                    formData.append("framework", document.getElementById("editTemplateFramework").value);
                    formData.append("livePreviewUrl", document.getElementById("editTemplateLivePreviewUrl").value);
                    formData.append("features", document.getElementById("editTemplateFeatures").value);
                    formData.append("requirements", document.getElementById("editTemplateRequirements").value);
                    formData.append("filesIncluded", document.getElementById("editTemplateFilesIncluded").value);
                    formData.append("support", document.getElementById("editTemplateSupport").value);
                    formData.append("browsers", document.getElementById("editTemplateBrowsers").value);
                    formData.append("lastUpdated", document.getElementById("editTemplateLastUpdated").value);
                    formData.append("instructions", document.getElementById("editTemplateInstructions").value);

                    const templateFile = document.getElementById("editTemplateFile")?.files[0];
                    const previewFile = document.getElementById("editTemplatePreview")?.files[0];
                    
                    if (templateFile) formData.append("templateFile", templateFile);
                    if (previewFile) formData.append("previewFile", previewFile);

                    try {
                        const res = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
                            method: "PUT",
                            body: formData
                        });

                        if (!res.ok) throw new Error(await res.text());
                        
                        alert("Template updated successfully!");
                        bsModal.hide();
                        loadTemplates();
                    } catch (error) {
                        console.error("Error updating template:", error);
                        alert("Error updating template");
                    }
                };
            } catch (error) {
                alert("Failed to load template for editing");
                console.error(error);
            }
        }

        // Edit Coupon
        async function editCoupon(couponId) {
            try {
                const coupon = await apiRequest(`/coupons/${couponId}`);
                
                const modal = document.getElementById("editCouponModal");
                modal.innerHTML = `
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Edit Coupon</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="editCouponForm">
                                    <div class="mb-3">
                                        <label class="form-label">Coupon Code*</label>
                                        <input type="text" class="form-control" id="editCouponCode" value="${coupon.code}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Discount Value*</label>
                                        <input type="number" class="form-control" id="editCouponDiscount" value="${coupon.discount}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Discount Type*</label>
                                        <select class="form-select" id="editCouponType" required>
                                            <option value="percentage" ${coupon.type === 'percentage' ? 'selected' : ''}>Percentage</option>
                                            <option value="fixed" ${coupon.type === 'fixed' ? 'selected' : ''}>Fixed Amount</option>
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Maximum Usage*</label>
                                        <input type="number" class="form-control" id="editCouponMaxUsage" value="${coupon.maxUsage}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Valid Until*</label>
                                        <input type="date" class="form-control" id="editCouponValidUntil" 
                                               value="${new Date(coupon.validUntil).toISOString().split('T')[0]}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label class="form-label">Status*</label>
                                        <select class="form-select" id="editCouponStatus" required>
                                            <option value="active" ${coupon.status === 'active' ? 'selected' : ''}>Active</option>
                                            <option value="inactive" ${coupon.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="updateCouponBtn">Update</button>
                            </div>
                        </div>
                    </div>
                `;

                const bsModal = new bootstrap.Modal(modal);
                bsModal.show();

                // Update button
                document.getElementById('updateCouponBtn').onclick = async function() {
                    const couponData = {
                        code: document.getElementById("editCouponCode").value,
                        discount: parseInt(document.getElementById("editCouponDiscount").value),
                        type: document.getElementById("editCouponType").value,
                        maxUsage: parseInt(document.getElementById("editCouponMaxUsage").value),
                        validUntil: document.getElementById("editCouponValidUntil").value,
                        status: document.getElementById("editCouponStatus").value
                    };

                    try {
                        const res = await fetch(`${API_BASE_URL}/coupons/${couponId}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(couponData)
                        });

                        if (!res.ok) throw new Error(await res.text());
                        
                        alert("Coupon updated successfully!");
                        bsModal.hide();
                        loadCoupons();
                    } catch (error) {
                        console.error("Error updating coupon:", error);
                        alert("Error updating coupon");
                    }
                };
            } catch (error) {
                alert("Failed to load coupon for editing");
                console.error(error);
            }
        }

        // Delete Template
        async function deleteTemplate(templateId) {
            if (confirm("Are you sure you want to delete this template?")) {
                try {
                    await apiRequest(`/templates/${templateId}`, { method: "DELETE" });
                    alert("Template deleted successfully!");
                    loadTemplates();
                } catch (error) {
                    console.error("Error deleting template:", error);
                    alert("Error deleting template");
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
                    alert("Error deleting coupon");
                }
            }
        }

        // Update Template Counts
        async function updateTemplateCounts() {
            try {
                const templates = await apiRequest("/templates");
                const activeTemplates = templates.filter(t => t.status === "active");
                const paidTemplates = templates.filter(t => !t.isFree);
                const totalRevenue = paidTemplates.reduce((sum, t) => sum + (t.price || 0), 0);

                document.getElementById("totalTemplates").textContent = templates.length;
                document.getElementById("activeTemplates").textContent = activeTemplates.length;
                document.getElementById("totalRevenue").textContent = `₹${totalRevenue.toLocaleString()}`;
            } catch (error) {
                console.error("Error updating counts:", error);
            }
        }

        // Initialize Charts
        function initCharts() {
            // Performance Chart
            new Chart(document.getElementById("performanceChart").getContext("2d"), {
                type: "line",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
                    datasets: [{
                        label: "Revenue (₹)",
                        data: [8500, 12500, 9800, 15200, 11000, 18000, 14500, 24850],
                        borderColor: "#2c3e50",
                        backgroundColor: "rgba(44, 62, 80, 0.1)",
                        borderWidth: 2,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Category Chart
            new Chart(document.getElementById("categoryChart").getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Portfolio", "E-commerce", "Blog", "Landing Page", "Business"],
                    datasets: [{
                        data: [35, 25, 20, 15, 5],
                        backgroundColor: ["#2c3e50", "#27ae60", "#f39c12", "#e74c3c", "#3498db"]
                    }]
                },
                options: {
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Initialize Analytics Charts
        function loadAnalytics() {
            // Downloads Chart
            new Chart(document.getElementById("downloadsChart").getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                    datasets: [{
                        label: "Downloads",
                        data: [42, 58, 45, 72, 60, 85],
                        backgroundColor: "rgba(44, 62, 80, 0.8)"
                    }]
                }
            });

            // Popular Templates Chart
            new Chart(document.getElementById("popularTemplatesChart").getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Portfolio", "E-commerce", "Blog", "Landing"],
                    datasets: [{
                        data: [12, 19, 3, 5],
                        backgroundColor: [
                            "rgba(44, 62, 80, 0.8)",
                            "rgba(39, 174, 96, 0.8)",
                            "rgba(243, 156, 18, 0.8)",
                            "rgba(231, 76, 60, 0.8)"
                        ]
                    }]
                }
            });

            // Revenue Chart
            new Chart(document.getElementById("revenueChart").getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Q1", "Q2", "Q3", "Q4"],
                    datasets: [{
                        label: "Revenue (₹)",
                        data: [8500, 10500, 12000, 9500],
                        backgroundColor: "rgba(39, 174, 96, 0.8)"
                    }]
                }
            });

            // Engagement Chart
            new Chart(document.getElementById("engagementChart").getContext("2d"), {
                type: "radar",
                data: {
                    labels: ["Visits", "Downloads", "Time", "Purchases", "Reviews"],
                    datasets: [{
                        label: "Engagement",
                        data: [85, 72, 90, 65, 78],
                        backgroundColor: "rgba(44, 62, 80, 0.2)",
                        borderColor: "rgba(44, 62, 80, 1)"
                    }]
                }
            });
        }

        // Load Payments
        async function loadPayments() {
            const tableBody = document.getElementById("paymentsTable");
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading payments...</span>
                        </div>
                        <p class="mt-3 text-muted">Loading payments...</p>
                    </td>
                </tr>
            `;

            // Simulate API call
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
                `;
            }, 1000);
        }

        // Initialize
        document.addEventListener("DOMContentLoaded", () => {
            initCharts();
            loadTemplates();
            updateTemplateCounts();
            setupDescriptionCounter();

            // Search events
            document.getElementById("searchButton").addEventListener("click", loadTemplates);
            document.getElementById("templateSearch").addEventListener("keyup", (e) => {
                if (e.key === "Enter") loadTemplates();
            });
            document.getElementById("statusFilter").addEventListener("change", loadTemplates);

            // Coupon search events
            document.getElementById("couponSearchButton").addEventListener("click", loadCoupons);
            document.getElementById("couponSearch").addEventListener("keyup", (e) => {
                if (e.key === "Enter") loadCoupons();
            });
            document.getElementById("couponStatusFilter").addEventListener("change", loadCoupons);

            // Auto-refresh
            setInterval(loadTemplates, 30000);
        });
    