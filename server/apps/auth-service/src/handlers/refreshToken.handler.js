import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";
import { RefreshTokenResponse } from "@studyAbroad/proto-defs/auth";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

// Handle refresh token request
export async function refreshTokenHandler(controller, call, callback) {
  await controller.execute(call, callback, async () => {
    const { refreshToken } = call.request;

    // Validate required field
    if (
      controller.validateFields(callback, { refreshToken }, ["refreshToken"])
    ) {
      return;
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // Find user by ID from token
      const user = await controller.model.findUnique({
        where: {
          id: decoded.userId,
        },
      });

      if (!user) {
        return controller.sendError(
          callback,
          grpc.status.UNAUTHENTICATED,
          "User not found"
        );
      }

      // Verify the refresh token matches the one stored in database
      if (user.refreshToken !== refreshToken) {
        return controller.sendError(
          callback,
          grpc.status.UNAUTHENTICATED,
          "Invalid refresh token"
        );
      }

      // Prepare user payload for new JWT
      const userPayload = {
        userId: user.id,
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      };

      // Generate new tokens
      const newAccessToken = jwt.sign(userPayload, JWT_SECRET, {
        expiresIn: "1h",
      });
      const newRefreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Update refresh token in database using Prisma
      await controller.model.update({
        where: { id: user.id },
        data: { refreshToken: newRefreshToken },
      });

      // Send success response
      controller.sendSuccess(callback, RefreshTokenResponse, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error("Refresh token error:", error);

      if (error.name === "JsonWebTokenError") {
        return controller.sendError(
          callback,
          grpc.status.UNAUTHENTICATED,
          "Invalid refresh token"
        );
      }

      if (error.name === "TokenExpiredError") {
        return controller.sendError(
          callback,
          grpc.status.UNAUTHENTICATED,
          "Refresh token expired"
        );
      }

      return controller.sendError(
        callback,
        grpc.status.INTERNAL,
        "Failed to refresh token"
      );
    }
  });
}
