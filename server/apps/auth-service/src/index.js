import { AuthServiceService } from "@studyAbroad/proto-defs/auth";
import { BaseGrpcService } from "@studyAbroad/grpc-utils";
import AuthController from "./controllers/index.js";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Validate JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

// Initialize controller
const authController = new AuthController();

class AuthService {
  static async signup(call, callback) {
    await authController.signup(call, callback);
  }

  static async signin(call, callback) {
    await authController.signin(call, callback);
  }

  static async refreshToken(call, callback) {
    await authController.refreshToken(call, callback);
  }
}

// Create and configure the gRPC service
const authService = BaseGrpcService.createService(
  "AuthService",
  AuthServiceService,
  AuthService,
  { port: process.env.AUTH_SERVICE_PORT || 50051 }
);

// Start the server
authService.start().catch((err) => {
  console.error("Failed to start AuthService:", err);
  process.exit(1);
});

console.log("AuthService initialized and ready to accept connections");
