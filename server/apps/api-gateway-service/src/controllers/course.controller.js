import BaseController from "./base.controller.js";
import { grpcClientManager, ResponseFormatter } from "@studyAbroad/grpc-utils";
import { CourseServiceClient } from "@studyAbroad/proto-defs/course";
import multer from "multer";
import csvParser from "csv-parser";
import { Readable } from "stream";

// Delegates course requests to Course Service via gRPC
class CourseController extends BaseController {
  constructor() {
    // Initialize gRPC client for Course Service
    const courseClient = grpcClientManager.getClient(
      "COURSE_SERVICE",
      CourseServiceClient
    );
    super(courseClient);

    // Configure multer for file uploads
    this.upload = multer({
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === "text/csv" ||
          file.originalname.endsWith(".csv")
        ) {
          cb(null, true);
        } else {
          cb(new Error("Only CSV files are allowed"), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    });
  }

  // POST /api/v1/courses/upload
  uploadCourses = async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return ResponseFormatter.error(res, "No CSV file uploaded", 400);
      }

      // Parse CSV file
      const courses = await this.parseCSV(req.file.buffer);

      if (courses.length === 0) {
        return ResponseFormatter.error(
          res,
          "No valid courses found in CSV",
          400
        );
      }

      // Prepare payload for gRPC
      const payload = { courses };

      // Call gRPC service
      await this.executeGrpcCall(req, res, "uploadCourses", payload, {
        transformer: (response) => ({
          success: response.success,
          coursesUploaded: response.courses_uploaded,
          coursesIndexed: response.courses_indexed,
        }),
        successMessage: (response) => response.message,
        errorMessage: "Failed to upload courses",
      });
    } catch (error) {
      console.error("Error uploading courses:", error);
      ResponseFormatter.error(
        res,
        `Failed to upload courses: ${error.message}`,
        500
      );
    }
  };

  // Parse CSV buffer into course objects
  parseCSV(buffer) {
    return new Promise((resolve, reject) => {
      const courses = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csvParser())
        .on("data", (row) => {
          // Expected columns: course_id, title, description, category, instructor, duration, skill_level, tags
          const course = {
            course_id: row.course_id || row.courseId || row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            instructor: row.instructor,
            duration: row.duration,
            skill_level: row.skill_level || row.skillLevel || "beginner",
            tags: row.tags ? row.tags.split(",").map((tag) => tag.trim()) : [],
          };

          // Validate required fields
          if (
            course.course_id &&
            course.title &&
            course.description &&
            course.category &&
            course.instructor &&
            course.duration
          ) {
            courses.push(course);
          } else {
            console.warn(`Skipping invalid row:`, row);
          }
        })
        .on("end", () => {
          resolve(courses);
        })
        .on("error", (error) => {
          reject(error);
        });
    });
  }

  // GET /api/v1/courses/search
  searchCourses = async (req, res) => {
    const payload = {
      query: req.query.query || "",
      category: req.query.category || "",
      instructor: req.query.instructor || "",
      skill_level: req.query.skill_level || "",
      limit: parseInt(req.query.limit) || 10,
      offset: parseInt(req.query.offset) || 0,
    };

    await this.executeGrpcCall(req, res, "searchCourses", payload, {
      transformer: (response) => ({
        courses: response.courses.map((course) => ({
          id: course.id,
          courseId: course.course_id,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          skillLevel: course.skill_level,
          tags: course.tags,
          relevanceScore: course.relevance_score,
        })),
        totalCount: response.total_count,
        fromCache: response.from_cache,
      }),
      successMessage: (response) => response.message,
      errorMessage: "Failed to search courses",
    });
  };

  // GET /api/v1/courses/:courseId
  getCourse = async (req, res) => {
    const payload = {
      course_id: req.params.courseId,
    };

    await this.executeGrpcCall(req, res, "getCourse", payload, {
      transformer: (response) => ({
        course: response.course
          ? {
              id: response.course.id,
              courseId: response.course.course_id,
              title: response.course.title,
              description: response.course.description,
              category: response.course.category,
              instructor: response.course.instructor,
              duration: response.course.duration,
              skillLevel: response.course.skill_level,
              tags: response.course.tags,
            }
          : null,
        fromCache: response.from_cache,
      }),
      successMessage: (response) => response.message,
      errorMessage: "Failed to get course",
    });
  };

  // GET /api/v1/courses/health
  health = async (req, res) => {
    ResponseFormatter.success(res, {
      service: "Course Service",
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  };
}

export default new CourseController();
