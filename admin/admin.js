
// API Configuration
const API_BASE_URL = "https://templify-zhhw.onrender.com/api";

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
        if (tabId === "analytics") loadAnalytics();
        if (tabId === "payments") loadPayments();
    });
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
        const price = document.getElementById("templatePrice").value;
        const status = document.getElementById("templateStatus").value;
        const tags = document.getElementById("templateTags").value;
        const templateFile = document.getElementById("templateFile").files[0];
        const previewFile = document.getElementById("templatePreview").files[0];
        const livePreviewUrl = document.getElementById(
            "templateLivePreviewUrl"
        ).value;

        if (
            !name ||
            !description ||
            !category ||
            !price ||
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
            formData.append("price", price);
            formData.append("status", status);
            formData.append("tags", tags);
            formData.append("templateFile", templateFile);
            formData.append("previewFile", previewFile);
            formData.append("livePreviewUrl", livePreviewUrl);

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
    // Apply search
    const searchTerm = document
        .getElementById("templateSearch")
        .value.toLowerCase();

    try {
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
            
            container.innerHTML += `
                <div class="col-md-4 mb-4">
                    <div class="card template-card h-100">
                        <img src="${template.previewUrl || 'https://via.placeholder.com/800x600/f8f9fc/5e6278?text=Template+Preview'}" 
                              class="card-img-top" 
                              alt="${template.name}" 
                              style="height: 180px; object-fit: cover;">
                        <div class="card-body">
                            <h5 class="card-title">${template.name}</h5>
                            <p class="card-text text-muted">${template.description.substring(0, 60)}...</p>
                            <div class="d-flex justify-content-between align-items-center mt-3">
                                <span class="badge ${badgeClass}">${template.status}</span>
                                <span class="text-primary fw-bold">₹${template.price}</span>
                            </div>
                        </div>
                        <div class="card-footer bg-transparent">
                            <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${template._id}">
                                <i class="fas fa-edit"></i> Edit
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
                                    </select>
                                </div>
                                <div class="mb-3">
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
        const price = document.getElementById("editTemplatePrice").value;
        const status = document.getElementById("editTemplateStatus").value;
        const tags = document.getElementById("editTemplateTags").value;
        const templateFile = document.getElementById("editTemplateFile").files[0];
        const previewFile = document.getElementById("editTemplatePreview").files[0];
        const livePreviewUrl = document.getElementById(
            "editTemplateLivePreviewUrl"
        ).value;
        
        if (!name || !description || !category || !price) {
            alert("Please fill all required fields!");
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("price", price);
            formData.append("status", status);
            formData.append("tags", tags);
            if (templateFile) formData.append("templateFile", templateFile);
            if (previewFile) formData.append("previewFile", previewFile);
            formData.append("livePreviewUrl", livePreviewUrl);
            
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

// Update Template Counts (fetch from backend)
async function updateTemplateCounts() {
    try {
        const all = await apiRequest("/templates");
        document.getElementById("totalTemplates").textContent = all.length;
        
        const active = all.filter((t) => t.status === "active");
        document.getElementById("activeTemplates").textContent = active.length;
        
        // Calculate total revenue (simplified for demo)
        const totalRevenue = all.reduce((sum, template) => sum + (template.price || 0), 0);
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
            labels: ["Portfolio", "E-commerce", "Blog", "Landing"],
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
            labels: ['Portfolio', 'E-commerce', 'Blog', 'Landing Page', 'Other'],
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

    // Auto-refresh templates every 30 seconds in admin panel
    setInterval(loadTemplates, 30000);
});
