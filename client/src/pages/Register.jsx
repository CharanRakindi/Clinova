import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['patient', 'doctor', 'admin']).default('patient'),
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'patient' }
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      const res = await registerUser(data);
      toast.success('Account created successfully');
      
      const role = res.data.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'doctor') navigate('/doctor/dashboard');
      else navigate('/patient/dashboard');
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-mesh dark:bg-[#030712] transition-colors duration-300">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative element */}
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/15">
            <Activity className="h-8 w-8 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
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
            Join the future of<br/>healthcare.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-slate-350 text-lg leading-relaxed font-medium"
          >
            Create your account in seconds and gain instant access to your secure medical dashboard.
          </motion.p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-slate-500 text-sm font-semibold">
          <span>&copy; {new Date().getFullYear()} MediVault Inc.</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-white/40 dark:bg-slate-950/20 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto w-full max-w-sm lg:w-[400px]"
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
              Create an account
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-400 dark:text-slate-500">
              Fill in your details below to get started.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-1.5">
                  Full Name
                </label>
                <div>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="John Doe"
                    className={`input ${errors.name ? 'border-red-500 bg-red-50 dark:bg-red-950/10' : 'bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900'}`}
                  />
                  {errors.name && <p className="mt-1.5 text-xs font-semibold text-red-650">{errors.name.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-1.5">
                  Email address
                </label>
                <div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    className={`input ${errors.email ? 'border-red-500 bg-red-50 dark:bg-red-950/10' : 'bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900'}`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-semibold text-red-650">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-1.5">
                  Password
                </label>
                <div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Min. 8 characters"
                    className={`input ${errors.password ? 'border-red-500 bg-red-50 dark:bg-red-950/10' : 'bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900'}`}
                  />
                  {errors.password && <p className="mt-1.5 text-xs font-semibold text-red-650">{errors.password.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-1.5">
                  I am a
                </label>
                <div>
                  <select
                    {...register('role')}
                    className="input bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-900/60 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center items-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="absolute right-4 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm font-semibold text-slate-650 dark:text-slate-450">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-primary-650 dark:text-primary-400 hover:text-primary-550 transition-colors">
                Log in instead
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
