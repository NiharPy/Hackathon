import mongoose from "mongoose";

const SimulatorSchema = new mongoose.Schema({
  superAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperAdmin",
    required: true
  },
  safetyNodePin: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  workerDistress: {
    type: Number,
    default: 0, // percentage or severity level
    min: 0,
    max: 100
  },
  methaneBuildup: {
    type: Number,
    default: 0, // ppm or relative scale
    min: 0,
    max: 100
  },
  temperatureIncrease: {
    type: Number,
    default: 0, // Celsius increase or relative scale
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Simulator", SimulatorSchema);
