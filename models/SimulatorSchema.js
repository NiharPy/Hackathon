import mongoose from "mongoose";

const SimulatorEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Methane", "WorkerDistress", "Temperature"],
    required: true,
  },
  level: {
    type: String,
    enum: ["Yellow", "Orange", "Red"],
    required: true,
  },
  value: { type: Number }, // methane % or temperature
  presses: { type: Number }, // worker distress presses
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default SimulatorEventSchema;
