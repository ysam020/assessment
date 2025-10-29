import BaseController from "./base.controller.js";
import { grpcClientManager, ResponseFormatter } from "@studyAbroad/grpc-utils";
import { RecommendationServiceClient } from "@studyAbroad/proto-defs/recommendation";

// Delegates recommendation requests to Recommendation Service via gRPC
class RecommendationController extends BaseController {
  constructor() {
    // Initialize gRPC client for Recommendation Service
    const recommendationClient = grpcClientManager.getClient(
      "RECOMMENDATION_SERVICE",
      RecommendationServiceClient
    );
    super(recommendationClient);
  }

  // POST /api/v1/recommendations
  getRecommendations = async (req, res) => {
    const payload = {
      topics: req.body.topics || [],
      skill_level: req.body.skill_level || "",
      preferred_duration: req.body.preferred_duration || "",
      limit: req.body.limit || 5,
    };

    await this.executeGrpcCall(req, res, "getRecommendations", payload, {
      transformer: (response) => ({
        recommendations: response.recommendations.map((rec) => ({
          title: rec.title,
          description: rec.description,
          category: rec.category,
          skillLevel: rec.skill_level,
          duration: rec.duration,
          instructor: rec.instructor,
          relevanceScore: rec.relevance_score,
          topics: rec.topics,
        })),
        totalCount: response.total_count,
      }),
      successMessage: (response) =>
        response.message || "Recommendations generated successfully",
      errorMessage: "Failed to generate recommendations",
    });
  };

  // GET /api/v1/recommendations/health
  health = async (req, res) => {
    ResponseFormatter.success(res, {
      service: "Recommendation Service",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  };
}

export default new RecommendationController();
