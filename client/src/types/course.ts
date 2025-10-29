export interface Course {
  id: string;
  courseId: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  tags: string[];
  relevanceScore?: number;
}

export interface CourseSearchParams {
  query?: string;
  category?: string;
  instructor?: string;
  skill_level?: string;
  limit?: number;
  offset?: number;
}

export interface CourseSearchResponse {
  courses: Course[];
  totalCount: number;
  fromCache: boolean;
}

export interface CourseUploadResponse {
  success: boolean;
  coursesUploaded: number;
  coursesIndexed: number;
}

export interface CourseGetResponse {
  course: Course | null;
  fromCache: boolean;
}
