import { RecommendationServiceService } from "@studyAbroad/proto-defs/recommendation";
import { BaseGrpcService } from "@studyAbroad/grpc-utils";
import RecommendationController from "./controllers/index.js";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Validate GEMINI_API_KEY
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined - using mock recommendations");
}

// Initialize controller
const recommendationController = new RecommendationController();

class RecommendationService {
  static async getRecommendations(call, callback) {
    await recommendationController.getRecommendations(call, callback);
  }
}

// Create and configure the gRPC service
const recommendationService = BaseGrpcService.createService(
  "RecommendationService",
  RecommendationServiceService,
  RecommendationService,
  { port: process.env.RECOMMENDATION_SERVICE_PORT || 50052 }
);

// Start the server
recommendationService.start().catch((err) => {
  console.error("Failed to start RecommendationService:", err);
  process.exit(1);
});

console.log(
  "RecommendationService initialized and ready to accept connections"
);
