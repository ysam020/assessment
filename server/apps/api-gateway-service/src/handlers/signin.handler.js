import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

export async function signinHandler(controller, call, callback) {
  try {
    const { email, password } = call.request;

    // Validate input
    if (!email || !password) {
      return controller.sendError(
        callback,
        grpc.status.INVALID_ARGUMENT,
        "Email and password are required"
      );
    }

    // Find user using model from controller
    const user = await controller.model.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return controller.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        "Invalid email or password"
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return controller.sendError(
        callback,
        grpc.status.PERMISSION_DENIED,
        "Account is deactivated"
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return controller.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        "Invalid email or password"
      );
    }

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

    // Update refresh token and last login
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
    console.error("Signin error:", error);
    controller.sendError(
      callback,
      grpc.status.INTERNAL,
      "An error occurred during signin"
    );
  }
}
