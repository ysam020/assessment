"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCourse } from "@/hooks/use-course";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Clock, User, Tag, BookOpen } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedCourse, isLoading, getCourse } = useCourse();
  const courseId = params.id as string;

  useEffect(() => {
    if (courseId) {
      getCourse(courseId);
    }
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">
            Loading course details...
          </span>
        </div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center py-24">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The course you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto py-12 px-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Search
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="bg-card">
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant="secondary"
                    className="capitalize text-base px-4 py-2"
                  >
                    {selectedCourse.skillLevel}
                  </Badge>
                  <Badge variant="outline" className="text-base px-4 py-2">
                    {selectedCourse.category}
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-bold text-primary">
                  {selectedCourse.title}
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Course ID: {selectedCourse.courseId}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-6">
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Course Description
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>

                  {/* Tags/Topics */}
                  {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Topics Covered
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCourse.tags.map((tag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-sm"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Instructor</p>
                    <p className="text-muted-foreground">
                      {selectedCourse.instructor}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Duration</p>
                    <p className="text-muted-foreground">
                      {selectedCourse.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-muted-foreground">
                      {selectedCourse.category}
                    </p>
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <Button className="w-full" size="lg">
                    Enroll Now
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    Add to Wishlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
