import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser, clearError } from '../features/authSlice';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../components/GoogleAuthButton';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BoltIcon from '@mui/icons-material/Bolt';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import BarChartIcon from '@mui/icons-material/BarChart';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

/* ── Animated background orbs ─────────────────────────────────── */
const BackgroundOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full"
         style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)' }} />
    <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full"
         style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.09) 0%, transparent 65%)' }} />
    <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full"
         style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 65%)' }} />
    {/* Floating particles */}
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-amber-400/30"
        style={{
          left: `${10 + i * 15}%`,
          top: `${20 + (i % 3) * 25}%`,
          animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
        }}
      />
    ))}
  </div>
);

/* ── Left branding panel ────────────────────────────────────────── */
const BrandPanel = () => (
  <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
    {/* Ambient light */}
    <div className="absolute inset-0 pointer-events-none"
         style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(245,158,11,0.08) 0%, transparent 60%)' }} />

    {/* Top logo */}
    <div className="flex items-center gap-3 relative z-10">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
          <BoltIcon className="text-slate-950" style={{ fontSize: 20 }} />
        </div>
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-amber-400/30 to-orange-500/20 blur animate-glow-pulse -z-10" />
      </div>
      <div>
        <span className="font-extrabold text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent tracking-tight block">
          AmazonDash
        </span>
        <span className="text-[10px] text-slate-600 dark:text-slate-700 uppercase tracking-widest font-semibold">Admin Panel</span>
      </div>
    </div>

    {/* Center content */}
    <div className="space-y-8 relative z-10">
      <div>
        <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
          Manage Your<br />
          <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Orders & Revenue
          </span>
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-600 text-sm leading-relaxed max-w-xs">
          A full-stack Amazon-style order management dashboard with real-time analytics, bulk operations, and system monitoring.
        </p>
      </div>

      {/* Feature list */}
      <div className="space-y-3">
        {[
          { icon: <ShoppingCartIcon style={{ fontSize: 16 }} />, text: 'Full order CRUD with bulk actions' },
          { icon: <BarChartIcon style={{ fontSize: 16 }} />, text: 'MongoDB aggregation analytics' },
          { icon: <ShieldIcon style={{ fontSize: 16 }} />, text: 'Role-based access control' },
        ].map((feat, i) => (
          <div key={i} className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              {feat.icon}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">{feat.text}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom quote */}
    <div className="relative z-10">
      <p className="text-xs text-slate-600 dark:text-slate-700 italic">
        "Built with React, Node.js, MongoDB & Express"
      </p>
    </div>
  </div>
);

/* ── Main Login component ─────────────────────────────────────── */
export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, accessToken } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (accessToken) navigate(from, { replace: true });
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.error('Your session has expired. Please log in again.');
      navigate('/login', { replace: true });
    }
    dispatch(clearError());
  }, [accessToken, navigate, from, location.search, dispatch]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    }),
    onSubmit: async (values) => {
      try {
        const resultAction = await dispatch(loginUser({ email: values.email, password: values.password })).unwrap();
        if (resultAction.success) {
          toast.success(`Welcome back, ${resultAction.data.user.name}!`);
          navigate(from, { replace: true });
        }
      } catch (err) {
        toast.error(err || 'Invalid credentials. Please try again.');
      }
    },
  });

  return (
    <>
      <Helmet>
        <title>Login | Amazon Order Dashboard</title>
        <meta name="description" content="Access your order tracking and management admin panel." />
      </Helmet>

      <div className="min-h-screen auth-bg flex items-stretch">
        <BackgroundOrbs />

        {/* Left Branding Panel */}
        <div className="w-[45%] border-r border-white/[0.05] relative">
          <BrandPanel />
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center px-8 py-12 relative z-10">
          <div
            className="w-full max-w-md animate-slide-up"
          >
            {/* Mobile logo */}
            <div className="lg:hidden flex justify-center mb-8">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
                  <BoltIcon style={{ fontSize: 24, color: '#0a0e1a' }} />
                </div>
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-amber-400/30 to-orange-500/20 blur animate-glow-pulse -z-10" />
              </div>
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-600">
                Sign in to your admin account to continue
              </p>
            </div>

            {/* Form Card */}
            <div className="modal-content rounded-2xl p-8 space-y-5 animate-scale-in">
              <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <EmailOutlinedIcon className="text-slate-600" style={{ fontSize: 18 }} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="name@company.com"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`input-dark w-full pl-10 pr-4 py-3 text-sm ${
                        formik.touched.email && formik.errors.email ? 'error' : ''
                      }`}
                    />
                  </div>
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1 animate-slide-down">{formik.errors.email}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <LockOutlinedIcon className="text-slate-600" style={{ fontSize: 18 }} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`input-dark w-full pl-10 pr-11 py-3 text-sm ${
                        formik.touched.password && formik.errors.password ? 'error' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-600 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? (
                        <VisibilityOffIcon style={{ fontSize: 18 }} />
                      ) : (
                        <VisibilityIcon style={{ fontSize: 18 }} />
                      )}
                    </button>
                  </div>
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-[11px] text-rose-400 font-medium mt-1 animate-slide-down">{formik.errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-amber w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowForwardIcon style={{ fontSize: 16 }} />
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign-In */}
              <GoogleAuthButton label="Continue with Google" />

              <p className="text-center text-xs text-slate-600">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>

            {/* Security note */}
            <p className="text-center text-[11px] text-slate-700 dark:text-slate-800 mt-6 flex items-center justify-center gap-1.5">
              <ShieldIcon style={{ fontSize: 12, color: '#4b5563' }} />
              Secured with JWT authentication & refresh tokens
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
