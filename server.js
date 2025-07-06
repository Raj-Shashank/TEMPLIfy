require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const cors = require("cors");
const Razorpay = require("razorpay");
const { MongoClient, GridFSBucket, ObjectId } = require("mongodb");

const app = express();
const PORT = 3000;
const MONGO_URI = process.env.MONGO_URI;

// Middleware
const corsOptions = {
  origin: ["https://templiff.netlify.app","http://localhost:5500"], // Your client's origin
  credentials: true, // Allow credentials
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Setup GridFS
let gfsBucket;
mongoose.connection.once("open", () => {
  gfsBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
});

// Use multer memory storage for file uploads
const memoryStorage = multer.memoryStorage();
const uploadMemory = multer({ storage: memoryStorage });

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

// Set BASE_URL for file links
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Helper function to make URLs absolute
function makeAbsoluteUrl(url) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url}`;
}

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
    let templates = await Template.find(query).sort({ createdAt: -1 });
    // Ensure previewUrl and fileUrl are absolute
    templates = templates.map((t) => {
      t = t.toObject();
      t.previewUrl = makeAbsoluteUrl(t.previewUrl);
      t.fileUrl = makeAbsoluteUrl(t.fileUrl);
      return t;
    });
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

// API: Upload template with files (store in GridFS)
app.post(
  "/api/templates/upload",
  uploadMemory.fields([
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
      let templateFileId, previewFileId;
      let templateFileUrl, previewFileUrl;
      // Save files to GridFS and get their IDs
      if (req.files["templateFile"]) {
        const file = req.files["templateFile"][0];
        const uploadStream = gfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on("finish", () => {
            templateFileId = uploadStream.id;
            templateFileUrl = `${BASE_URL}/api/files/${templateFileId}`;
            resolve();
          });
          uploadStream.on("error", reject);
        });
      }
      if (req.files["previewFile"]) {
        const file = req.files["previewFile"][0];
        const uploadStream = gfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on("finish", () => {
            previewFileId = uploadStream.id;
            previewFileUrl = `${BASE_URL}/api/files/${previewFileId}`;
            resolve();
          });
          uploadStream.on("error", reject);
        });
      }
      const template = new Template({
        name,
        description,
        category,
        price: Number(price),
        status,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        livePreviewUrl: livePreviewUrl || undefined,
        previewUrl: previewFileUrl,
        fileUrl: templateFileUrl,
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

// API: Serve files from GridFS (with inline or attachment option)
app.get("/api/files/:id", async (req, res) => {
  try {
    const fileId = new ObjectId(req.params.id);
    const files = await mongoose.connection.db
      .collection("uploads.files")
      .find({ _id: fileId })
      .toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    const file = files[0];
    // If image, display inline; if zip or other, force download
    const isImage = (file.contentType || "").startsWith("image/");
    if (isImage) {
      res.set("Content-Type", file.contentType);
      res.set("Content-Disposition", `inline; filename=\"${file.filename}\"`);
    } else {
      res.set("Content-Type", file.contentType || "application/octet-stream");
      res.set("Content-Disposition", `attachment; filename=\"${file.filename}\"`);
    }
    gfsBucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    res.status(404).json({ error: "File not found" });
  }
});

// API: Update a template (with optional file uploads, store in GridFS)
app.put(
  "/api/templates/:id",
  uploadMemory.fields([
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
      let update = {
        name,
        description,
        category,
        price: Number(price),
        status,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        livePreviewUrl: livePreviewUrl || undefined,
      };
      if (req.files["templateFile"]) {
        const file = req.files["templateFile"][0];
        const uploadStream = gfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on("finish", () => {
            update.fileUrl = `${BASE_URL}/api/files/${uploadStream.id}`;
            resolve();
          });
          uploadStream.on("error", reject);
        });
      }
      if (req.files["previewFile"]) {
        const file = req.files["previewFile"][0];
        const uploadStream = gfsBucket.openUploadStream(file.originalname, {
          contentType: file.mimetype,
        });
        uploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          uploadStream.on("finish", () => {
            update.previewUrl = `${BASE_URL}/api/files/${uploadStream.id}`;
            resolve();
          });
          uploadStream.on("error", reject);
        });
      }
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

// API: Get a single template by ID (with error logging)
app.get("/api/templates/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("Fetching template with id:", id);
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: "Invalid template ID format" });
    }
    let template = await Template.findById(id);
    if (!template) {
      console.log("Template not found for id:", id);
      return res.status(404).json({ error: "Template not found" });
    }
    template = template.toObject();
    template.previewUrl = makeAbsoluteUrl(template.previewUrl);
    template.fileUrl = makeAbsoluteUrl(template.fileUrl);
    res.json(template);
  } catch (err) {
    console.error("Error fetching template by id:", err);
    res.status(400).json({ error: "Failed to fetch template" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
