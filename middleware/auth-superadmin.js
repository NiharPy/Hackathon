// middleware/auth-superadmin.js
import jwt from "jsonwebtoken";

export default function authSuperAdmin(req, res, next) {
  try {
    // Accept Bearer token OR cookie named "access_token"
    const header = req.headers.authorization || "";
    const bearer = header.startsWith("Bearer ") ? header.substring(7) : null;
    const token = bearer || req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ message: "Missing access token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // loginSuperAdmin created token as jwt.sign({ id }, JWT_SECRET)
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.user = { id: decoded.id };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}


