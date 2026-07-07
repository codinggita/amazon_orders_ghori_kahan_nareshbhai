import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { updateUserProfile, fetchUserProfile } from '../features/authSlice';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';
import API from '../services/api';

// MUI Icons
import PersonIcon from '@mui/icons-material/Person';
import DevicesIcon from '@mui/icons-material/Devices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';


export const Profile = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Fetch active sessions
  const getSessionsList = async () => {
    setLoadingSessions(true);
    try {
      const response = await API.get('/auth/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
    const timer = setTimeout(() => {
      getSessionsList();
    }, 0);
    return () => clearTimeout(timer);
  }, [dispatch]);

  const formik = useFormik({
    initialValues: {
      name: user?.name || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().max(50, 'Must be 50 characters or less').required('Name is required'),
    }),
    onSubmit: async (values) => {
      try {
        await dispatch(updateUserProfile({ name: values.name })).unwrap();
        toast.success('Profile name updated successfully!');
      } catch (err) {
        toast.error(err || 'Failed to update profile');
      }
    },
  });

  const handleRevokeSession = async (sessionId) => {
    try {
      const response = await API.delete(`/auth/sessions/${sessionId}`);
      if (response.data.success) {
        toast.success('Session revoked successfully!');
        setSessions(sessions.filter((s) => s.sessionId !== sessionId));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke session');
    }
  };

  return (
    <>
      <Helmet>
        <title>My Profile Settings | Amazon Order Dashboard</title>
        <meta name="description" content="Manage your personal profile information, name preferences, and active authenticated sessions." />
        <meta property="og:title" content="My Profile Settings | Amazon Order Dashboard" />
        <meta property="og:description" content="Access account info and revoke login sessions." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "My Profile Settings",
            "description": "User profile dashboard workspace.",
            "isPartOf": {
              "@type": "WebApplication",
              "name": "Amazon Orders Dashboard",
              "url": "http://localhost:5173"
            }
          })}
        </script>
      </Helmet>

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        <div className="animate-slide-up">
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Profile Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your personal information and active login sessions.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Update Name Form */}
          <div className="lg:col-span-1 premium-card p-6 space-y-6 animate-slide-up">
            {/* Avatar Area */}
            <div className="flex flex-col items-center gap-3 pb-5 border-b border-white/[0.05]">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-3xl shadow-xl shadow-amber-500/25">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-amber-400/40 to-orange-500/30 blur -z-10" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#111827] dark:border-[#090d1a] rounded-full shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-[11px] text-slate-500">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <PersonIcon style={{ fontSize: 18 }} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Personal Info</h3>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-black/20 border border-white/[0.04] rounded-xl text-slate-500 text-sm cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`input-dark w-full px-4 py-2.5 text-sm rounded-xl ${
                    formik.touched.name && formik.errors.name ? 'error' : ''
                  }`}
                />
                {formik.touched.name && formik.errors.name && (
                  <p className="text-[11px] text-rose-400 font-medium animate-slide-down">{formik.errors.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-amber w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                ) : (
                  <><EditIcon style={{ fontSize: 16 }} /> Save Changes</>
                )}
              </button>
            </form>
          </div>

          {/* Sessions Management */}
          <div className="lg:col-span-2 premium-card p-6 space-y-5 animate-slide-up" style={{ animationDelay: '80ms' }}>
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.05]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <DevicesIcon style={{ fontSize: 18 }} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Active Login Sessions</h3>
              </div>
              <button
                onClick={getSessionsList}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
              >
                Refresh
              </button>
            </div>

            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-6">No active sessions found.</p>
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {sessions.map((sess) => (
                  <div
                    key={sess.sessionId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {sess.device || 'Unknown Device'}
                        {sess.sessionId === localStorage.getItem('sessionId') && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold badge-delivered">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        IP: {sess.ip} · Last Active: {new Date(sess.lastActive).toLocaleString()}
                      </p>
                    </div>

                    {sess.sessionId !== localStorage.getItem('sessionId') && (
                      <button
                        onClick={() => handleRevokeSession(sess.sessionId)}
                        className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 border border-rose-500/25 hover:bg-rose-500/10 text-rose-400 rounded-lg transition-all self-start sm:self-auto"
                      >
                        <DeleteIcon style={{ fontSize: 14 }} />
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
