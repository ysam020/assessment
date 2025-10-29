"use client";

import { useState, useMemo, useEffect } from "react";
import { useCourse } from "@/hooks/use-course";
import { Course } from "@/types/course";
import CourseCard from "@/components/course-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Compass,
  Search,
  SlidersHorizontal,
  Sparkles,
  Loader2,
} from "lucide-react";

export default function Home() {
  const { courses, totalCount, isLoading, searchCourses } = useCourse();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [courseLevel, setCourseLevel] = useState("all");

  // Extract unique values from loaded courses for filters
  const categories = useMemo(() => {
    const uniqueCategories = new Set(courses.map((course) => course.category));
    return ["all", ...Array.from(uniqueCategories)].filter(Boolean);
  }, [courses]);

  const instructors = useMemo(() => {
    const uniqueInstructors = new Set(
      courses.map((course) => course.instructor)
    );
    return ["all", ...Array.from(uniqueInstructors)].filter(Boolean);
  }, [courses]);

  const courseLevels = ["all", "beginner", "intermediate", "advanced"];

  // Load courses on component mount
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = () => {
    const params: any = {
      limit: 100,
      offset: 0,
    };

    if (searchTerm.trim()) {
      params.query = searchTerm.trim();
    }
    if (selectedCategory !== "all") {
      params.category = selectedCategory;
    }
    if (selectedInstructor !== "all") {
      params.instructor = selectedInstructor;
    }
    if (courseLevel !== "all") {
      params.skill_level = courseLevel;
    }

    searchCourses(params);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedInstructor("all");
    setCourseLevel("all");
    searchCourses({ limit: 100 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="bg-background text-foreground">
      <section className="text-center py-20 px-4 bg-card border-b">
        <h1 className="font-headline text-5xl md:text-6xl font-extrabold tracking-tight text-primary">
          Find Your Perfect Course
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Navigate the world of education with Course Compass. Search thousands
          of courses from top universities to find the one that's right for you.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="#search">
              <Compass className="mr-2" /> Start Exploring
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/course-match">
              <Sparkles className="mr-2" /> AI Course Match
            </Link>
          </Button>
        </div>
      </section>

      <section id="search" className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="p-6 rounded-lg bg-card shadow-sm sticky top-24">
              <h3 className="font-headline text-2xl font-semibold mb-6 flex items-center gap-2 text-primary">
                <SlidersHorizontal />
                Filters
              </h3>
              <div className="space-y-6">
                <div>
                  <label htmlFor="search-term" className="text-sm font-medium">
                    Search by Keyword
                  </label>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="search-term"
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="text-sm font-medium">
                    Category
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="category" className="w-full mt-2">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="capitalize"
                        >
                          {category === "all" ? "All Categories" : category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="instructor" className="text-sm font-medium">
                    Instructor
                  </label>
                  <Select
                    value={selectedInstructor}
                    onValueChange={setSelectedInstructor}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="instructor" className="w-full mt-2">
                      <SelectValue placeholder="All Instructors" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.map((instructor) => (
                        <SelectItem key={instructor} value={instructor}>
                          {instructor === "all"
                            ? "All Instructors"
                            : instructor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="course-level" className="text-sm font-medium">
                    Skill Level
                  </label>
                  <Select
                    value={courseLevel}
                    onValueChange={setCourseLevel}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="course-level" className="w-full mt-2">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseLevels.map((level) => (
                        <SelectItem
                          key={level}
                          value={level}
                          className="capitalize"
                        >
                          {level === "all" ? "All Levels" : level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSearch}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    disabled={isLoading}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <h2 className="font-headline text-3xl font-bold mb-6 text-primary">
              {isLoading && courses.length === 0 ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading courses...
                </span>
              ) : (
                `${totalCount} Courses Found`
              )}
            </h2>

            {isLoading && courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center bg-card rounded-lg p-12 h-full">
                <Loader2 className="h-16 w-16 text-muted-foreground/50 mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-primary">
                  Loading Courses
                </h3>
                <p className="text-muted-foreground mt-2">
                  Please wait while we fetch the courses...
                </p>
              </div>
            ) : courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center bg-card rounded-lg p-12 h-full">
                <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold text-primary">
                  No Courses Found
                </h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your filters to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
