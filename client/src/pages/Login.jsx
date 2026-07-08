import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

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
      toast.success('Welcome back!');
      
      const role = res.data.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-mesh dark:bg-[#030712] transition-colors duration-300">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/15">
            <Activity className="h-8 w-8 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">MediVault</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl font-extrabold text-white mb-6 leading-tight"
          >
            Your health,<br/>securely managed.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-slate-350 text-lg leading-relaxed font-medium"
          >
            Access your medical records, communicate with your doctors, and manage appointments with enterprise-grade security.
          </motion.p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-sm font-semibold">
          <span>&copy; {new Date().getFullYear()} MediVault Inc.</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-white/40 dark:bg-slate-950/20 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm lg:w-96"
        >
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary-500 to-indigo-650 p-2.5 rounded-2xl shadow-lg shadow-primary-500/10">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">MediVault</span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Sign in
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
              Welcome back! Please enter your details.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-1.5">
                  Email address
                </label>
                <div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email"
                    className={`input ${errors.email ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950/10' : 'bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900'}`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-semibold text-red-650">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-350">
                    Password
                  </label>
                  <a href="#" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={`input ${errors.password ? 'border-red-500 focus:ring-red-500 bg-red-50 dark:bg-red-950/10' : 'bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900'}`}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-semibold text-red-650">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center items-center rounded-xl bg-slate-900 dark:bg-white dark:text-slate-950 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/20 dark:shadow-white/5 hover:bg-slate-800 dark:hover:bg-slate-50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="absolute right-4 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm font-semibold text-slate-650 dark:text-slate-450">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-primary-650 dark:text-primary-400 hover:text-primary-550 transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
