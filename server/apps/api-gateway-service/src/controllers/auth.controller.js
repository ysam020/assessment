import BaseController from "./base.controller.js";
import { grpcClientManager, ResponseFormatter } from "@studyAbroad/grpc-utils";
import { AuthServiceClient } from "@studyAbroad/proto-defs/auth";

class AuthController extends BaseController {
  constructor() {
    // Initialize gRPC client for Auth Service
    const authClient = grpcClientManager.getClient(
      "AUTH_SERVICE",
      AuthServiceClient
    );
    super(authClient);
  }

  // POST /api/v1/auth/signup
  signup = async (req, res) => {
    const payload = this.extractFields(req, ["name", "email", "password"]);
    await this.executeGrpcCall(req, res, "signup", payload, {
      transformer: (response) => ({
        user: this.sanitizeUser(response.user),
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      }),
      successMessage: "Admin registered successfully",
      errorMessage: "Failed to register admin",
      statusCode: 201,
    });
  };

  // POST /api/v1/auth/signin
  signin = async (req, res) => {
    const payload = this.extractFields(req, ["email", "password"]);

    await this.executeGrpcCall(req, res, "signin", payload, {
      transformer: (response) => ({
        user: this.sanitizeUser(response.user),
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      }),
      successMessage: "Signed in successfully",
      errorMessage: "Failed to sign in",
    });
  };

  // POST /api/v1/auth/refresh-token
  refreshToken = async (req, res) => {
    const payload = this.extractFields(req, ["refreshToken"]);

    await this.executeGrpcCall(req, res, "refreshToken", payload, {
      transformer: (response) => ({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      }),
      successMessage: (response) =>
        response.message || "Tokens refreshed successfully",
      errorMessage: "Failed to refresh token",
    });
  };

  // POST /api/v1/auth/logout
  logout = async (req, res) => {
    ResponseFormatter.success(res, null, "Logged out successfully");
  };
}

export default new AuthController();
