import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { AuthResponse } from "@studyAbroad/proto-defs/auth";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

// Handle signin
export async function signinHandler(controller, call, callback) {
  await controller.execute(call, callback, async () => {
    const { email, password } = call.request;

    // Validate required fields
    if (
      controller.validateFields(callback, { email, password }, [
        "email",
        "password",
      ])
    ) {
      return;
    }

    // Find user by email
    const user = await controller.model.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return controller.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        "Invalid email or password"
      );
    }

    // Verify password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return controller.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        "Invalid email or password"
      );
    }

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

    // Update refresh token and last login using Prisma
    await controller.model.update({
      where: { id: user.id },
      data: {
        refreshToken,
        lastLogin: new Date(),
      },
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
