"use client";

import { Suspense } from "react";
import { ProfileContent } from "@/components/profile-content";

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl animate-bounce">🥑</div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
