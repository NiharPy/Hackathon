import mongoose from "mongoose";
import SimulatorEventSchema from "./SimulatorSchema.js";

const PinSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Hazard", "Progress"], // removed SafetyNode
    required: true
  },
  hazardLevel: {
    type: String,
    enum: ["Yellow", "Orange", "Red", "None"],
    default: "None"
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  description: {
    type: String
  },
  summary: { type: String },
  images: [{ type: String }], 
  voiceNote: {
    type: String
  },
  mined: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Separate SafetyNode Schema
export const SafetyNodeSchema = new mongoose.Schema({
    nodeName: { type: String, required: true },
    coordinates: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
  
    // 👇 Optional fields (set by Simulator/Admin later)
    description: { type: String },
    images: [{ type: String }],
    voiceNote: { type: String },
  
    // 👇 Simulator updates
    simulatorEvents: [SimulatorEventSchema],
  
    createdAt: {
      type: Date,
      default: Date.now,
    },
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
  refreshToken: {
    type: String,
    default: null
  },
  mineMap: {
    type: String,
    required: false
  },
  pins: [PinSchema],          // Hazard + Progress pins
  safetyNodes: [SafetyNodeSchema], // ✅ separate array for Safety Nodes
  vehicles: [VehicleSchema], 
  shifts: [
    {
      name: { type: String, required: true },
      startTime: { type: Date, required: true },
      endTime: { type: Date, default: null } // endTime will be updated later
    }
  ],
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
