import express from "express";
import { RequestValidator } from "@studyAbroad/grpc-utils";
import { jwtMiddleware } from "../middlewares/auth.middleware.js";
import RecommendationController from "../controllers/recommendation.controller.js";

const router = express.Router();

// POST /api/v1/recommendations
router.post(
  "/",
  jwtMiddleware, // Protect with JWT authentication
  RequestValidator.middleware(["topics", "skill_level"]),
  RecommendationController.getRecommendations
);

// GET /api/v1/recommendations/health
router.get("/health", RecommendationController.health);

export default router;
