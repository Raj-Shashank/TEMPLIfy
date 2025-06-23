require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const Razorpay = require("razorpay");

const app = express();
const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
const corsOptions = {
  origin: "http://localhost:5500", // Your client's origin
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Example Schema and Model
const ItemSchema = new mongoose.Schema({
  name: String,
  value: Number,
});
const Item = mongoose.model("Item", ItemSchema);

// Template Schema and Model
const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["active", "draft", "archived"],
    default: "draft",
  },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  downloads: { type: Number, default: 0 },
  previewUrl: String, // Optional, for future file upload
  fileUrl: String, // Optional, for future file upload
  livePreviewUrl: String, // Optional, for live preview links
});
const Template = mongoose.model("Template", TemplateSchema);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Example API Routes
app.get("/api/items", async (req, res) => {
  const items = await Item.find();
  res.json(items);
});

app.post("/api/items", async (req, res) => {
  const item = new Item(req.body);
  await item.save();
  res.status(201).json(item);
});

// API: Get all templates (with optional status/search)
app.get("/api/templates", async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    const templates = await Template.find(query).sort({ createdAt: -1 });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// API: Create a new template
app.post("/api/templates", async (req, res) => {
  try {
    const template = new Template(req.body);
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(400).json({ error: "Failed to create template" });
  }
});

// API: Delete a template
app.delete("/api/templates/:id", async (req, res) => {
  try {
    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete template" });
  }
});

// API: Upload template with files (templateFile, previewFile)
app.post(
  "/api/templates/upload",
  upload.fields([
    { name: "templateFile", maxCount: 1 },
    { name: "previewFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        price,
        status,
        tags,
        livePreviewUrl,
      } = req.body;
      const templateFile = req.files["templateFile"]?.[0];
      const previewFile = req.files["previewFile"]?.[0];
      const template = new Template({
        name,
        description,
        category,
        price: Number(price),
        status,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        livePreviewUrl: livePreviewUrl || undefined,
        previewUrl: previewFile
          ? `/uploads/${previewFile.filename}`
          : undefined,
        fileUrl: templateFile ? `/uploads/${templateFile.filename}` : undefined,
        createdAt: new Date(),
        downloads: 0,
      });
      await template.save();
      res.status(201).json(template);
    } catch (err) {
      res.status(400).json({ error: "Failed to upload template" });
    }
  }
);

// API: Get a single template by ID
app.get("/api/templates/:id", async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ error: "Template not found" });
    res.json(template);
  } catch (err) {
    res.status(400).json({ error: "Failed to fetch template" });
  }
});

// API: Update a template (with optional file uploads)
app.put(
  "/api/templates/:id",
  upload.fields([
    { name: "templateFile", maxCount: 1 },
    { name: "previewFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        price,
        status,
        tags,
        livePreviewUrl,
      } = req.body;
      const templateFile = req.files["templateFile"]?.[0];
      const previewFile = req.files["previewFile"]?.[0];
      const update = {
        name,
        description,
        category,
        price: Number(price),
        status,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        livePreviewUrl: livePreviewUrl || undefined,
      };
      if (templateFile) update.fileUrl = `/uploads/${templateFile.filename}`;
      if (previewFile) update.previewUrl = `/uploads/${previewFile.filename}`;
      const template = await Template.findByIdAndUpdate(req.params.id, update, {
        new: true,
      });
      if (!template)
        return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (err) {
      res.status(400).json({ error: "Failed to update template" });
    }
  }
);

// API: Create Razorpay order
app.post("/api/create-razorpay-order", async (req, res) => {
  try {
    let { amount, currency, receipt } = req.body;
    // Ensure receipt is no more than 40 characters
    if (receipt && receipt.length > 40) {
      receipt = receipt.substring(0, 40);
    }
    console.log("Creating order with:", { amount, currency, receipt });
    const options = { amount, currency, receipt };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: "Failed to create Razorpay order" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
