import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useReducedMotion,
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
import BrandMark from '../components/BrandMark';

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
  'Take charge of your well-being and explore the advantages of modern healthcare through our trusted platform.',
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

const FALLBACK_DOCTORS = [
  {
    name: 'Sarah Jenkins',
    role: 'Cardiology',
    img: AVATARS[0],
    bio: 'Preventive heart care and long-term risk management.',
  },
  {
    name: 'Michael Chen',
    role: 'Neurology',
    img: AVATARS[1],
    bio: 'Whole-person specialty care with evidence-based plans.',
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
  const reduce = useReducedMotion();
  const words = useMemo(
    () =>
      lines.map((line) =>
        line.split(' ').map((word, i, arr) => (i < arr.length - 1 ? `${word} ` : word))
      ),
    [lines]
  );
  const totalWords = words.reduce((s, line) => s + line.length, 0);
  const [visibleCount, setVisibleCount] = useState(reduce ? totalWords : 0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduce) {
      onDoneRef.current?.();
      return undefined;
    }
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
  }, [delay, step, totalWords, reduce]);

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
                  className={`${wordClassName} inline transition-all duration-500 ease-out ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 blur-[2px]'
                  }`}
                  style={{ display: 'inline-block' }}
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

function Reveal({ children, className = '', delay = 0, y = 28, blur = true }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  // once: false so animations re-run when scrolling back into view
  const inView = useInView(ref, { once: false, amount: 0.2, margin: '0px 0px -8% 0px' });
  return (
    <motion.div
      ref={ref}
      initial={
        reduce
          ? false
          : { opacity: 0, y, filter: blur ? 'blur(8px)' : 'blur(0px)' }
      }
      animate={
        reduce
          ? { opacity: 1, y: 0, filter: 'blur(0px)' }
          : inView
            ? { opacity: 1, y: 0, filter: 'blur(0px)' }
            : { opacity: 0, y, filter: blur ? 'blur(8px)' : 'blur(0px)' }
      }
      transition={{
        duration: reduce ? 0.01 : inView ? 0.65 : 0.35,
        delay: reduce || !inView ? 0 : delay,
        ease: EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Stagger({ children, className = '', delay = 0, stagger = 0.07 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: false, amount: 0.15, margin: '0px 0px -6% 0px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView || reduce ? 'show' : 'hidden'}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduce ? 0 : stagger,
            delayChildren: reduce || !inView ? 0 : delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

const staggerItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: EASE },
  },
};

/** Count-up when scrolled into view (marketing stats). */
function CountUp({ value, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, amount: 0.4 });
  const reduce = useReducedMotion();
  const match = String(value).match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : String(value);
  const isInt = Number.isInteger(target);
  const [display, setDisplay] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView) {
      if (!reduce) setDisplay(0);
      return undefined;
    }
    if (reduce) {
      setDisplay(target);
      return undefined;
    }
    const start = performance.now();
    const dur = 1200;
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      // ease-out cubic
      const e = 1 - (1 - t) ** 3;
      const v = target * e;
      setDisplay(isInt ? Math.round(v) : Math.round(v * 10) / 10);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, isInt, reduce]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}

function FloatingOrb({ className, duration = 12, delay = 0, x = 12, y = 18 }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} aria-hidden />;
  return (
    <motion.div
      className={className}
      aria-hidden
      animate={{ x: [0, x, -x * 0.6, 0], y: [0, -y, y * 0.5, 0], scale: [1, 1.06, 0.97, 1] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

const Eyebrow = ({ children, light = false }) => (
  <p
    className={`text-2xs font-medium uppercase tracking-[0.18em] ${
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

  const { data: apiDoctors } = useQuery({
    queryKey: ['landingDoctors'],
    queryFn: async () => {
      try {
        const res = await api.get('/doctors?accepting=true');
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
  });

  const DOCTORS = useMemo(() => {
    if (Array.isArray(apiDoctors) && apiDoctors.length > 0) {
      return apiDoctors.slice(0, 4).map((d, i) => ({
        name: d.user?.name || 'Clinician',
        role: d.specialization || 'General practice',
        img: AVATARS[i % AVATARS.length],
        bio: d.department?.name
          ? `${d.specialization || 'Care'} · ${d.department.name}`
          : 'Available for new appointment requests.',
      }));
    }
    return FALLBACK_DOCTORS;
  }, [apiDoctors]);

  const heroRef = useRef(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Lighter parallax on small screens (less jank / fewer layout shifts)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
  );
  const heroY = useTransform(heroProgress, [0, 1], isMobile ? [0, 24] : [0, 100]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);
  const heroScale = useTransform(heroProgress, [0, 1], isMobile ? [1, 1.02] : [1, 1.05]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    const onScroll = () => setScrolled(window.scrollY > 20);
    const mq = window.matchMedia('(max-width: 640px)');
    const onMq = () => setIsMobile(mq.matches);
    onScroll();
    onMq();
    window.addEventListener('scroll', onScroll, { passive: true });
    mq.addEventListener?.('change', onMq);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('scroll', onScroll);
      mq.removeEventListener?.('change', onMq);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const navSolid = scrolled || menuOpen;

  return (
    <div className="overflow-x-hidden bg-surface-muted text-ink antialiased">
      {/* ── Nav ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)] transition-[background,border,box-shadow] duration-product ${
          navSolid
            ? 'border-b border-slate-200/70 bg-surface-muted/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav
          className="mx-auto flex h-14 max-w-[1340px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-8 lg:px-10"
          aria-label="Primary"
        >
          <a
            href="#home"
            className="min-w-0 shrink transition-opacity duration-product hover:opacity-90"
            onClick={() => setMenuOpen(false)}
          >
            <span className="sm:hidden">
              <BrandMark size="sm" tone={navSolid ? 'dark' : 'light'} />
            </span>
            <span className="hidden sm:inline-flex">
              <BrandMark size="md" tone={navSolid ? 'dark' : 'light'} />
            </span>
          </a>

          <div className="hidden items-center gap-0.5 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-normal tracking-[-0.01em] transition-colors duration-product ${
                  navSolid
                    ? 'text-slate-500 hover:bg-slate-900/[0.04] hover:text-slate-900'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className={`hidden text-sm font-normal tracking-[-0.01em] transition-colors md:inline ${
                navSolid ? 'text-slate-500 hover:text-slate-900' : 'text-white/80 hover:text-white'
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`hidden items-center gap-1.5 rounded-full px-4 py-[7px] text-sm font-medium tracking-[-0.01em] md:inline-flex ${
                navSolid
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-900'
              }`}
            >
              Book appointment
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              className={`tap-target inline-flex items-center justify-center rounded-full border p-2.5 md:hidden ${
                navSolid ? 'border-slate-200 text-slate-900' : 'border-white/25 text-white'
              }`}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
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
              transition={{ duration: 0.28, ease: EASE }}
              className="max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain border-t border-slate-200/70 bg-surface-muted md:hidden"
            >
              <div className="flex flex-col gap-0.5 px-4 py-3 safe-pb sm:px-5">
                {NAV_LINKS.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-3.5 text-md font-medium tracking-[-0.01em] text-slate-800 active:bg-slate-100"
                  >
                    {link.label}
                  </motion.a>
                ))}
                <div className="mt-2 grid grid-cols-1 gap-2 border-t border-slate-200/80 pt-3">
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="btn btn-secondary w-full justify-center py-3 text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    className="btn btn-primary w-full justify-center py-3 text-sm"
                  >
                    Book appointment
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        id="home"
        className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-surface-inverse text-white"
      >
        <motion.div
          className="absolute inset-0"
          style={{ y: heroY, scale: heroScale }}
          aria-hidden
        >
          <img
            src={HERO_BG}
            alt=""
            className="h-full w-full object-cover object-[center_30%] sm:object-center animate-kenburns"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-black/20 sm:via-black/15 sm:to-transparent" />
          <div className="landing-grain pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay" />
          <FloatingOrb
            className="pointer-events-none absolute -left-20 top-1/3 hidden h-64 w-64 rounded-full bg-sky-500/20 blur-[90px] sm:block"
            duration={14}
            x={20}
            y={28}
          />
          <FloatingOrb
            className="pointer-events-none absolute bottom-0 right-0 hidden h-80 w-80 rounded-full bg-emerald-500/15 blur-[100px] sm:block"
            duration={16}
            delay={1.2}
            x={-24}
            y={-22}
          />
          <FloatingOrb
            className="pointer-events-none absolute right-1/4 top-1/4 hidden h-40 w-40 rounded-full bg-cyan-400/10 blur-[70px] lg:block"
            duration={11}
            delay={0.5}
            x={16}
            y={-14}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 mx-auto w-full max-w-[1340px] px-4 pb-8 pt-[calc(4.5rem+env(safe-area-inset-top))] sm:px-8 sm:pb-14 sm:pt-28 lg:px-10 lg:pb-16"
        >
          <div
            className={`max-w-2xl transition-all duration-700 ${
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.6, ease: EASE }}
              className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-2 py-1 backdrop-blur-md sm:mb-6"
            >
              <motion.span
                className="relative shrink-0 rounded-full bg-white px-2 py-0.5 text-2xs font-medium uppercase tracking-[0.06em] text-slate-900 sm:text-2xs"
                animate={{ boxShadow: ['0 0 0 0 rgba(255,255,255,0)', '0 0 0 6px rgba(255,255,255,0.12)', '0 0 0 0 rgba(255,255,255,0)'] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                Trusted
              </motion.span>
              <span className="truncate pr-1.5 text-xs font-normal tracking-[-0.01em] text-white/90 sm:text-sm">
                20,000+ Patients Worldwide
              </span>
            </motion.div>

            <WordReveal
              lines={HEADING_LINES}
              delay={260}
              step={68}
              className="max-w-[20ch] text-[clamp(1.85rem,7.2vw,3.25rem)] leading-[1.12] tracking-[-0.03em] text-white sm:max-w-none"
              lineClassName={(i) =>
                i === 0
                  ? 'font-medium'
                  : 'mt-1 font-display text-[clamp(1.95rem,7.5vw,3.5rem)] font-normal italic tracking-[-0.02em] text-white/95'
              }
              wordClassName="mr-[0.22em] last:mr-0"
              onDone={handleHeadingDone}
            />

            <div className="mt-4 max-w-[28rem] sm:mt-5">
              {headingDone ? (
                <WordReveal
                  lines={SUBTEXT_LINES}
                  delay={50}
                  step={36}
                  className="text-base font-normal leading-[1.65] tracking-[-0.01em] text-white/75 sm:text-md"
                  wordClassName="mr-[0.22em] last:mr-0"
                />
              ) : (
                <p className="text-base leading-[1.65] text-transparent sm:text-md" aria-hidden>
                  Take charge of your well-being and explore the advantages of modern healthcare
                  through our trusted platform.
                </p>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 16 }}
              transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
              className="mt-7 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
            >
              <div className="w-full sm:w-auto">
                <Link
                  to="/register"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-5 py-3 text-sm font-medium tracking-[-0.01em] text-slate-900 shadow-[0_10px_32px_rgba(0,0,0,0.28)] sm:w-auto sm:py-2.5"
                >
                  Book An Appointment
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="w-full sm:w-auto">
                <a
                  href="#about"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/45 bg-white/[0.06] px-5 py-3 text-sm font-medium tracking-[-0.01em] text-white backdrop-blur-sm sm:w-auto sm:py-2.5"
                >
                  About Us
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-col gap-6 sm:mt-14 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
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
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.4, y: 4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.85 + i * 0.06, duration: 0.35, ease: EASE }}
                    >
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" strokeWidth={0} />
                    </motion.span>
                  ))}
                </div>
                <p className="mt-0.5 text-xs font-normal tracking-[-0.01em] text-white/80">
                  Based on 20K+ reviews
                </p>
              </div>
            </motion.div>

            <a
              href="#about"
              className="hidden items-center gap-2.5 text-2xs font-medium uppercase tracking-[0.16em] text-white/55 transition-colors hover:text-white/80 sm:inline-flex"
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
      <div className="relative overflow-hidden border-y border-slate-200/80 bg-white py-3 sm:py-3.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-20" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-20" />
        <div className="marquee-track flex w-max gap-7 whitespace-nowrap sm:gap-9">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.12em] text-slate-400 sm:gap-2.5 sm:text-2xs sm:tracking-[0.14em]"
            >
              <Sparkles className="h-3 w-3 shrink-0 text-slate-300" strokeWidth={1.75} />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── About ── */}
      <section id="about" className="scroll-mt-20 py-14 sm:py-28">
        <div className="mx-auto max-w-[1340px] px-4 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12 lg:gap-12">
            <Reveal className="lg:col-span-5">
              <Eyebrow>About Clinova</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(1.9rem,7vw,3.5rem)] font-normal leading-[1.08] tracking-[-0.02em] text-slate-900 text-balance sm:mt-4">
                Care that feels
                <br />
                <span className="italic text-slate-500">calm, secure,</span>
                <br />
                and modern.
              </h2>
            </Reveal>
            <Reveal delay={0.08} className="lg:col-span-6 lg:col-start-7">
              <p className="max-w-xl text-base font-normal leading-[1.7] tracking-[-0.01em] text-slate-600 sm:text-md">
                Clinova brings appointments, medical records, labs, and team workflows into one
                premium workspace — so clinicians spend less time on software and more time with
                patients.
              </p>
              <Stagger className="mt-5 flex flex-wrap gap-2 sm:mt-7" delay={0.12} stagger={0.08}>
                {[
                  { icon: Lock, label: 'Encrypted by default' },
                  { icon: Activity, label: 'Live care sync' },
                  { icon: Stethoscope, label: 'Built for clinics' },
                ].map(({ icon: Icon, label }) => (
                  <motion.span
                    key={label}
                    variants={staggerItem}
                    whileHover={{ y: -2, scale: 1.02 }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-medium tracking-[-0.01em] text-slate-600 shadow-sm"
                  >
                    <Icon className="h-3.5 w-3.5 text-sky-500" strokeWidth={1.75} />
                    {label}
                  </motion.span>
                ))}
              </Stagger>
            </Reveal>
          </div>

          <Stagger
            className="mt-10 grid grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-3 sm:gap-4"
            delay={0.05}
            stagger={0.09}
          >
            {[
              { value: '20K+', label: 'Patients supported', sub: 'Across care journeys' },
              { value: '99.9%', label: 'Platform uptime', sub: 'Always ready for care' },
              { value: '5', label: 'roles · One workspace', sub: 'Patient to admin' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={staggerItem}
                whileHover={{ y: -4, transition: { duration: 0.25, ease: EASE } }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-premium transition-shadow duration-product hover:shadow-premium-lg sm:p-7"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-sky-400/0 transition-colors duration-product group-hover:bg-sky-400/10" />
                <p className="font-display text-[2.35rem] leading-none tracking-[-0.03em] text-slate-900 sm:text-[3rem]">
                  <CountUp value={stat.value} />
                </p>
                <p className="mt-2.5 text-sm font-medium tracking-[-0.01em] text-slate-800 sm:mt-3">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{stat.sub}</p>
              </motion.div>
            ))}
          </Stagger>

          <Reveal delay={0.1} className="mt-3 sm:mt-4">
            <div className="surface-inverse-panel px-5 py-8 sm:rounded-[1.5rem] sm:px-11 sm:py-12">
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
                      viewport={{ once: false, amount: 0.4 }}
                      transition={{ delay: 0.08 + i * 0.05, ease: EASE }}
                      className="flex items-start gap-3 text-base leading-snug tracking-[-0.01em] text-white/70"
                    >
                      <span className="dot-live mt-[0.4rem]" />
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
        className="scroll-mt-20 border-t border-slate-200/70 bg-white py-14 sm:py-28"
      >
        <div className="mx-auto max-w-[1340px] px-4 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Services</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,6.5vw,3.15rem)] font-normal leading-[1.1] tracking-[-0.02em] text-slate-900 text-balance sm:mt-4">
              Everything a modern care team needs
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-base leading-[1.7] tracking-[-0.01em] text-slate-600 sm:mt-4 sm:text-md">
              One platform covering the full clinical journey — from booking to follow-up.
            </p>
          </Reveal>

          <Stagger
            className="mt-8 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
            stagger={0.08}
          >
            {SERVICES.map(({ icon: Icon, title, body }) => (
              <motion.article
                key={title}
                variants={staggerItem}
                whileHover={{ y: -6, transition: { duration: 0.28, ease: EASE } }}
                className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-surface-muted p-5 transition-[border-color,box-shadow,background-color] duration-product hover:border-sky-200/80 hover:bg-white hover:shadow-premium-lg sm:p-6"
              >
                <motion.div
                  className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-sm sm:mb-7"
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <Icon className="h-[18px] w-[18px] text-sky-600" strokeWidth={1.6} />
                </motion.div>
                <h3 className="text-md font-medium tracking-[-0.015em] text-slate-900">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-[1.65] tracking-[-0.01em] text-slate-600">
                  {body}
                </p>
              </motion.article>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Doctors ── */}
      <section id="doctors" className="scroll-mt-20 py-14 sm:py-28">
        <div className="mx-auto max-w-[1340px] px-4 sm:px-8 lg:px-10">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end sm:gap-6">
            <Reveal>
              <Eyebrow>Doctors</Eyebrow>
              <h2 className="mt-3 font-display text-[clamp(1.85rem,6.5vw,3.15rem)] font-normal leading-[1.1] tracking-[-0.02em] text-slate-900 sm:mt-4">
                Meet our specialists
              </h2>
              <p className="mt-3 max-w-md text-base leading-[1.65] tracking-[-0.01em] text-slate-600 sm:text-md">
                Experienced clinicians focused on clear communication and outcomes.
              </p>
            </Reveal>
            <Reveal delay={0.06} className="w-full sm:w-auto">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium tracking-[-0.01em] text-white sm:w-auto sm:py-2.5"
              >
                Book a visit
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Reveal>
          </div>

          {/* Horizontal snap on mobile; grid from sm up */}
          <div className="mt-8 -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {DOCTORS.map((doc, i) => (
              <Reveal
                key={doc.name}
                delay={i * 0.06}
                className="w-[78vw] max-w-[280px] shrink-0 snap-center sm:w-auto sm:max-w-none"
              >
                <article className="group h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-premium">
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 sm:aspect-[3/4]">
                    <img
                      src={doc.img}
                      alt={doc.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
                      <p className="text-2xs font-medium uppercase tracking-[0.14em] text-sky-200/80">
                        {doc.role}
                      </p>
                      <h3 className="mt-1 text-md font-medium tracking-[-0.015em] sm:text-md">
                        Dr. {doc.name}
                      </h3>
                      <p className="mt-1.5 text-xs leading-snug tracking-[-0.01em] text-white/70">
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
        className="scroll-mt-20 border-t border-slate-200/70 bg-white py-14 sm:py-28"
      >
        <div className="mx-auto max-w-[1340px] px-4 sm:px-8 lg:px-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Eyebrow>Journal</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,6.5vw,3.15rem)] font-normal leading-[1.1] tracking-[-0.02em] text-slate-900 text-balance sm:mt-4">
              Insights for better care
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base leading-[1.7] tracking-[-0.01em] text-slate-600 sm:mt-4 sm:text-md">
              Practical guidance on health, clinical workflows, and digital care.
            </p>
          </Reveal>

          <Stagger
            className="mt-8 grid grid-cols-1 gap-3 sm:mt-12 sm:gap-4 md:grid-cols-3"
            stagger={0.09}
          >
            {BLOG_POSTS.map((post) => (
              <motion.article
                key={post.title}
                variants={staggerItem}
                whileHover={{ y: -5, transition: { duration: 0.28, ease: EASE } }}
                className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-surface-muted p-5 transition-[border-color,box-shadow,background-color] duration-product hover:border-sky-200/70 hover:bg-white hover:shadow-premium-lg sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-slate-200/90 bg-white px-2.5 py-0.5 text-2xs font-medium uppercase tracking-[0.1em] text-slate-500">
                    {post.tag}
                  </span>
                  <span className="inline-flex items-center gap-1 text-2xs tabular-nums text-slate-400">
                    <Clock className="h-3 w-3" strokeWidth={1.75} />
                    {post.date}
                  </span>
                </div>
                <h3 className="mt-5 text-md font-medium leading-snug tracking-[-0.02em] text-slate-900">
                  {post.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-[1.65] tracking-[-0.01em] text-slate-600">
                  {post.excerpt}
                </p>
              </motion.article>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-about-dark relative overflow-hidden py-14 text-white sm:py-24">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="landing-grain absolute inset-0 opacity-25 mix-blend-overlay" />
          <FloatingOrb
            className="absolute left-1/2 top-0 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-[110px] sm:h-[380px] sm:w-[380px]"
            duration={18}
            y={30}
            x={40}
          />
          <FloatingOrb
            className="absolute bottom-0 left-1/4 hidden h-56 w-56 rounded-full bg-emerald-400/15 blur-[90px] sm:block"
            duration={14}
            delay={0.8}
            y={-20}
            x={-16}
          />
        </div>

        <div className="relative mx-auto max-w-[38rem] px-4 text-center sm:px-8">
          <Reveal>
            <Eyebrow light>Get started</Eyebrow>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,7vw,3.6rem)] font-normal leading-[1.08] tracking-[-0.025em] text-balance sm:mt-4">
              Ready to experience
              <br />
              <span className="italic text-white/65">healthcare for good?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-[1.7] tracking-[-0.01em] text-white/55 sm:mt-5 sm:text-md">
              Create your account in minutes and join a calmer way to manage care — for patients and
              clinical teams.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-2.5 sm:mt-9 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-medium tracking-[-0.01em] text-slate-900 shadow-lg sm:w-auto"
              >
                Create free account
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-white/25 px-6 py-3 text-sm font-medium tracking-[-0.01em] text-white sm:w-auto"
              >
                Sign in to portal
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] bg-surface-inverse pb-[max(2rem,env(safe-area-inset-bottom))] pt-9 text-white sm:pb-9 sm:pt-11">
        <div className="mx-auto max-w-[1340px] px-4 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between lg:gap-9">
            <div>
              <BrandMark size="sm" tone="light" />
              <p className="mt-3 max-w-[16rem] text-sm leading-[1.6] tracking-[-0.01em] text-white/40">
                Healthcare for Good. Today. Tomorrow. Always.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm tracking-[-0.01em] text-white/45 sm:flex sm:flex-wrap sm:gap-x-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="py-1 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/security" className="py-1 transition-colors hover:text-white">
                Security
              </Link>
              <Link to="/login" className="py-1 transition-colors hover:text-white">
                Sign in
              </Link>
              <Link to="/register" className="py-1 transition-colors hover:text-white">
                Register
              </Link>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-white/[0.08] pt-5 sm:mt-10 sm:flex-row sm:items-center sm:pt-6">
            <p className="text-2xs tracking-[-0.01em] text-white/30">
              © {new Date().getFullYear()} Clinova. All rights reserved.
            </p>
            <p className="text-2xs tracking-[-0.01em] text-white/25">
              Designed for modern care teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
