import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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
    <div className="min-h-screen flex">
      {/* Left side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-primary-500/20 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white tracking-tight">MediVault</span>
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight animate-fade-in-up">
            Join the future of<br/>healthcare.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed animate-fade-in-up animation-delay-100">
            Create your account in seconds and gain instant access to your secure medical dashboard.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-slate-400 text-sm">
          <span>&copy; {new Date().getFullYear()} MediVault Inc.</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-[400px] animate-fade-in">
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
              Create an account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Fill in your details below to get started.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="John Doe"
                    className={`input ${errors.name ? 'border-red-500 bg-red-50' : 'bg-slate-50 hover:bg-white focus:bg-white'}`}
                  />
                  {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="john@example.com"
                    className={`input ${errors.email ? 'border-red-500 bg-red-50' : 'bg-slate-50 hover:bg-white focus:bg-white'}`}
                  />
                  {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div>
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Min. 8 characters"
                    className={`input ${errors.password ? 'border-red-500 bg-red-50' : 'bg-slate-50 hover:bg-white focus:bg-white'}`}
                  />
                  {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  I am a
                </label>
                <div>
                  <select
                    {...register('role')}
                    className="input bg-slate-50 hover:bg-white focus:bg-white cursor-pointer"
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
                  className="group relative flex w-full justify-center items-center rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
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

            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-500 transition-colors">
                Log in instead
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
