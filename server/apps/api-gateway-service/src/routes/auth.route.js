import express from "express";
import { RequestValidator } from "@studyAbroad/grpc-utils";
import AuthController from "../controllers/auth.controller.js";

const router = express.Router();

// Admin signup
router.post(
  "/signup",
  RequestValidator.middleware(["name", "email", "password"]),
  AuthController.signup
);

// Admin signin
router.post(
  "/signin",
  RequestValidator.middleware(["email", "password"]),
  AuthController.signin
);

// Refresh access token
router.post(
  "/refresh-token",
  RequestValidator.middleware(["refreshToken"]),
  AuthController.refreshToken
);

// Logout
router.post("/logout", AuthController.logout);

export default router;
