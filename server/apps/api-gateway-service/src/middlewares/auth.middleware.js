import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// JWT middleware to protect routes
export function jwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: "Authorization header missing",
    });
  }

  // Extract token from "Bearer <token>" format
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Token not provided",
    });
  }

  try {
    // Verify and decode the token
    const payload = jwt.verify(token, JWT_SECRET);

    // Attach user info to request object
    req.user = payload;

    // Continue
    next();
  } catch (err) {
    console.error("JWT verification error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
}

// Admin-only middleware
export function adminOnlyMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }

  next();
}
