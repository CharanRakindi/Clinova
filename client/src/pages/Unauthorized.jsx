import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-muted px-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />

      <div className="relative z-10 w-full max-w-md">
        <div className="card p-8 sm:p-10">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
            <ShieldAlert className="h-5 w-5" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-slate-900">
            Access denied
          </h1>
          <p className="mt-2 text-base font-normal leading-relaxed text-slate-500">
            You don&apos;t have permission to view this page. If you believe this is an error, contact your administrator.
          </p>
          <div className="mt-8">
            <Link to="/" className="btn btn-primary px-6 py-2.5">
              Return home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
