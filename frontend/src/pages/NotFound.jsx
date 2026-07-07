import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import HomeIcon from '@mui/icons-material/Home';
import SearchOffIcon from '@mui/icons-material/SearchOff';

export const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found | Amazon Orders Dashboard</title>
        <meta name="description" content="The page you're looking for doesn't exist or has been moved." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-[#090d1a] p-6">
        {/* Ambient glow */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
            style={{ width: 500, height: 500, background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative text-center space-y-8 max-w-md w-full animate-slide-up">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/[0.08] shadow-2xl">
              <SearchOffIcon style={{ fontSize: 64, color: '#f59e0b' }} />
            </div>
          </div>

          {/* 404 */}
          <div className="space-y-3">
            <h1 className="text-8xl font-black text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' }}>
              404
            </h1>
            <h2 className="text-xl font-bold text-slate-200">Page Not Found</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              The page you're looking for doesn't exist, was removed,
              or is temporarily unavailable.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              <HomeIcon style={{ fontSize: 18 }} />
              Back to Dashboard
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/[0.08] hover:bg-white/[0.05] text-slate-400 hover:text-slate-200 font-semibold rounded-xl text-sm transition-all"
            >
              Go Back
            </button>
          </div>

          {/* Breadcrumb hint */}
          <p className="text-[11px] text-slate-600">
            Amazon Orders Dashboard &middot; Error 404
          </p>
        </div>
      </div>
    </>
  );
};

export default NotFound;
