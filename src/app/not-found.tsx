import Link from 'next/link';
import { Home, BookOpen, Phone, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold text-2xl">
          404
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Page not found
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            The page you requested does not exist or may have been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-medium transition-colors"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Courses
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
          >
            <Phone className="w-4 h-4" />
            Contact
          </Link>
        </div>
      </div>
    </main>
  );
}
