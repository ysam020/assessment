"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { CourseProvider } from "@/contexts/CourseContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CourseProvider>{children}</CourseProvider>
    </AuthProvider>
  );
}
