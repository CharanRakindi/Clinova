import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  AnimatePresence,
} from 'framer-motion';
import {
  ArrowRight,
  Menu,
  Star,
  X,
  Shield,
  CalendarCheck2,
  Stethoscope,
  HeartPulse,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Activity,
} from 'lucide-react';

/* ─── Content ─── */

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Services', href: '#services' },
  { label: 'Doctors', href: '#doctors' },
  { label: 'Blog', href: '#blog' },
];

const AVATARS = [
  'https://cdn.sceneai.art/Only%20man%20image/0ccd6017-25fc-493b-abdf-321915dde101.jpg',
  'https://cdn.sceneai.art/Only%20man%20image/7e1339ef-7a01-4979-93c8-21d97af291ee.webp',
  'https://cdn.sceneai.art/Image%20for%20any%20section/2d8032d8-c1cd-4827-84db-0aeba1109c1b.jpg',
  'https://cdn.sceneai.art/Image%20for%20any%20section/470b31f2-d1b5-4730-96a2-aca680204172.jpg',
];

const HERO_BG =
  'https://cdn.sceneai.art/Hero%20Section%20Video/802fa01f-44ef-4ab4-ac73-62015fe06eef.png';

const HEADING_LINES = ['Healthcare for Good', 'Today. Tomorrow. Always.'];
const SUBTEXT_LINES = [
  'Take charge of your well-being and explore the many',
  'advantages of modern healthcare through our trusted platform.',
];

const MARQUEE = [
  'HIPAA-aligned security',
  'Real-time scheduling',
  'Unified medical records',
  'Lab workflows',
  '20,000+ patients served',
  'Role-based access',
  'Audit-ready trails',
  'Enterprise uptime',
];

const SERVICES = [
  {
    icon: CalendarCheck2,
    title: 'Smart scheduling',
    body: 'Book, confirm, and manage visits in real time across patients, doctors, and front desk.',
  },
  {
    icon: FileText,
    title: 'Unified records',
    body: 'Vitals, diagnoses, notes, and attachments live in one secure clinical timeline.',
  },
  {
    icon: Shield,
    title: 'Enterprise security',
    body: 'Role-based access, audit trails, and encrypted sessions designed for care teams.',
  },
  {
    icon: HeartPulse,
    title: 'Continuous care',
    body: 'Follow-ups, lab workflows, and prescriptions stay connected from intake to outcome.',
  },
];

const DOCTORS = [
  {
    name: 'Sarah Chen',
    role: 'Cardiology',
    img: AVATARS[0],
    bio: 'Preventive heart care and long-term risk management.',
  },
  {
    name: 'James Okonkwo',
    role: 'Internal Medicine',
    img: AVATARS[1],
    bio: 'Whole-person primary care with evidence-based plans.',
  },
  {
    name: 'Maya Patel',
    role: 'Family Medicine',
    img: AVATARS[2],
    bio: 'Family-focused consultations and wellness programs.',
  },
  {
    name: 'Ethan Brooks',
    role: 'Diagnostics',
    img: AVATARS[3],
    bio: 'Lab-informed diagnosis and rapid test coordination.',
  },
];

const BLOG_POSTS = [
  {
    tag: 'Wellness',
    title: 'Five habits that protect long-term heart health',
    excerpt: 'Small daily choices compound. Here is what clinicians recommend most often.',
    date: 'Jun 12, 2026',
  },
  {
    tag: 'Platform',
    title: 'How digital records reduce appointment friction',
    excerpt: 'From intake to discharge, a continuous record keeps every handoff clear.',
    date: 'May 28, 2026',
  },
  {
    tag: 'Care team',
    title: 'Building trust between patients and clinicians online',
    excerpt: 'Secure messaging, transparent notes, and shared plans change the experience.',
    date: 'May 4, 2026',
  },
];

const EASE = [0.16, 1, 0.3, 1];

/* Type tokens used across the page for consistency:
 * eyebrow  → 11px / 0.18em tracking / medium / slate-400
 * display  → Instrument Serif, clamp, leading 1.06
 * body     → 15–16px / 1.65 / slate-600
 * label    → 13–14px medium slate-800
 */

/* ─── Motion primitives ─── */

function WordReveal({
  lines,
  className,
  wordClassName,
  lineClassName,
  delay = 0,
  step = 70,
  onDone,
}) {
  const words = useMemo(
    () =>
      lines.map((line) =>
        line.split(' ').map((word, i, arr) => (i < arr.length - 1 ? `${word} ` : word))
      ),
    [lines]
  );
  const totalWords = words.reduce((s, line) => s + line.length, 0);
  const [visibleCount, setVisibleCount] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let wordIndex = 0;
    const timers = [];
    const start = window.setTimeout(() => {
      const tick = () => {
        wordIndex += 1;
        setVisibleCount(wordIndex);
        if (wordIndex < totalWords) timers.push(window.setTimeout(tick, step));
        else onDoneRef.current?.();
      };
      tick();
    }, delay);
    return () => {
      window.clearTimeout(start);
      timers.forEach(clearTimeout);
    };
  }, [delay, step, totalWords]);

  let flatIndex = 0;
  return (
    <div className={className}>
      {words.map((lineWords, lineIdx) => {
        const lineExtra =
          typeof lineClassName === 'function' ? lineClassName(lineIdx) : lineClassName || '';
        return (
          <span key={lineIdx} className={`block ${lineExtra}`}>
            {lineWords.map((word) => {
              const index = flatIndex++;
              const isVisible = index < visibleCount;
              return (
                <span
                  key={`${lineIdx}-${index}`}
                  className={`${wordClassName} inline-block transition-all duration-500 ease-out will-change-transform ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </span>
        );
      })}
    </div>
  );
}

function Reveal({ children, className = '', delay = 0, y = 24 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-8% 0px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Eyebrow = ({ children, light = false }) => (
  <p
    className={`text-[11px] font-medium uppercase tracking-[0.18em] ${
      light ? 'text-white/45' : 'text-slate-400'
    }`}
  >
    {children}
  </p>
);

/* ─── Page ─── */

const Home = () => {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headingDone, setHeadingDone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const handleHeadingDone = useCallback(() => setHeadingDone(true), []);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const progressScale = useSpring(scrollYProgress, { stiffness: 140, damping: 30 });
  const heroY = useTransform(heroProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 1.05]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="bg-[#F7F6F3] text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      {/* Scroll progress */}
      <motion.div
        className="fixed left-0 top-0 z-[100] h-[2px] origin-left bg-slate-900"
        style={{ scaleX: progressScale, width: '100%' }}
        aria-hidden
      />

      {/* ── Nav ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background,border,box-shadow] duration-400 ${
          scrolled
            ? 'border-b border-slate-200/70 bg-[#F7F6F3]/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav
          className="mx-auto flex h-16 max-w-[1340px] items-center justify-between px-5 sm:px-8 lg:px-10"
          aria-label="Primary"
        >
          <a
            href="#home"
            className={`text-[17px] font-semibold tracking-[-0.02em] transition-colors duration-300 ${
              scrolled ? 'text-slate-900' : 'text-white'
            }`}
          >
            Clinova
          </a>

          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-normal tracking-[-0.01em] transition-colors duration-300 ${
                  scrolled
                    ? 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className={`hidden text-[13px] font-normal tracking-[-0.01em] transition-colors md:inline ${
                scrolled ? 'text-slate-500 hover:text-slate-900' : 'text-white/80 hover:text-white'
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`group hidden items-center gap-1.5 rounded-full px-4 py-[7px] text-[13px] font-medium tracking-[-0.01em] transition-all md:inline-flex ${
                scrolled
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-white text-slate-900 hover:bg-white/92'
              }`}
            >
              Book appointment
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button
              type="button"
              className={`inline-flex rounded-full border p-2 md:hidden ${
                scrolled ? 'border-slate-200 text-slate-900' : 'border-white/25 text-white'
              }`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200/70 bg-[#F7F6F3] md:hidden"
            >
              <div className="flex flex-col gap-0.5 px-5 py-4">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3 text-[15px] font-medium tracking-[-0.01em] text-slate-800 hover:bg-slate-100"
                  >
                    {link.label}
                  </motion.a>
                ))}
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 rounded-xl px-3 py-3 text-[15px] text-slate-500"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary mt-1 w-full py-3 text-[13px]"
                >
                  Book appointment
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        id="home"
        className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-slate-950 text-white"
      >
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, scale: heroScale }}
          aria-hidden
        >
          <img
            src={HERO_BG}
            alt=""
            className="h-full w-full object-cover object-center animate-kenburns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
          <div className="landing-grain pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay" />
          <div className="pointer-events-none absolute -left-20 top-1/3 h-64 w-64 rounded-full bg-sky-500/15 blur-[90px]" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-500/10 blur-[100px]" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto w-full max-w-[1340px] px-5 pb-11 pt-28 sm:px-8 sm:pb-14 lg:px-10 lg:pb-16"
        >
          <div
            className={`max-w-2xl transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55, ease: EASE }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-2 py-1 backdrop-blur-md"
            >
              <span className="rounded-full bg-white px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-900">
                Trusted
              </span>
              <span className="pr-1.5 text-[13px] font-normal tracking-[-0.01em] text-white/90">
                20,000+ Patients Worldwide
              </span>
            </motion.div>

            <WordReveal
              lines={HEADING_LINES}
              delay={260}
              step={68}
              className="text-[clamp(2.25rem,5.2vw,3.25rem)] leading-[1.1] tracking-[-0.03em] text-white"
              lineClassName={(i) =>
                i === 0
                  ? 'font-medium'
                  : 'mt-1 font-display text-[clamp(2.4rem,5.5vw,3.5rem)] font-normal italic tracking-[-0.02em] text-white/95'
              }
              wordClassName="mr-[0.26em] last:mr-0"
              onDone={handleHeadingDone}
            />

            <div className="mt-5 max-w-[28rem]">
              {headingDone ? (
                <WordReveal
                  lines={SUBTEXT_LINES}
                  delay={50}
                  step={40}
                  className="text-[15px] font-normal leading-[1.65] tracking-[-0.01em] text-white/75"
                  wordClassName="mr-[0.26em] last:mr-0"
                />
              ) : (
                <p className="text-[15px] leading-[1.65] text-transparent" aria-hidden>
                  Take charge of your well-being and explore the many
                  <br />
                  advantages of modern healthcare through our trusted platform.
                </p>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 14 }}
              transition={{ delay: 0.5, duration: 0.55, ease: EASE }}
              className="mt-8 flex flex-wrap items-center gap-2.5"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-slate-900 shadow-[0_10px_32px_rgba(0,0,0,0.28)] transition-[box-shadow,background-color] duration-200 hover:bg-white/95 hover:shadow-[0_14px_40px_rgba(0,0,0,0.34)]"
              >
                Book An Appointment
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#about"
                className="group inline-flex items-center gap-1.5 rounded-full border border-white/45 bg-white/[0.06] px-5 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-white backdrop-blur-sm transition-colors duration-200 hover:bg-white/12"
              >
                About Us
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </div>

          <div className="mt-12 flex flex-col gap-8 sm:mt-14 sm:flex-row sm:items-end sm:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: mounted ? 1 : 0, y: 0 }}
              transition={{ delay: 0.65, duration: 0.55, ease: EASE }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <motion.img
                    key={src}
                    src={src}
                    alt=""
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.05, ease: EASE }}
                    className="h-9 w-9 rounded-full border-2 border-white/90 object-cover shadow-md"
                    style={{ zIndex: AVATARS.length - i }}
                  />
                ))}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-0.5" aria-label="5-star rating">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3 w-3 fill-amber-400 text-amber-400"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <p className="mt-0.5 text-[12.5px] font-normal tracking-[-0.01em] text-white/80">
                  Based on 20K+ reviews
                </p>
              </div>
            </motion.div>

            <a
              href="#about"
              className="hidden items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white/80 sm:inline-flex"
            >
              Scroll
              <motion.span
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.7, ease: 'easeInOut' }}
                className="inline-block h-7 w-px bg-white/35"
              />
            </a>
          </div>
        </motion.div>
      </section>

      {/* ── Marquee ── */}
      <div className="relative overflow-hidden border-y border-slate-200/80 bg-white py-3.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-white to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white to-transparent sm:w-20" />
        <div className="marquee-track flex w-max gap-9 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-slate-400"
            >
              <Sparkles className="h-3 w-3 text-slate-300" strokeWidth={1.75} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── About ── */}
      <section id="about" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-[1340px] px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12 lg:gap-12">
            <Reveal className="lg:col-span-5">
              <Eyebrow>About Clinova</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.35rem,4.8vw,3.5rem)] font-normal leading-[1.06] tracking-[-0.02em] text-slate-900 text-balance">
                Care that feels
                <br />
                <span className="italic text-slate-500">calm, secure,</span>
                <br />
                and modern.
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
              <p className="max-w-xl text-[15.5px] font-normal leading-[1.7] tracking-[-0.01em] text-slate-600">
                Clinova brings appointments, medical records, labs, and team workflows into one
                premium workspace — so clinicians spend less time on software and more time with
                patients.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  { icon: Lock, label: 'Encrypted by default' },
                  { icon: Activity, label: 'Live care sync' },
                  { icon: Stethoscope, label: 'Built for clinics' },
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-[12.5px] font-medium tracking-[-0.01em] text-slate-600 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
                    {label}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { value: '20K+', label: 'Patients supported', sub: 'Across care journeys' },
              { value: '99.9%', label: 'Platform uptime', sub: 'Always ready for care' },
              { value: '5 roles', label: 'One workspace', sub: 'Patient to admin' },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.06}>
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-premium transition-all duration-400 hover:-translate-y-0.5 hover:shadow-premium-lg sm:p-7">
                  <p className="font-display text-[2.75rem] leading-none tracking-[-0.03em] text-slate-900 sm:text-[3rem]">
                    {stat.value}
                  </p>
                  <p className="mt-3 text-[13.5px] font-medium tracking-[-0.01em] text-slate-800">
                    {stat.label}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">{stat.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-3 sm:mt-4">
            <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-950 px-7 py-10 text-white sm:px-11 sm:py-12">
              <div className="pointer-events-none absolute inset-0" aria-hidden>
                <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-sky-500/15 blur-[90px]" />
                <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-400/10 blur-[100px]" />
              </div>
              <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
                <div>
                  <Eyebrow light>Built for every care role</Eyebrow>
                  <h3 className="mt-3 font-display text-[clamp(1.65rem,3vw,2.15rem)] font-normal leading-[1.15] tracking-[-0.02em]">
                    Patients, doctors, reception, lab, and admin — one continuous system.
                  </h3>
                </div>
                <ul className="space-y-3.5">
                  {[
                    'HIPAA-aligned audit logging on sensitive actions',
                    'Real-time appointment and notification sync',
                    'Secure file attachments for labs and records',
                    'Force-password and role-based access controls',
                  ].map((item, i) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.08 + i * 0.05, ease: EASE }}
                      className="flex items-start gap-3 text-[14px] leading-snug tracking-[-0.01em] text-white/70"
                    >
                      <span className="mt-[0.4rem] h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/90" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Services ── */}
      <section
        id="services"
        className="scroll-mt-20 border-t border-slate-200/70 bg-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1340px] px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Services</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.2vw,3.15rem)] font-normal leading-[1.08] tracking-[-0.02em] text-slate-900 text-balance">
              Everything a modern care team needs
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-[1.7] tracking-[-0.01em] text-slate-600">
              One platform covering the full clinical journey — from booking to follow-up.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {SERVICES.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 0.05}>
                <article className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-[#F7F6F3] p-6 transition-all duration-400 hover:-translate-y-0.5 hover:border-slate-300/90 hover:bg-white hover:shadow-premium-lg">
                  <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm transition-transform duration-400 group-hover:scale-[1.04]">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                  </div>
                  <h3 className="text-[15px] font-medium tracking-[-0.015em] text-slate-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-[1.65] tracking-[-0.01em] text-slate-600">
                    {body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Doctors ── */}
      <section id="doctors" className="scroll-mt-20 py-20 sm:py-28">
        <div className="mx-auto max-w-[1340px] px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <Reveal>
              <Eyebrow>Doctors</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2.2rem,4.2vw,3.15rem)] font-normal leading-[1.08] tracking-[-0.02em] text-slate-900">
                Meet our specialists
              </h2>
              <p className="mt-3 max-w-md text-[15px] leading-[1.65] tracking-[-0.01em] text-slate-600">
                Experienced clinicians focused on clear communication and outcomes.
              </p>
            </Reveal>
            <Reveal delay={0.06}>
              <Link
                to="/register"
                className="group inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-[13px] font-medium tracking-[-0.01em] text-white transition-colors duration-200 hover:bg-slate-800"
              >
                Book a visit
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {DOCTORS.map((doc, i) => (
              <Reveal key={doc.name} delay={i * 0.05}>
                <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-premium transition-all duration-400 hover:-translate-y-0.5 hover:shadow-premium-lg">
                  <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
                    <img
                      src={doc.img}
                      alt={doc.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/60">
                        {doc.role}
                      </p>
                      <h3 className="mt-1 text-[16px] font-medium tracking-[-0.015em]">
                        Dr. {doc.name}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] leading-snug tracking-[-0.01em] text-white/70">
                        {doc.bio}
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blog ── */}
      <section
        id="blog"
        className="scroll-mt-20 border-t border-slate-200/70 bg-white py-20 sm:py-28"
      >
        <div className="mx-auto max-w-[1340px] px-5 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Journal</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(2.2rem,4.2vw,3.15rem)] font-normal leading-[1.08] tracking-[-0.02em] text-slate-900 text-balance">
              Insights for better care
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-[1.7] tracking-[-0.01em] text-slate-600">
              Practical guidance on health, clinical workflows, and digital care.
            </p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {BLOG_POSTS.map((post, i) => (
              <Reveal key={post.title} delay={i * 0.06}>
                <article className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-[#F7F6F3] p-6 transition-all duration-400 hover:-translate-y-0.5 hover:border-slate-300/90 hover:bg-white hover:shadow-premium-lg sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-slate-200/90 bg-white px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-500">
                      {post.tag}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11.5px] tabular-nums text-slate-400">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      {post.date}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[16.5px] font-medium leading-snug tracking-[-0.02em] text-slate-900">
                    {post.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[13.5px] leading-[1.65] tracking-[-0.01em] text-slate-600">
                    {post.excerpt}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-0 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-sky-500/15 blur-[110px]" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-emerald-400/10 blur-[90px]" />
          <div className="landing-grain absolute inset-0 opacity-25 mix-blend-overlay" />
        </div>

        <div className="relative mx-auto max-w-[38rem] px-5 text-center sm:px-8">
          <Reveal>
            <Eyebrow light>Get started</Eyebrow>
            <h2 className="mt-4 font-display text-[clamp(2.35rem,5.5vw,3.6rem)] font-normal leading-[1.06] tracking-[-0.025em] text-balance">
              Ready to experience
              <br />
              <span className="italic text-white/65">healthcare for good?</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[15px] leading-[1.7] tracking-[-0.01em] text-white/55">
              Create your account in minutes and join a calmer way to manage care — for patients and
              clinical teams.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                to="/register"
                className="group inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-[13.5px] font-medium tracking-[-0.01em] text-slate-900 shadow-lg transition-[box-shadow,background-color] duration-200 hover:bg-white/95 hover:shadow-xl"
              >
                Create free account
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-[13.5px] font-medium tracking-[-0.01em] text-white transition-colors duration-200 hover:bg-white/10"
              >
                Sign in to portal
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] bg-slate-950 pb-9 pt-11 text-white">
        <div className="mx-auto max-w-[1340px] px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-9 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.02em]">Clinova</p>
              <p className="mt-2 max-w-[16rem] text-[13px] leading-[1.6] tracking-[-0.01em] text-white/40">
                Healthcare for Good. Today. Tomorrow. Always.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] tracking-[-0.01em] text-white/45">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="transition-colors hover:text-white">
                Sign in
              </Link>
              <Link to="/register" className="transition-colors hover:text-white">
                Register
              </Link>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center">
            <p className="text-[11.5px] tracking-[-0.01em] text-white/30">
              © {new Date().getFullYear()} Clinova. All rights reserved.
            </p>
            <p className="text-[11.5px] tracking-[-0.01em] text-white/25">
              Designed for modern care teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
