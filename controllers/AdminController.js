import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/AdminSchema.js";
import superAdmin from "../models/superAdminSchema.js";
import Worker from "../models/WorkerSchema.js";

/* ---------- SIGNUP ---------- */
export const adminSignup = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const normEmail = email.toLowerCase().trim();
    const exists = await Admin.findOne({ email: normEmail }).lean();
    if (exists) return res.status(409).json({ message: "Admin with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ email: normEmail, passwordHash, pins: [] });

    return res.status(201).json({ message: "Admin registered successfully", admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    console.error("adminSignup:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/* ---------- LOGIN ---------- */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email and password are required" });

    const normEmail = email.toLowerCase().trim();
    const admin = await Admin.findOne({ email: normEmail });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, { expiresIn: "15m" });
    return res.json({ message: "Login successful", accessToken, admin: { id: admin._id, email: admin.email } });
  } catch (err) {
    console.error("adminLogin:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const createWorker = async (req, res) => {
  try {
    const { name, role } = req.body;

    // ✅ coming from authAdmin middleware
    const adminId = req.adminId;

    if (!name || !role) {
      return res.status(400).json({ message: "Name and role are required" });
    }

    const newWorker = new Worker({
      name,
      role,
      admin: adminId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await newWorker.save();

    res.status(201).json({
      message: "Worker created successfully",
      worker: newWorker,
    });
  } catch (error) {
    console.error("CreateWorker Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
