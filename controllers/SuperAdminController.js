import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import SuperAdmin from "../models/superAdminSchema.js"; // adjust path as needed
import cloudinary from "../config/cloudinary.js";

// Generate tokens
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
};

// Login Controller
export const loginSuperAdmin = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);  // 👈 Add this
    const { email, password } = req.body;

    // 1. Find SuperAdmin by email
    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    // 2. Validate password
    const isPasswordValid = await bcrypt.compare(password, superAdmin.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 3. Generate tokens
    const accessToken = generateAccessToken(superAdmin._id);
    const refreshToken = generateRefreshToken(superAdmin._id);

    // 4. Save refreshToken in DB
    superAdmin.refreshToken = refreshToken;
    await superAdmin.save();

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      superAdmin: {
        id: superAdmin._id,
        email: superAdmin.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signupSuperAdmin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 1. Check if SuperAdmin already exists
      const existingAdmin = await SuperAdmin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: "SuperAdmin already exists" });
      }
  
      // 2. Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
  
      // 3. Create new SuperAdmin
      const newSuperAdmin = new SuperAdmin({
        email,
        passwordHash
      });
  
      await newSuperAdmin.save();
  
      // 4. Respond with success
      res.status(201).json({
        message: "SuperAdmin registered successfully",
        superAdmin: {
          id: newSuperAdmin._id,
          email: newSuperAdmin.email
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };


/**
 * POST /api/transport/:superAdminId/vehicles
 * Body: { registrationNumber, driverName, latitude, longitude }
 */
export const addVehicle = async (req, res) => {
  try {
    // Prefer JWT → req.user.id (set by auth middleware)
    const superAdminId = req.user?.id;
    if (!superAdminId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { registrationNumber, driverName, latitude, longitude } = req.body;

    // Basic validation
    if (
      !registrationNumber ||
      !driverName ||
      latitude == null ||
      longitude == null
    ) {
      return res.status(400).json({
        message:
          "registrationNumber, driverName, latitude and longitude are required",
      });
    }

    // Load the owner document
    const admin = await SuperAdmin.findById(superAdminId).select("vehicles");
    if (!admin) {
      return res.status(404).json({ message: "SuperAdmin not found" });
    }

    // Prevent duplicate registration numbers per SuperAdmin
    const regNorm = String(registrationNumber).trim().toLowerCase();
    const exists = admin.vehicles.some(
      (v) => v.registrationNumber.trim().toLowerCase() === regNorm
    );
    if (exists) {
      return res
        .status(409)
        .json({ message: "Vehicle with this registration number already exists" });
    }

    // Push the new vehicle
    admin.vehicles.push({
      registrationNumber: String(registrationNumber).trim(),
      driverName,
      location: { latitude: Number(latitude), longitude: Number(longitude) },
      assignedAt: new Date(),
    });

    await admin.save();

    const vehicle = admin.vehicles.at(-1);
    return res.status(201).json({ message: "Vehicle added", vehicle });
  } catch (err) {
    console.error("addVehicle error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Validation error", details: err.errors });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const uploadMineMap = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
  
      // Upload file to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "mine_maps" },
        async (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return res.status(500).json({ message: "Cloudinary upload failed" });
          }
  
          // Find SuperAdmin by ID
          const superAdmin = await SuperAdmin.findById(req.user.id);
          if (!superAdmin) {
            return res.status(404).json({ message: "SuperAdmin not found" });
        }
  
          // Update SuperAdmin with new mine map URL
          superAdmin.mineMap = result.secure_url;
          superAdmin.updatedAt = Date.now();
  
          await superAdmin.save();
  
          return res.status(200).json({
            message: "Mine map uploaded successfully",
            mineMapUrl: superAdmin.mineMap,
            superAdmin: {
              id: superAdmin._id,
              email: superAdmin.email,
              mineMap: superAdmin.mineMap,
            },
          });
        }
      );
  
      // Pipe buffer to Cloudinary
      uploadStream.end(req.file.buffer);
  
    } catch (error) {
      console.error("UploadMineMap Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };