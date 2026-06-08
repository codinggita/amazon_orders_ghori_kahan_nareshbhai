import React, { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../features/authSlice';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// MUI Icons
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CircularProgress from '@mui/material/CircularProgress';

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, accessToken } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = React.useState(false);

  useEffect(() => {
    if (accessToken) {
      navigate('/', { replace: true });
    }
    dispatch(clearError());
  }, [accessToken, navigate, dispatch]);

  const formik = useFormik({
    initialState: {
      name: '',
      email: '',
      password: '',
      role: 'user', // default role
    },
    validationSchema: Yup.object({
      name: Yup.string().max(50, 'Must be 50 characters or less').required('Full name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
      role: Yup.string().oneOf(['user', 'admin'], 'Invalid role').required('Role is required'),
    }),
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'user',
    },
    onSubmit: async (values) => {
      try {
        const resultAction = await dispatch(
          registerUser({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
          })
        ).unwrap();
        
        if (resultAction.success) {
          toast.success('Registration successful!');
          navigate('/');
        }
      } catch (err) {
        toast.error(err || 'Registration failed. Please try again.');
      }
    },
  });

  return (
    <>
      <Helmet>
        <title>Create Account | Amazon Order Dashboard</title>
        <meta name="description" content="Register an account on the Amazon Order Dashboard." />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 relative overflow-hidden px-4">
        {/* Decorative Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/15 blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-md z-10 py-8">
          {/* Logo / Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold text-2xl shadow-xl shadow-amber-500/20 mb-3">
              a
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">Create Account</h2>
            <p className="text-slate-400 mt-1.5 text-sm">
              Register to start managing customer orders
            </p>
          </div>

          {/* Registration Card */}
          <div className="bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8">
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <PersonIcon className="w-5 h-5" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border rounded-2xl outline-none transition-all text-sm ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
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
                    placeholder="name@company.com"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border rounded-2xl outline-none transition-all text-sm ${
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

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
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
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border rounded-2xl outline-none transition-all text-sm ${
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
                    {showPassword ? (
                      <VisibilityOffIcon className="w-5 h-5" />
                    ) : (
                      <VisibilityIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.password}</p>
                )}
              </div>

              {/* Role Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <ShieldIcon className="w-5 h-5" />
                  </div>
                  <select
                    id="role"
                    name="role"
                    value={formik.values.role}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-2xl outline-none text-sm text-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none cursor-pointer"
                  >
                    <option value="user" className="bg-slate-800 text-slate-200">
                      Standard User
                    </option>
                    <option value="admin" className="bg-slate-800 text-slate-200">
                      System Administrator
                    </option>
                  </select>
                </div>
                {formik.touched.role && formik.errors.role && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.role}</p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-2xl hover:from-amber-400 hover:to-orange-400 transition-all flex items-center justify-center shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm mt-2"
              >
                {isLoading ? (
                  <CircularProgress size={20} color="inherit" className="mr-2" />
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-5 text-center text-sm">
              <span className="text-slate-400">Already registered? </span>
              <Link
                to="/login"
                className="text-amber-500 hover:text-amber-400 font-semibold underline underline-offset-4"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
