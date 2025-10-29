import { apiClient, ApiResponse } from "./api";
import { authService } from "./auth";
import {
  Course,
  CourseSearchParams,
  CourseSearchResponse,
  CourseUploadResponse,
  CourseGetResponse,
} from "@/types/course";

class CourseService {
  async uploadCourses(file: File): Promise<ApiResponse<CourseUploadResponse>> {
    const token = authService.getAccessToken();

    if (!token) {
      return {
        success: false,
        error: "Authentication required",
      };
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GATEWAY_URL}/course/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || "Failed to upload courses",
        };
      }

      return data;
    } catch (error) {
      console.error("Course upload failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Network error occurred",
      };
    }
  }

  async searchCourses(
    params: CourseSearchParams = {}
  ): Promise<ApiResponse<CourseSearchResponse>> {
    const queryParams = new URLSearchParams();

    if (params.query) queryParams.append("query", params.query);
    if (params.category) queryParams.append("category", params.category);
    if (params.instructor) queryParams.append("instructor", params.instructor);
    if (params.skill_level)
      queryParams.append("skill_level", params.skill_level);
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.offset) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/course/search${queryString ? `?${queryString}` : ""}`;

    return apiClient.get<CourseSearchResponse>(endpoint);
  }

  async getCourse(courseId: string): Promise<ApiResponse<CourseGetResponse>> {
    return apiClient.get<CourseGetResponse>(`/course/${courseId}`);
  }

  async getCategories(): Promise<string[]> {
    const response = await this.searchCourses({ limit: 1000 });

    if (response.success && response.data) {
      const categories = new Set<string>();
      response.data.courses.forEach((course) => {
        if (course.category) {
          categories.add(course.category);
        }
      });
      return Array.from(categories).sort();
    }

    return [];
  }

  async getInstructors(): Promise<string[]> {
    const response = await this.searchCourses({ limit: 1000 });

    if (response.success && response.data) {
      const instructors = new Set<string>();
      response.data.courses.forEach((course) => {
        if (course.instructor) {
          instructors.add(course.instructor);
        }
      });
      return Array.from(instructors).sort();
    }

    return [];
  }
}

export const courseService = new CourseService();
