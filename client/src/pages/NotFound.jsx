import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import BrandMark from '../components/BrandMark';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-muted px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandMark size="md" tone="dark" asLink />
        </div>
        <div className="card p-8 sm:p-10">
          <p className="text-2xs font-medium uppercase tracking-[0.2em] text-slate-400">
            Error 404
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-slate-900">
            Page not found
          </h1>
          <p className="mt-2 text-base font-normal leading-relaxed text-slate-500">
            The page you&apos;re looking for doesn&apos;t exist, was moved, or you don&apos;t have access.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-2.5 sm:flex-row">
            <Link to="/" className="btn btn-primary px-5 py-2.5">
              <Home className="h-3.5 w-3.5" />
              Go home
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-secondary px-5 py-2.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
