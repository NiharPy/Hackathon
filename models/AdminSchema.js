import mongoose from "mongoose";

// Pin Schema for mine map (exactly as specified)
const PinSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Hazard", "Progress", "SafetyNode"],
    required: true,
  },
  hazardLevel: {
    type: String,
    enum: ["Yellow", "Orange", "Red", "None"],
    default: "None",
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  description: { type: String },
  image: { type: String },
  voiceNote: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Admin has ONLY pins (plus auth + optional tenant link)
const AdminSchema = new mongoose.Schema({
  superAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperAdmin",
    required: false,     // ← made optional
    default: null,       // ← allow standalone admins
    index: true,
  },
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  pins: [PinSchema],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Uniqueness: email per tenant (per SuperAdmin)
// (still valid; if superAdmin is null, it enforces uniqueness on email for null-tenant)
AdminSchema.index({ superAdmin: 1, email: 1 }, { unique: true });

export default mongoose.model("Admin", AdminSchema);
