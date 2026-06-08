import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleThemeMode } from '../features/uiSlice';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// MUI Icons
import SettingsIcon from '@mui/icons-material/Settings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import StorageIcon from '@mui/icons-material/Storage';

export const Settings = () => {
  const dispatch = useDispatch();
  const { themeMode } = useSelector((state) => state.ui);

  const handleClearCache = () => {
    // Only clear temporary UI/cache configs, keep auth tokens!
    localStorage.removeItem('themeMode');
    toast.success('Local preferences reset successfully. Theme set to default.');
    window.location.reload();
  };

  return (
    <>
      <Helmet>
        <title>Settings | Amazon Order Dashboard</title>
        <meta name="description" content="Configure application preferences and theme mode settings." />
      </Helmet>

      <div className="space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
          Settings & Preferences
        </h2>

        <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-150 dark:border-slate-800">
            <div className="p-2 bg-amber-500/10 dark:bg-amber-500/5 text-amber-500 rounded-xl">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-850 dark:text-slate-100">
              General Settings
            </h3>
          </div>

          {/* Theme Mode Preference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-250">
                Visual Theme Mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toggle between light and dark visual themes. Default is dark mode.
              </p>
            </div>
            <button
              onClick={() => dispatch(toggleThemeMode())}
              className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 self-start sm:self-auto transition-colors"
            >
              {themeMode === 'light' ? (
                <>
                  <Brightness4Icon className="w-4 h-4 text-slate-500" />
                  Switch to Dark
                </>
              ) : (
                <>
                  <Brightness7Icon className="w-4 h-4 text-amber-500" />
                  Switch to Light
                </>
              )}
            </button>
          </div>

          {/* Clear Cache Preference */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-t border-slate-100 dark:border-slate-850 pt-6">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-250">
                Reset Local Cache
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resets the stored layout and theme choices without logging you out.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 border border-amber-250 dark:border-amber-950 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-2xl flex items-center gap-2 text-sm font-medium self-start sm:self-auto transition-colors"
            >
              <StorageIcon className="w-4 h-4" />
              Reset Preferences
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
