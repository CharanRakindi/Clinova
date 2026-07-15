import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, KeyRound, Eye, Server } from 'lucide-react';
import BrandMark from '../components/BrandMark';

const PILLARS = [
  {
    icon: Lock,
    title: 'HttpOnly session cookies',
    body: 'Access and refresh tokens are never stored in localStorage. Cookies reduce XSS token theft risk for this demo stack.',
  },
  {
    icon: KeyRound,
    title: 'Role-based access control',
    body: 'Patients, doctors, reception, lab, and admin each see only the routes and APIs their role allows.',
  },
  {
    icon: Eye,
    title: 'Care-relationship gates',
    body: 'Clinical charts open only after a confirmed care link (assignment or confirmed/completed visit)—not mere booking requests.',
  },
  {
    icon: FileText,
    title: 'Audit logging',
    body: 'Sensitive staff actions write to an immutable-style audit trail for demo accountability reviews.',
  },
  {
    icon: Server,
    title: 'CSRF double-submit',
    body: 'State-changing API calls require a CSRF cookie header pair in production mode.',
  },
  {
    icon: Shield,
    title: 'Honest scope',
    body: 'Clinova is a portfolio product—not HIPAA certified and not a production EHR. Use it to evaluate engineering quality, not compliance claims.',
  },
];

export default function Security() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-4 sm:px-8">
          <BrandMark size="sm" tone="dark" asLink />
          <div className="flex gap-2">
            <Link to="/login" className="btn btn-secondary btn-sm">
              Sign in
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
        <p className="ui-label text-sky-600">Trust & design</p>
        <h1 className="mt-2 font-display text-3xl text-ink sm:text-[2.25rem]">
          How Clinova handles security
        </h1>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          A plain-language overview of controls in this demo—aligned with the About section’s
          “calm, secure” promise without overclaiming certification.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="card p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-600">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <h2 className="text-sm font-medium text-ink">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{body}</p>
            </article>
          ))}
        </div>

        <div className="surface-inverse-panel mt-10 p-6 sm:p-8">
          <p className="relative z-10 text-sm leading-relaxed text-white/70">
            Need a deeper review? Walk through seed accounts on the login page, open audit logs as
            admin, and inspect care-gated doctor charts after confirming an appointment.
          </p>
          <Link
            to="/login"
            className="relative z-10 mt-4 inline-flex btn bg-white text-ink hover:bg-white/95"
          >
            Open demo sign-in
          </Link>
        </div>
      </main>
    </div>
  );
}
