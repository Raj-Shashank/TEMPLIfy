// Get product details from URL
const params = new URLSearchParams(window.location.search);
const templateId = params.get("id"); // We'll use this to fetch the template

let productName = params.get("name") || "Name not found";
let productPrice = params.get("price") || "1";
productName = decodeURIComponent(productName);

// Set product info
if (document.getElementById("productInfo"))
  document.getElementById(
    "productInfo"
  ).textContent = `Purchasing: ${productName} (₹${productPrice})`;
if (document.getElementById("purchaseDetails"))
  document.getElementById(
    "purchaseDetails"
  ).textContent = `Thank you for purchasing ${productName} (₹${productPrice})`;

// Razorpay configuration
const RAZORPAY_KEY_ID = "rzp_test_kI4DrMAEQUKfyT"; // <-- Set your real key here
let templateFileUrl = null;
let template = null;

// Fetch template details (including fileUrl) before payment
async function fetchTemplateDetails() {
  if (!templateId) return;
  try {
    const res = await fetch(
      `https://templ.onrender.com/api/templates/${templateId}`
    );
    template = await res.json();
    templateFileUrl = template.fileUrl;
    // Optionally update productName/productPrice from DB
    // productName = template.name;
    // productPrice = template.price;
  } catch (err) {
    templateFileUrl = null;
  }
}

fetchTemplateDetails();

const razorpayConfig = {
  key: RAZORPAY_KEY_ID,
  amount: parseInt(productPrice) * 100, // Razorpay uses paise (multiply by 100)
  currency: "INR",
  name: "TEMPLIfy",
  description: `Purchase: ${productName}`,
  image: "https://your-logo-url.com/logo.png",
  order_id: "", // This will be set after creating order
  handler: async function (response) {
    document.getElementById("rzp-button").innerHTML =
      '<span class="loading"></span> Verifying Payment...';
    const verificationSuccess = await verifyPayment(response);
    if (verificationSuccess) {
      showSuccess();
      startDownload();
    } else {
      showError("Payment verification failed. Please contact support.");
    }
  },
  prefill: {
    name: "Customer Name",
    email: "customer@example.com",
    contact: "9999999999",
  },
  notes: {
    product: productName,
    price: productPrice,
  },
  theme: {
    color: "#3A7BFF",
  },
};

// Initialize Razorpay
if (document.getElementById("rzp-button")) {
  document.getElementById("rzp-button").onclick = async function (e) {
    e.preventDefault();
    this.innerHTML = '<span class="loading"></span> Processing...';
    try {
      const orderId = await createRazorpayOrder();
      if (!orderId) {
        showError("Could not create payment order");
        return;
      }
      razorpayConfig.order_id = orderId;
      const rzp = new Razorpay(razorpayConfig);
      rzp.open();
      rzp.on("payment.failed", function (response) {
        showError("Payment failed. Please try again.");
      });
    } catch (err) {
      showError("An error occurred. Please try again.");
    } finally {
      this.innerHTML = '<i class="fas fa-credit-card"></i> Pay with Razorpay';
    }
  };
}

// Create Razorpay order (replace with actual backend call)
async function createRazorpayOrder() {
  // Call backend to create real Razorpay order
  const response = await fetch(
    "https://templ.onrender.com/api/create-razorpay-order",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: razorpayConfig.amount,
        currency: razorpayConfig.currency,
        receipt: `receipt_${templateId}_${Date.now()}`,
      }),
    }
  );
  const data = await response.json();
  return data.orderId;
}

// Simulate payment verification (replace with actual API call)
async function verifyPayment(paymentResponse) {
  // In production, call your backend to verify
  // Example:
  // const response = await fetch('https://templ.onrender.com/api/verify-payment', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(paymentResponse)
  // });
  // const data = await response.json();
  // return data.success;
  // For demo, assume verification succeeds
  return true;
}

function showSuccess() {
  document.getElementById("paymentSection").style.display = "none";
  document.getElementById("errorSection").style.display = "none";
  document.getElementById("successSection").style.display = "block";
}

function showError(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("paymentSection").style.display = "none";
  document.getElementById("successSection").style.display = "none";
  document.getElementById("errorSection").style.display = "block";
}

function showPaymentSection() {
  document.getElementById("paymentSection").style.display = "block";
  document.getElementById("errorSection").style.display = "none";
  document.getElementById("successSection").style.display = "none";
}

function startDownload() {
  if (!templateFileUrl) {
    alert("No file available for download.");
    return;
  }
  setTimeout(() => {
    const link = document.createElement("a");
    link.href = templateFileUrl;
    link.download = `${productName.replace(/\s+/g, "_")}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (document.getElementById("downloadBtn"))
      document.getElementById("downloadBtn").innerHTML =
        '<i class="fas fa-check"></i> Download Started!';
  }, 1000);
}

// Manual download trigger
if (document.getElementById("downloadBtn"))
  document
    .getElementById("downloadBtn")
    .addEventListener("click", startDownload);
