import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api, { ensureCsrf } from '../api/axios';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import BrandMark from '../components/BrandMark';
import { roleHome } from '../utils/navigation';
import { useAuth } from '../contexts/AuthContext';

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string().min(8),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export default function Activate() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const token = params.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: params.get('email') || '',
      password: '',
      confirm: '',
    },
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Missing invite token');
      return;
    }
    try {
      setLoading(true);
      await ensureCsrf();
      const res = await api.post('/auth/activate', {
        email: data.email,
        token,
        password: data.password,
      });
      await fetchUser();
      toast.success('Account activated');
      navigate(roleHome(res.data.data.role));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-12">
      <div className="mb-8">
        <BrandMark size="md" tone="dark" asLink />
      </div>
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-medium tracking-[-0.025em] text-slate-900">
          Activate your account
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Set a password using the one-time invite from your clinic. The link expires in 48 hours.
        </p>
        {!token && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            This page requires a valid invite link.
          </p>
        )}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" {...register('email')} autoComplete="email" />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div>
            <label className="label">New password</label>
            <input className="input" type="password" {...register('password')} autoComplete="new-password" />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm password</label>
            <input className="input" type="password" {...register('confirm')} autoComplete="new-password" />
            {errors.confirm && <p className="field-error">{errors.confirm.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary w-full py-2.5" disabled={loading || !token}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Activate <ArrowRight className="h-3.5 w-3.5" /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already activated?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
