import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none font-sans relative overflow-hidden">
      {/* Decorative backdrop elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60"></div>

      <div className="relative z-10 max-w-md w-full">
        {/* Large 404 Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-100">
          <div className="text-8xl font-black text-slate-200 tracking-tighter mb-4 animate-bounce">
            404
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Page Not Found</h1>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            The page you are looking for doesn't exist, has been moved, or you don't have permission to access it.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all text-sm active:scale-95"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 px-5 py-3 rounded-2xl font-bold text-slate-700 transition-all text-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
