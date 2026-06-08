import React from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import ShieldIcon from '@mui/icons-material/Shield';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export const DashboardOverview = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <>
      <Helmet>
        <title>Dashboard Overview | Amazon Order Dashboard</title>
        <meta name="description" content="Manage and review Amazon-style customer orders." />
      </Helmet>

      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-850 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Hello, {user?.name}!
            </h2>
            <p className="text-slate-300 text-sm">
              Welcome to the Amazon Order Management System. Here is a snapshot of your profile.
            </p>
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 self-start md:self-auto">
            <ShieldIcon className="w-4 h-4 text-amber-500" />
            Role: {user?.role}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Card 1: Full Name */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 rounded-xl">
              <AccountCircleIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Full Name
              </p>
              <p className="text-base font-bold text-slate-850 dark:text-slate-100 truncate">
                {user?.name}
              </p>
            </div>
          </div>

          {/* Card 2: Email */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="p-3 bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-500 rounded-xl">
              <AlternateEmailIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Email Address
              </p>
              <p className="text-base font-bold text-slate-850 dark:text-slate-100 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Card 3: Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-500 rounded-xl">
              <VerifiedUserIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Email Status
              </p>
              <p className="text-base font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                {user?.isEmailVerified ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                    Pending
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Card 4: Status System */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 dark:bg-rose-500/5 text-rose-500 rounded-xl">
              <ShieldIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Account Health
              </p>
              <p className="text-base font-bold text-slate-850 dark:text-slate-100 flex items-center">
                {user?.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400">
                    Banned
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Feature Setup Checklist Info Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Frontend Authentication Setup Complete
          </h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            You are currently viewing the default shell overview. The core authentication features are successfully configured:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-400 space-y-1.5">
            <li><strong>Router Guards</strong>: Direct route validation preventing access without valid JWT tokens.</li>
            <li><strong>Axios Interceptors</strong>: Automatic extraction of auth headers and pre-flight handling.</li>
            <li><strong>State Hydration</strong>: Tokens are loaded from secure persistent local storage on refresh.</li>
            <li><strong>Dual-Theme system</strong>: Light/Dark settings with persistent storage.</li>
          </ul>
        </div>
      </div>
    </>
  );
};

export default DashboardOverview;
