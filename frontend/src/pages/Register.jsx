import { useEffect, useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../features/authSlice';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import GoogleAuthButton from '../components/GoogleAuthButton';

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BoltIcon from '@mui/icons-material/Bolt';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/* ── Password Strength Meter ─────────────────────────────────── */
const PasswordStrength = ({ password }) => {
  const strength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const labels = ['', 'Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#22d3ee'];
  const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];

  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-slate-600 font-medium">Password strength</span>
        <span className="text-[10px] font-bold" style={{ color: colors[strength] }}>
          {labels[strength]}
        </span>
      </div>
      <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: widths[strength], backgroundColor: colors[strength] }}
        />
      </div>
    </div>
  );
};

/* ── Role Selector Card ──────────────────────────────────────── */
const RoleSelector = ({ value, onChange }) => {
  const roles = [
    {
      value: 'user',
      label: 'Standard User',
      desc: 'Access orders & profile',
      icon: <PersonIcon style={{ fontSize: 20 }} />,
      color: 'blue',
    },
    {
      value: 'admin',
      label: 'Administrator',
      desc: 'Full system access',
      icon: <AdminPanelSettingsIcon style={{ fontSize: 20 }} />,
      color: 'amber',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map((role) => {
        const isSelected = value === role.value;
        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={`
              relative flex flex-col items-start gap-1 p-3 rounded-xl border transition-all text-left
              ${isSelected
                ? role.color === 'amber'
                  ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                  : 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.04]'
              }
            `}
          >
            <div className={`${isSelected
              ? role.color === 'amber' ? 'text-amber-400' : 'text-blue-400'
              : 'text-slate-600'
            } transition-colors`}>
              {role.icon}
            </div>
            <div>
              <p className={`text-xs font-bold ${isSelected ? (role.color === 'amber' ? 'text-amber-300' : 'text-blue-300') : 'text-slate-400'}`}>
                {role.label}
              </p>
              <p className="text-[10px] text-slate-600">{role.desc}</p>
            </div>
            {isSelected && (
              <CheckCircleIcon
                className={role.color === 'amber' ? 'text-amber-400' : 'text-blue-400'}
                style={{ fontSize: 14, position: 'absolute', top: 8, right: 8 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ── Background Orbs ─────────────────────────────────────────── */
const BackgroundOrbs = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full"
         style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 65%)' }} />
    <div className="absolute bottom-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full"
         style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 65%)' }} />
  </div>
);

/* ── Main Register component ─────────────────────────────────── */
export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, accessToken } = useSelector((state) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    if (accessToken) navigate('/', { replace: true });
    dispatch(clearError());
  }, [accessToken, navigate, dispatch]);

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', role: 'user' },
    validationSchema: Yup.object({
      name: Yup.string().max(50, 'Must be 50 characters or less').required('Full name is required'),
      email: Yup.string().email('Invalid email address').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
      role: Yup.string().oneOf(['user', 'admin'], 'Invalid role').required('Role is required'),
    }),
    onSubmit: async (values) => {
      try {
        const resultAction = await dispatch(
          registerUser({ name: values.name, email: values.email, password: values.password, role: values.role })
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

      <div className="min-h-screen auth-bg flex items-stretch">
        <BackgroundOrbs />

        {/* Left Branding Panel (mirrored from Login) */}
        <div className="hidden lg:flex flex-col justify-between p-12 w-[45%] border-r border-white/[0.05] relative">
          <div className="absolute inset-0 pointer-events-none"
               style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(245,158,11,0.07) 0%, transparent 60%)' }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-xl shadow-amber-500/30">
              <BoltIcon className="text-slate-950" style={{ fontSize: 20 }} />
            </div>
            <div>
              <span className="font-extrabold text-lg bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent tracking-tight block">
                AmazonDash
              </span>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">Admin Panel</span>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
                Join the<br />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Admin Network
                </span>
              </h2>
              <p className="mt-4 text-slate-500 text-sm leading-relaxed max-w-xs">
                Create your account and choose your access role. Admins get full access to orders, analytics, and system controls.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Levels</p>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <PersonIcon className="text-blue-400" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Standard User</p>
                  <p className="text-[10px] text-slate-600">View orders & profile management</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <AdminPanelSettingsIcon className="text-amber-400" style={{ fontSize: 14 }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-300">Administrator</p>
                  <p className="text-[10px] text-slate-600">Full CRUD, analytics & system admin</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 italic relative z-10">
            "Built with React, Node.js, MongoDB & Express"
          </p>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 flex items-center justify-center px-8 py-10 relative z-10">
          <div
            className={`w-full max-w-md transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="mb-7">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">Create account</h2>
              <p className="mt-2 text-sm text-slate-500">
                Fill in the details below to get started
              </p>
            </div>

            <div className="modal-content rounded-2xl p-8 space-y-5 animate-scale-in">
              <form onSubmit={formik.handleSubmit} className="space-y-5" noValidate>

                {/* Name Field */}
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <PersonOutlineIcon className="text-slate-600" style={{ fontSize: 18 }} />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className={`input-dark w-full pl-10 pr-4 py-3 text-sm ${
                        formik.touched.name && formik.errors.name ? 'error' : ''
                      }`}
                    />
                  </div>
                  {formik.touched.name && formik.errors.name && (
                    <p className="text-[11px] text-rose-400 font-medium animate-slide-down">{formik.errors.name}</p>
                  )}
                </div>

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
                    <p className="text-[11px] text-rose-400 font-medium animate-slide-down">{formik.errors.email}</p>
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
                      {showPassword ? <VisibilityOffIcon style={{ fontSize: 18 }} /> : <VisibilityIcon style={{ fontSize: 18 }} />}
                    </button>
                  </div>
                  <PasswordStrength password={formik.values.password} />
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-[11px] text-rose-400 font-medium animate-slide-down">{formik.errors.password}</p>
                  )}
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    Account Role
                  </label>
                  <RoleSelector
                    value={formik.values.role}
                    onChange={(val) => formik.setFieldValue('role', val)}
                  />
                  {formik.touched.role && formik.errors.role && (
                    <p className="text-[11px] text-rose-400 font-medium animate-slide-down">{formik.errors.role}</p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-amber w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2 mt-1"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowForwardIcon style={{ fontSize: 16 }} />
                    </>
                  )}
                </button>
              </form>

              {/* Google Sign-Up */}
              <GoogleAuthButton label="Sign up with Google" />

              <p className="text-center text-xs text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-400 hover:text-amber-300 font-bold transition-colors">
                  Sign In
                </Link>
              </p>
            </div>

            <p className="text-center text-[11px] text-slate-700 mt-6 flex items-center justify-center gap-1.5">
              <ShieldIcon style={{ fontSize: 12, color: '#4b5563' }} />
              Secured with JWT authentication & refresh tokens
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
