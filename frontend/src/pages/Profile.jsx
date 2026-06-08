import React, { useEffect, useState } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';

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
    getSessionsList();
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
        <title>My Profile | Amazon Order Dashboard</title>
        <meta name="description" content="Manage your profile settings and active logins." />
      </Helmet>

      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
          Profile Settings
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Update Name Form */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-150 dark:border-slate-800">
              <div className="p-2 bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 rounded-xl">
                <PersonIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-850 dark:text-slate-100">
                Personal Info
              </h3>
            </div>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className={`w-full px-4 py-2.5 bg-transparent border rounded-2xl outline-none text-sm text-slate-800 dark:text-slate-150 transition-all ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                    }`}
                  />
                </div>
                {formik.touched.name && formik.errors.name && (
                  <p className="text-xs text-red-400 mt-1">{formik.errors.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/10 disabled:opacity-50 text-sm flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <>
                    <EditIcon className="w-4 h-4" />
                    Save Name
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sessions Management */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-500 rounded-xl">
                  <DevicesIcon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-855 dark:text-slate-100">
                  Active Logged-in Sessions
                </h3>
              </div>
              <button
                onClick={getSessionsList}
                className="text-xs text-amber-500 hover:text-amber-400 font-semibold underline underline-offset-4"
              >
                Refresh
              </button>
            </div>

            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <CircularProgress size={24} className="text-amber-500" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No active sessions found.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((sess) => (
                  <div
                    key={sess.sessionId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        {sess.device || 'Unknown Device'}
                        {sess.sessionId === localStorage.getItem('sessionId') && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                            Current Session
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        IP Address: {sess.ip} • Last Active: {new Date(sess.lastActive).toLocaleString()}
                      </p>
                    </div>

                    {sess.sessionId !== localStorage.getItem('sessionId') && (
                      <button
                        onClick={() => handleRevokeSession(sess.sessionId)}
                        className="px-3 py-1.5 border border-red-200 dark:border-red-950 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 text-xs rounded-xl font-semibold flex items-center gap-1 self-start sm:self-auto transition-colors"
                      >
                        <DeleteIcon className="w-3.5 h-3.5" />
                        Revoke Access
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
