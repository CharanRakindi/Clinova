import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">MediVault</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
            Your health,<br/>securely managed.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed animate-fade-in-up animation-delay-100">
            Access your medical records, communicate with your doctors, and manage appointments with enterprise-grade security.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-slate-400 text-sm">
          <span>&copy; {new Date().getFullYear()} MediVault Inc.</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="bg-primary-600 p-2 rounded-xl">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-slate-900">MediVault</span>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Welcome back! Please enter your details.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email"
                    className={`input ${errors.email ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'bg-slate-50 hover:bg-white focus:bg-white'}`}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={`input ${errors.password ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'bg-slate-50 hover:bg-white focus:bg-white'}`}
                  />
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
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

            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
