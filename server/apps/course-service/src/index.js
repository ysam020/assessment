import { CourseServiceService } from "@studyAbroad/proto-defs/course";
import { BaseGrpcService } from "@studyAbroad/grpc-utils";
import CourseController from "./controllers/index.js";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

// Validate environment variables
const requiredEnvVars = ["ELASTICSEARCH_NODE", "REDIS_HOST", "REDIS_PORT"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`${envVar} is not defined - service may not work correctly`);
  }
}

// Initialize controller
const courseController = new CourseController();

class CourseService {
  static async uploadCourses(call, callback) {
    await courseController.uploadCourses(call, callback);
  }

  static async searchCourses(call, callback) {
    await courseController.searchCourses(call, callback);
  }

  static async getCourse(call, callback) {
    await courseController.getCourse(call, callback);
  }
}

// Create and configure the gRPC service
const courseService = BaseGrpcService.createService(
  "CourseService",
  CourseServiceService,
  CourseService,
  { port: process.env.COURSE_SERVICE_PORT || 50053 }
);

// Start the server
courseService.start().catch((err) => {
  console.error("Failed to start CourseService:", err);
  process.exit(1);
});

console.log("CourseService initialized and ready to accept connections");
