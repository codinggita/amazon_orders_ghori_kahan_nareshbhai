import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser, clearError } from '../features/authSlice';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// MUI Icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/material/CircularProgress';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error, accessToken } = useSelector((state) => state.auth);

  // Parse redirect path
  const from = location.state?.from?.pathname || '/';

  // Toggle password visibility
  const [showPassword, setShowPassword] = React.useState(false);

  useEffect(() => {
    // If user is already authenticated, redirect them
    if (accessToken) {
      navigate(from, { replace: true });
    }

    // Check if redirect due to expired session
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      toast.error('Your session has expired. Please log in again.');
      // Remove query param to prevent toast loop on refresh
      navigate('/login', { replace: true });
    }

    // Clean up error state on mount/unmount
    dispatch(clearError());
  }, [accessToken, navigate, from, location.search, dispatch]);

  const formik = useFormik({
    initialState: {
      email: '',
      password: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    }),
    initialValues: {
      email: '',
      password: '',
    },
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

      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 relative overflow-hidden px-4">
        {/* Decorative Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10">
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold text-2xl shadow-xl shadow-amber-500/20 mb-3">
              a
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Welcome Back</h2>
            <p className="text-slate-400 mt-2 text-sm">
              Amazon Orders Full-Stack Admin Panel
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8">
            <form onSubmit={formik.handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <EmailIcon className="w-5 h-5" />
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
                    className={`w-full pl-10 pr-4 py-3 bg-slate-900/60 border rounded-2xl outline-none transition-all text-sm ${
                      formik.touched.email && formik.errors.email
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.email}</p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <LockIcon className="w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full pl-10 pr-10 py-3 bg-slate-900/60 border rounded-2xl outline-none transition-all text-sm ${
                      formik.touched.password && formik.errors.password
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <VisibilityOffIcon className="w-5 h-5" /> : <VisibilityIcon className="w-5 h-5" />}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" className="mr-2" />
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-slate-400">Don't have an account? </span>
              <Link
                to="/register"
                className="text-amber-500 hover:text-amber-400 font-semibold underline underline-offset-4"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
