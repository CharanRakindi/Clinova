import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { roleHome } from '../utils/navigation';
import BrandMark from '../components/BrandMark';

const HERO_BG =
  'https://cdn.sceneai.art/Hero%20Section%20Video/802fa01f-44ef-4ab4-ac73-62015fe06eef.png';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .refine(
      (val) => !val.toLowerCase().endsWith('@clinova.com'),
      'Hospital emails (@clinova.com) cannot be used for public registration'
    ),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await registerUser(data);
      toast.success('Account created successfully');
      navigate(roleHome(res.data.role));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Brand panel — mirrors login */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[46%] xl:w-[48%]">
        <img src={HERO_BG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 to-transparent" />

        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14 text-white">
          <BrandMark size="md" tone="light" asLink />

          <div className="max-w-md">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 text-2xs font-medium uppercase tracking-[0.16em] text-white/45"
            >
              Patient registration
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 font-display text-[clamp(2rem,3.2vw,2.65rem)] font-normal leading-[1.1] tracking-[-0.02em]"
            >
              Join modern care,
              <br />
              <span className="italic text-white/75">built around you.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-sm text-md font-normal leading-[1.65] tracking-[-0.01em] text-white/65"
            >
              Create your account in seconds and step into a calm, secure health workspace.
            </motion.p>
          </div>

          <p className="text-xs font-normal text-white/40">
            © {new Date().getFullYear()} Clinova
          </p>
        </div>
      </div>

      {/* Form panel — same structure as login */}
      <div className="flex flex-1 flex-col justify-center px-5 py-10 sm:px-10 sm:py-14 lg:px-14 xl:px-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[400px]"
        >
          <div className="mb-8 lg:hidden">
            <BrandMark size="sm" tone="dark" asLink />
          </div>

          <header className="mb-8">
            <h1 className="text-2xl font-medium tracking-[-0.03em] text-ink sm:text-[1.625rem]">
              Create an account
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Patient registration only. Staff accounts are issued by your administrator.
            </p>
          </header>

          <div className="card p-6 shadow-md sm:p-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div>
                <label className="label" htmlFor="register-name">
                  Full name
                </label>
                <input
                  id="register-name"
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  autoFocus
                  placeholder="Jane Doe"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="register-email">
                  Email address
                </label>
                <input
                  id="register-email"
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                />
                {errors.password && (
                  <p className="field-error">{errors.password.message}</p>
                )}
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full py-2.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-ink-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-ink underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
