import express from "express";
import { jwtMiddleware } from "../middlewares/auth.middleware.js";
import CourseController from "../controllers/course.controller.js";

const router = express.Router();

// POST /api/v1/courses/upload
router.post(
  "/upload",
  jwtMiddleware, // Protect with JWT authentication
  CourseController.upload.single("file"), // Multer middleware for file upload
  CourseController.uploadCourses
);

// GET /api/v1/courses/search
router.get("/search", CourseController.searchCourses);

// GET /api/v1/courses/:courseId
router.get("/:courseId", CourseController.getCourse);

// GET /api/v1/courses/health

export default router;
