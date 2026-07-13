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

const HERO_BG =
  'https://cdn.sceneai.art/Hero%20Section%20Video/802fa01f-44ef-4ab4-ac73-62015fe06eef.png';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
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
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden overflow-hidden lg:flex lg:w-[48%] xl:w-1/2">
        <img src={HERO_BG} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="relative z-10 flex w-full flex-col justify-between p-12 text-white">
          <Link to="/" className="brand-mark text-white">
            Clinova
          </Link>

          <div className="max-w-md">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4 text-[36px] font-medium leading-[1.15] tracking-tight"
            >
              Join modern care,
              <br />
              built around you.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[15px] font-normal leading-relaxed text-white/75"
            >
              Create your account in seconds and step into a calm, secure health workspace.
            </motion.p>
          </div>

          <p className="text-[12.5px] font-normal text-white/50">
            © {new Date().getFullYear()} Clinova
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-[400px]"
        >
          <div className="mb-8 lg:hidden">
            <Link to="/" className="brand-mark text-slate-900">
              Clinova
            </Link>
          </div>

          <div>
            <h2 className="text-[24px] font-medium tracking-tight text-slate-900">
              Create an account
            </h2>
            <p className="mt-1.5 text-[13.5px] font-normal text-slate-500">
              Fill in your details below to get started.
            </p>
          </div>

          <div className="card mt-8 p-7">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="label">Full name</label>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className={`input ${errors.name ? 'border-red-400 bg-red-50/50' : ''}`}
                />
                {errors.name && <p className="field-error">{errors.name.message}</p>}
              </div>

              <div>
                <label className="label">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`input ${errors.email ? 'border-red-400 bg-red-50/50' : ''}`}
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`input ${errors.password ? 'border-red-400 bg-red-50/50' : ''}`}
                />
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary group w-full py-2.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-7 text-center text-[13px] font-normal text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-slate-900 underline-offset-4 hover:underline">
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
