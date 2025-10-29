"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useCourse } from "@/hooks/use-course";

interface UploadCardProps {
  title: string;
  description: string;
  templateName: string;
  onUpload: (file: File) => Promise<void>;
}

function UploadCard({
  title,
  description,
  templateName,
  onUpload,
}: UploadCardProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create sample CSV template
    const headers = [
      "course_id",
      "title",
      "description",
      "category",
      "instructor",
      "duration",
      "skill_level",
      "tags",
    ].join(",");

    const sampleRow = [
      "CS101",
      "Introduction to Computer Science",
      "Learn the fundamentals of computer science",
      "Computer Science",
      "Dr. John Smith",
      "8 weeks",
      "beginner",
      "programming,algorithms,data-structures",
    ].join(",");

    const csvContent = `${headers}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`file-${title}`}>Select CSV File</Label>
          <Input
            ref={fileInputRef}
            id={`file-${title}`}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground mt-2">
              Selected: {selectedFile.name}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" /> Upload CSV
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            disabled={uploading}
          >
            Download Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { uploadCourses } = useCourse();

  const handleCourseUpload = async (file: File) => {
    await uploadCourses(file);
  };

  const handleUniversityUpload = async (file: File) => {
    // University upload logic (to be implemented)
    console.log("University upload:", file.name);
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage course and university data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard
          title="Upload Course Data"
          description="Upload course information in CSV format"
          templateName="course_template.csv"
          onUpload={handleCourseUpload}
        />

        <UploadCard
          title="Upload University Data"
          description="Upload university information in CSV format"
          templateName="university_template.csv"
          onUpload={handleUniversityUpload}
        />
      </div>
    </div>
  );
}
