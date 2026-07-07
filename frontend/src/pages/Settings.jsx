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
        <title>General Settings | Amazon Order Dashboard</title>
        <meta name="description" content="Configure application visual theme styles, reset local storage layout cache, and manage general preferences." />
        <meta property="og:title" content="General Settings | Amazon Order Dashboard" />
        <meta property="og:description" content="Adjust visual preferences and dashboard cache options." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "General Settings",
            "description": "User preferences and system-wide setting dashboard screen.",
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
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Settings & Preferences</h2>
          <p className="text-sm text-slate-500 mt-1">Manage application visual theme, local cache, and preferences.</p>
        </div>

        <div className="max-w-2xl premium-card p-6 space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <SettingsIcon style={{ fontSize: 18 }} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">General Settings</h3>
          </div>

          {/* Theme Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                {themeMode === 'light'
                  ? <Brightness4Icon style={{ fontSize: 16, color: '#64748b' }} />
                  : <Brightness7Icon style={{ fontSize: 16, color: '#f59e0b' }} />}
                Visual Theme Mode
              </p>
              <p className="text-[11px] text-slate-500">
                Toggle between light and dark visual themes. Default is dark mode.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-500 font-medium">{themeMode === 'light' ? 'Light' : 'Dark'}</span>
              <button
                type="button"
                onClick={() => dispatch(toggleThemeMode())}
                className={`toggle-switch ${themeMode === 'dark' ? 'bg-amber-500' : 'bg-slate-600 dark:bg-slate-700'}`}
              >
                <div className={`toggle-switch-thumb ${themeMode === 'dark' ? 'toggle-switch-on' : ''}`} />
              </button>
            </div>
          </div>

          {/* Clear Cache */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-t border-white/[0.05]">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <StorageIcon style={{ fontSize: 16, color: '#f59e0b' }} />
                Reset Local Cache
              </p>
              <p className="text-[11px] text-slate-500">
                Resets stored layout and theme choices without logging you out.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 border border-amber-500/25 hover:bg-amber-500/10 text-amber-400 hover:text-amber-300 rounded-xl text-sm font-semibold self-start sm:self-auto transition-all"
            >
              <StorageIcon style={{ fontSize: 16 }} />
              Reset Preferences
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;
