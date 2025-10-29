import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { AuthResponse } from "@studyAbroad/proto-defs/auth";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const SALT_ROUNDS = 10;

// Handle admin signup
export async function signupHandler(controller, call, callback) {
  await controller.execute(call, callback, async () => {
    const { name, email, password } = call.request;

    // Validate required fields
    if (
      controller.validateFields(callback, { name, email, password }, [
        "name",
        "email",
        "password",
      ])
    ) {
      return;
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

    // Check if user already exists
    const existingUser = await controller.model.findUnique({
      where: {
        email: email.toLowerCase(),
      },
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
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
      },
    });

    // Prepare user payload for JWT
    const userPayload = {
      userId: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // Generate tokens
    const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Update user with refresh token
    await controller.model.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Send success response
    controller.sendSuccess(callback, AuthResponse, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      accessToken,
      refreshToken,
    });
  });
}
