import jwt from "jsonwebtoken";
import grpc from "@grpc/grpc-js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key";

export async function refreshTokenHandler(controller, call, callback) {
  try {
    const { refreshToken } = call.request;

    if (!refreshToken) {
      return controller.sendError(
        callback,
        grpc.status.INVALID_ARGUMENT,
        "Refresh token is required"
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (error) {
      return controller.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        error.name === "TokenExpiredError"
          ? "Refresh token has expired"
          : "Invalid refresh token"
      );
    }

    // Find user and verify stored refresh token
    const user = await controller.model.findById(decoded.userId);
    if (!user) {
      return controller.sendError(
        callback,
        grpc.status.NOT_FOUND,
        "User not found"
      );
    }

    if (user.refreshToken !== refreshToken) {
      return controller.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        "Invalid refresh token"
      );
    }

    if (!user.isActive) {
      return controller.sendError(
        callback,
        grpc.status.PERMISSION_DENIED,
        "Account is deactivated"
      );
    }

    // Generate new tokens
    const newAccessToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const newRefreshToken = jwt.sign(
      { userId: user._id.toString() },
      JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Update stored refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Send response
    callback(null, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    controller.sendError(
      callback,
      grpc.status.INTERNAL,
      "An error occurred during token refresh"
    );
  }
}
