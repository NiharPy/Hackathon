import mongoose from "mongoose";

const WorkerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  workerId: {
    type: String,
    required: false,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ["Miner", "Technician", "Rescue"],
    default: "Miner"
  },
  attendance: [
    {
      date: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["Present", "Absent"],
        required: true
      }
    }
  ],
  attendanceCount: {
    type: Number,
    default: 0 // total present days
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

export default mongoose.model("Worker", WorkerSchema);
