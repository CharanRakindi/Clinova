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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await login(data.email, data.password);
      toast.success('Welcome back');
      navigate(roleHome(res.data.role));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Left — cinematic brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-1/2">
        <img src={HERO_BG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
          <BrandMark size="md" tone="light" asLink />

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 font-display text-[clamp(2rem,3vw,2.5rem)] font-normal leading-[1.12] tracking-[-0.02em]"
            >
              Healthcare for Good.
              <br />
              <span className="italic text-white/80">Today. Tomorrow. Always.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-md font-normal leading-[1.65] tracking-[-0.01em] text-white/70"
            >
              Access your records, connect with clinicians, and manage care from one secure workspace.
            </motion.p>
          </div>

          <p className="text-xs font-normal text-white/50">
            © {new Date().getFullYear()} Clinova
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-10 sm:py-12 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[400px]"
        >
          <div className="mb-6 lg:hidden">
            <BrandMark size="sm" tone="dark" asLink />
          </div>

          <div>
            <h2 className="page-title">Sign in</h2>
            <p className="page-subtitle">Welcome back. Enter your details to continue.</p>
          </div>

          <div className="card mt-6 p-5 sm:mt-8 sm:p-7">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="label">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                />
                {errors.email && (
                  <p className="field-error">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0">Password</label>
                  <a href="#" className="text-xs font-medium text-ink-muted transition-colors hover:text-ink">
                    Forgot password?
                  </a>
                </div>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
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
                  className="btn btn-primary group relative w-full py-2.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-7 text-center text-sm font-normal text-ink-muted">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="font-medium text-ink underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
