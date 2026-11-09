'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentMyCoursesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/my-learning?tab=courses');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-3 border-[#0056b3] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-bold text-slate-600">
        Opening your enrolled courses in My Learning Hub...
      </p>
    </div>
  );
}
