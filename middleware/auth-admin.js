// middleware/auth-admin.js
import jwt from "jsonwebtoken";
import Admin from "../models/AdminSchema.js";

const ACCESS_SECRET = process.env.JWT_SECRET ?? process.env.ACCESS_TOKEN_SECRET;

export default async function authAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access token missing or invalid." });
    }
    const token = authHeader.slice(7).trim();

    if (!ACCESS_SECRET) {
      console.error("[authAdmin] Missing JWT secret");
      return res.status(500).json({ message: "Server misconfiguration." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({
        message: err.name === "TokenExpiredError" ? "Access token expired." : "Invalid token.",
      });
    }

    const adminId = decoded.id ?? decoded.userId ?? decoded.sub;
    if (!adminId) return res.status(401).json({ message: "Invalid token payload." });

    const admin = await Admin.findById(adminId).select("_id email superAdmin").lean();
    if (!admin) return res.status(401).json({ message: "Not an Admin token" });

    req.token = token;
    req.adminId = admin._id.toString();
    req.admin = {
      id: admin._id.toString(),
      email: admin.email,
      superAdmin: admin.superAdmin ? admin.superAdmin.toString() : undefined, // ← key line
    };

    next();
  } catch (err) {
    console.error("authAdmin:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
}
