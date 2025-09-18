import mongoose from "mongoose";

// Pin Schema for mine map
const PinSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Hazard", "Progress", "SafetyNode"],
    required: true
  },
  hazardLevel: {
    type: String,
    enum: ["Yellow", "Orange", "Red", "None"], // None for progress & safety nodes
    default: "None"
  },
  coordinates: {
    x: { type: Number, required: true }, // X position on 2D map
    y: { type: Number, required: true }  // Y position on 2D map
  },
  description: {
    type: String
  },
  image: {
    type: String // store file path or cloud URL
  },
  voiceNote: {
    type: String // file path or cloud URL
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Vehicle Schema
const VehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  driverName: {
    type: String,
    required: true
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true }
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
});

// SuperAdmin Schema
const SuperAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  mineMap: {
    type: String, // path or cloud storage URL for uploaded 2D mine map image
    required: false
  },
  pins: [PinSchema], // all pins placed by the SuperAdmin
  vehicles: [VehicleSchema], // vehicles managed by SuperAdmin
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("SuperAdmin", SuperAdminSchema);
