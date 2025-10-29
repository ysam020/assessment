import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const SALT_ROUNDS = 10;

export async function signupHandler(controller, call, callback) {
  try {
    const { name, email, password } = call.request;

    // Validate input
    if (!name || !email || !password) {
      return controller.sendError(
        callback,
        grpc.status.INVALID_ARGUMENT,
        "Name, email, and password are required"
      );
    }

    // Email validation
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return controller.sendError(
        callback,
        grpc.status.INVALID_ARGUMENT,
        "Please provide a valid email address"
      );
    }

    // Password validation
    if (password.length < 6) {
      return controller.sendError(
        callback,
        grpc.status.INVALID_ARGUMENT,
        "Password must be at least 6 characters long"
      );
    }

    // Check if user already exists using model from controller
    const existingUser = await controller.model.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return controller.sendError(
        callback,
        grpc.status.ALREADY_EXISTS,
        "User with this email already exists"
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await controller.model.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin", // Admin-only signup as per requirement
    });

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store refresh token
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Send response
    callback(null, {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Signup error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return controller.sendError(
        callback,
        grpc.status.INVALID_ARGUMENT,
        messages.join(", ")
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return controller.sendError(
        callback,
        grpc.status.ALREADY_EXISTS,
        "User with this email already exists"
      );
    }

    controller.sendError(
      callback,
      grpc.status.INTERNAL,
      "An error occurred during signup"
    );
  }
}
