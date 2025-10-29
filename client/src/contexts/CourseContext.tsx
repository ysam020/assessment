"use client";

import React, { createContext, useState, useCallback } from "react";
import { courseService } from "@/lib/course";
import {
  Course,
  CourseSearchParams,
  CourseSearchResponse,
} from "@/types/course";
import { useToast } from "@/hooks/use-toast";

interface CourseContextType {
  courses: Course[];
  totalCount: number;
  isLoading: boolean;
  selectedCourse: Course | null;
  searchCourses: (params?: CourseSearchParams) => Promise<boolean>;
  getCourse: (courseId: string) => Promise<boolean>;
  uploadCourses: (file: File) => Promise<boolean>;
  clearCourses: () => void;
}

export const CourseContext = createContext<CourseContextType | undefined>(
  undefined
);

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { toast } = useToast();

  const searchCourses = useCallback(
    async (params: CourseSearchParams = {}): Promise<boolean> => {
      try {
        setIsLoading(true);
        const response = await courseService.searchCourses(params);

        if (response.success && response.data) {
          setCourses(response.data.courses);
          setTotalCount(response.data.totalCount);

          // Optional: Show toast if results are from cache
          if (response.data.fromCache) {
            console.log("Results loaded from cache");
          }

          return true;
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to search courses",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred while searching",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const getCourse = useCallback(
    async (courseId: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        const response = await courseService.getCourse(courseId);

        if (response.success && response.data?.course) {
          setSelectedCourse(response.data.course);
          return true;
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to load course",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const uploadCourses = useCallback(
    async (file: File): Promise<boolean> => {
      try {
        setIsLoading(true);
        const response = await courseService.uploadCourses(file);

        if (response.success && response.data) {
          toast({
            title: "Success",
            description: `Successfully uploaded ${response.data.coursesUploaded} courses and indexed ${response.data.coursesIndexed} in search`,
          });
          return true;
        } else {
          toast({
            title: "Error",
            description: response.error || "Failed to upload courses",
            variant: "destructive",
          });
          return false;
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred during upload",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  const clearCourses = useCallback(() => {
    setCourses([]);
    setTotalCount(0);
    setSelectedCourse(null);
  }, []);

  const value: CourseContextType = {
    courses,
    totalCount,
    isLoading,
    selectedCourse,
    searchCourses,
    getCourse,
    uploadCourses,
    clearCourses,
  };

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
};
