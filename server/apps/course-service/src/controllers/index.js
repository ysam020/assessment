import grpc from "@grpc/grpc-js";
import { BaseServiceController } from "@studyAbroad/grpc-utils";
import prisma from "@studyAbroad/prisma";
import { ElasticsearchService } from "../services/elasticsearch.service.js";
import { RedisCacheService } from "../services/redis.service.js";

class CourseController extends BaseServiceController {
  constructor() {
    super();

    // Initialize Elasticsearch service
    this.elasticsearchService = new ElasticsearchService();

    // Initialize Redis cache service
    this.redisService = new RedisCacheService();

    console.log("CourseController initialized with Elasticsearch and Redis");
  }

  // Upload courses from CSV data to MongoDB and index in Elasticsearch
  async uploadCourses(call, callback) {
    await this.execute(call, callback, async () => {
      const { courses } = call.request;

      // Validation
      if (!courses || courses.length === 0) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "At least one course is required",
        });
      }

      try {
        let uploadedCount = 0;
        let indexedCount = 0;
        const coursesToIndex = [];

        // Upload courses to MongoDB
        for (const courseData of courses) {
          // Validate required fields
          const requiredFields = [
            "course_id",
            "title",
            "description",
            "category",
            "instructor",
            "duration",
          ];
          const missingFields = requiredFields.filter(
            (field) => !courseData[field]
          );

          if (missingFields.length > 0) {
            console.warn(
              `Skipping course - missing fields: ${missingFields.join(", ")}`
            );
            continue;
          }

          try {
            // Create or update course in MongoDB
            const course = await prisma.course.upsert({
              where: { courseId: courseData.course_id },
              update: {
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                instructor: courseData.instructor,
                duration: courseData.duration,
                skillLevel: courseData.skill_level || "beginner",
                tags: courseData.tags || [],
                updatedAt: new Date(),
              },
              create: {
                courseId: courseData.course_id,
                title: courseData.title,
                description: courseData.description,
                category: courseData.category,
                instructor: courseData.instructor,
                duration: courseData.duration,
                skillLevel: courseData.skill_level || "beginner",
                tags: courseData.tags || [],
                isActive: true,
              },
            });

            uploadedCount++;

            // Prepare for Elasticsearch indexing
            coursesToIndex.push({
              id: course.id,
              courseId: course.courseId,
              title: course.title,
              description: course.description,
              category: course.category,
              instructor: course.instructor,
              duration: course.duration,
              skillLevel: course.skillLevel,
              tags: course.tags,
            });
          } catch (error) {
            console.error(
              `Error uploading course ${courseData.course_id}:`,
              error.message
            );
          }
        }

        // Index courses in Elasticsearch
        if (coursesToIndex.length > 0) {
          indexedCount =
            await this.elasticsearchService.bulkIndexCourses(coursesToIndex);
        }

        // Return success response
        return callback(null, {
          success: true,
          message: `Successfully uploaded ${uploadedCount} courses and indexed ${indexedCount} in Elasticsearch`,
          courses_uploaded: uploadedCount,
          courses_indexed: indexedCount,
        });
      } catch (error) {
        console.error("Error in uploadCourses:", error);
        return callback({
          code: grpc.status.INTERNAL,
          message: `Failed to upload courses: ${error.message}`,
        });
      }
    });
  }

  // Search courses using Elasticsearch with Redis caching
  async searchCourses(call, callback) {
    await this.execute(call, callback, async () => {
      const {
        query,
        category,
        instructor,
        skill_level,
        limit = 10,
        offset = 0,
      } = call.request;

      try {
        // Create cache key based on search parameters
        const cacheKey = this.redisService.createSearchCacheKey({
          query,
          category,
          instructor,
          skill_level,
          limit,
          offset,
        });

        // Check Redis cache first
        const cachedResult = await this.redisService.get(cacheKey);
        if (cachedResult) {
          return callback(null, {
            courses: cachedResult.courses || [],
            total_count: cachedResult.total_count || 0,
            message: cachedResult.message || "Results from cache",
            from_cache: true,
          });
        }

        // Search Elasticsearch
        const searchResults = await this.elasticsearchService.searchCourses({
          query,
          category,
          instructor,
          skill_level,
          limit,
          offset,
        });

        const response = {
          courses: searchResults.courses,
          total_count: searchResults.total,
          message: `Found ${searchResults.total} courses`,
          from_cache: false,
        };

        // Cache the results
        await this.redisService.set(cacheKey, response, 300);
        return callback(null, response);
      } catch (error) {
        console.error("Error in searchCourses:", error);
        return callback({
          code: grpc.status.INTERNAL,
          message: `Failed to search courses: ${error.message}`,
        });
      }
    });
  }

  // Get a single course by ID with Redis caching
  async getCourse(call, callback) {
    await this.execute(call, callback, async () => {
      const { course_id } = call.request;

      // Validation
      if (!course_id) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: "Course ID is required",
        });
      }

      try {
        // Create cache key
        const cacheKey = `course:${course_id}`;

        // Check Redis cache first
        const cachedCourse = await this.redisService.get(cacheKey);
        if (cachedCourse) {
          return callback(null, {
            course: cachedCourse,
            message: "Course retrieved from cache",
            from_cache: true,
          });
        }

        // Fetch from MongoDB using Prisma
        const course = await prisma.course.findUnique({
          where: { courseId: course_id },
        });

        if (!course) {
          return callback({
            code: grpc.status.NOT_FOUND,
            message: `Course not found: ${course_id}`,
          });
        }

        // Format course data
        const formattedCourse = {
          id: course.id,
          course_id: course.courseId,
          title: course.title,
          description: course.description,
          category: course.category,
          instructor: course.instructor,
          duration: course.duration,
          skill_level: course.skillLevel,
          tags: course.tags,
          relevance_score: 0, // Default score for direct retrieval
        };

        // Cache the course (expire in 1 hour)
        await this.redisService.set(cacheKey, formattedCourse, 3600);

        return callback(null, {
          course: formattedCourse,
          message: "Course retrieved successfully",
          from_cache: false,
        });
      } catch (error) {
        console.error("Error in getCourse:", error);
        return callback({
          code: grpc.status.INTERNAL,
          message: `Failed to get course: ${error.message}`,
        });
      }
    });
  }
}

export default CourseController;
