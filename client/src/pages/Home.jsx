import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
  Stethoscope,
  Lock,
  FileText,
  CalendarCheck2,
  ChevronRight,
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'Security', href: '#security' },
  { label: 'For teams', href: '#teams' },
];

const FEATURES = [
  {
    icon: Lock,
    title: 'Enterprise security',
    body: 'End-to-end encryption on every record, role-based access control, and HIPAA-aligned audit trails by default.',
  },
  {
    icon: Stethoscope,
    title: 'Built for clinical work',
    body: 'Patient history, labs, and notes live in one continuous view — designed around how care is actually delivered.',
  },
  {
    icon: CalendarCheck2,
    title: 'Scheduling that stays in sync',
    body: 'Appointments update in real time across doctors, patients, and front-desk staff, with zero manual reconciliation.',
  },
];

/**
 * Static, stylized preview of the product surface.
 * Not a screenshot — built from the same primitives (cards, sidebar,
 * elevation) the real dashboard uses, so it never goes stale.
 */
const DashboardPreview = () => (
  <div className="relative mx-auto max-w-4xl">
    <div className="absolute inset-0 translate-y-6 scale-[0.97] rounded-[28px] bg-slate-900/[0.04] blur-2xl" aria-hidden="true" />
    <div className="relative overflow-hidden rounded-[20px] border border-slate-200/70 bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.25)]">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
      </div>

      <div className="flex">
        {/* mini sidebar */}
        <div className="hidden w-44 shrink-0 border-r border-slate-100 bg-slate-50/60 p-4 sm:block">
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-800">Clinova</span>
          </div>
          <div className="space-y-1">
            {['Dashboard', 'Patients', 'Schedule', 'Lab reports'].map((item, i) => (
              <div
                key={item}
                className={`rounded-lg px-2.5 py-1.5 text-[12px] font-medium ${i === 0 ? 'bg-primary-50 text-primary-700' : 'text-slate-500'
                  }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* mini content */}
        <div className="flex-1 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Good morning, Dr. Rao</div>
              <div className="text-[11px] text-slate-400">Tuesday, 9 June</div>
            </div>
            <div className="h-7 w-7 rounded-full bg-slate-100" />
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Patients today', value: '18' },
              { label: 'Pending labs', value: '4' },
              { label: 'Avg. wait', value: '6m' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                <div className="text-[16px] font-semibold text-slate-900">{stat.value}</div>
                <div className="mt-0.5 text-[10.5px] text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-700">Patient volume</span>
              <span className="text-[10.5px] text-slate-400">Last 7 days</span>
            </div>
            <div className="flex h-16 items-end gap-2">
              {[40, 62, 48, 75, 58, 80, 66].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-primary-100" style={{ height: `${h}%` }}>
                  <div
                    className="h-2/3 w-full rounded-t-md bg-primary-500/80"
                    style={{ height: `${Math.min(100, h + 10)}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-primary-100 selection:text-primary-900">
      {/* Navbar */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8" aria-label="Global">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-slate-900">
              <Activity className="h-4 w-4 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-[17px] font-semibold tracking-tight text-slate-900">Clinova</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[13.5px] font-medium text-slate-500 transition-colors hover:text-slate-900"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <Link to="/login" className="text-[13.5px] font-semibold text-slate-600 transition-colors hover:text-slate-900">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-slate-900 px-4 py-2 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
          <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-7 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-[12.5px] font-medium text-slate-500 shadow-sm">
                Built for modern clinical teams
                <ChevronRight className="h-3 w-3" />
              </div>

              <h1 className="text-[42px] font-semibold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
                Patient care,
                <br />
                <span className="text-primary-600">without the friction.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-lg text-[17px] leading-7 text-slate-500">
                Clinova brings records, labs, and scheduling into one calm workspace —
                so clinicians spend less time on software and more time on patients.
              </p>

              <div className="mt-9 flex items-center justify-center gap-x-8">
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-[14px] font-semibold text-white shadow-lg shadow-primary-600/25 transition-all hover:bg-primary-700"
                >
                  Start your journey
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link to="/login" className="text-[14px] font-semibold text-slate-700 transition-colors hover:text-primary-600">
                  Log in to portal
                </Link>
              </div>
            </div>

            <div className="mt-20">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section id="platform" className="border-t border-slate-100 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto mb-16 max-w-xl text-center">
              <h2 className="text-[28px] font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Everything a care team needs, nothing it doesn't
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-500">
                One platform, three roles served with equal care — doctors, front desk, and patients.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="card p-7">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-[15.5px] font-semibold text-slate-900">{title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-slate-500">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security strip */}
        <section id="security" className="border-t border-slate-100 bg-slate-50/60 py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 sm:grid-cols-3 lg:px-8">
            {[
              { icon: ShieldCheck, label: 'HIPAA-aligned by design' },
              { icon: FileText, label: 'Full audit trail on every record' },
              { icon: Clock, label: '99.9% uptime for care teams' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-5 w-5 shrink-0 text-primary-600" strokeWidth={2} />
                <span className="text-[13.5px] font-medium text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section id="teams" className="py-24 sm:py-28">
          <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
            <h2 className="text-[26px] font-semibold tracking-tight text-slate-900 sm:text-[30px]">
              Ready to bring your team onto Clinova?
            </h2>
            <p className="mt-3 text-[15px] text-slate-500">
              Set up takes minutes. Your care team will feel the difference on day one.
            </p>
            <div className="mt-8">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-slate-800"
              >
                Create your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900">
              <Activity className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">Clinova</span>
          </div>
          <p className="text-[12.5px] text-slate-400">© {new Date().getFullYear()} Clinova. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;