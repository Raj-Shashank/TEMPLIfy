{
  /* <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-storage-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js"></script>
     */
}

// Example API base URL
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
  container.innerHTML =
    '<div class="text-center py-5"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';

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
    templates.forEach((template) => {
      // Determine badge color based on status
      let badgeClass = "badge-draft";
      if (template.status === "active") badgeClass = "badge-active";
      if (template.status === "archived") badgeClass = "badge-archived";
      container.innerHTML += `
                        <div class="col-md-4 mb-4">
                            <div class="card template-card h-100">
                                <img src="${
                                  template.previewUrl || ""
                                }" class="card-img-top" alt="${
        template.name
      }" style="height: 180px; object-fit: cover;">
                                <div class="card-body">
                                    <h5 class="card-title">${template.name}</h5>
                                    <p class="card-text text-muted">${template.description.substring(
                                      0,
                                      60
                                    )}...</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="badge ${badgeClass}">${
        template.status
      }</span>
                                        <span class="text-primary">₹${
                                          template.price
                                        }</span>
                                    </div>
                                </div>
                                <div class="card-footer bg-transparent">
                                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${
                                      template._id
                                    }">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger float-end delete-btn" data-id="${
                                      template._id
                                    }">
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
    container.innerHTML =
      '<div class="alert alert-danger">Failed to load templates.</div>';
  }
}

// Edit Template (stub)
function editTemplate(templateId) {
  alert(
    "Edit functionality will be implemented here for template ID: " + templateId
  );
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
  } catch (error) {
    document.getElementById("totalTemplates").textContent = "-";
    document.getElementById("activeTemplates").textContent = "-";
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

  // Sample data - replace with actual Firestore data
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
}

// Load Payments (stubbed, replace with backend data as needed)
async function loadPayments() {
  // TODO: Replace with backend API call
  // Example: const payments = await apiRequest('/payments');
  // ...render payments table...
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Admin Auth (replace with your own logic if needed)
  // auth
  //   .signInWithEmailAndPassword("admin@example.com", "admin123")
  //   .then(() => {
  //     console.log("Admin logged in");
  //     loadTemplates();
  //     updateTemplateCounts();
  //   })
  //   .catch((error) => {
  //     console.error("Login error:", error);
  //     // Redirect to login page if needed
  //   });

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
});
