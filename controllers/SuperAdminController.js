import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import SuperAdmin from "../models/superAdminSchema.js"; // adjust path as needed

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