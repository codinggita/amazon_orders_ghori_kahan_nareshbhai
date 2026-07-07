import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import ShieldIcon from '@mui/icons-material/Shield';
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import StorageIcon from '@mui/icons-material/Storage';
import DnsIcon from '@mui/icons-material/Dns';
import MemoryIcon from '@mui/icons-material/Memory';
import SettingsIcon from '@mui/icons-material/Settings';
import SpeedIcon from '@mui/icons-material/Speed';
import TerminalIcon from '@mui/icons-material/Terminal';
import BackupIcon from '@mui/icons-material/Backup';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

import API from '../services/api';
import { fetchDashboardStats } from '../features/dataSlice';

/* ── Animated KPI Card ──────────────────────────────────────── */
const KpiCard = ({ icon, label, value, color, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(0);
  const numVal = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const isMonetary = String(value).startsWith('$');
  const isFrac = String(value).includes('.');
  const rafRef = useRef(null);

  useEffect(() => {
    let start = null;
    const duration = 900;
    const animate = (ts) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setDisplayed(eased * numVal);
      if (prog < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [numVal]);

  const formatVal = () => {
    if (isMonetary) {
      return `$${displayed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (isFrac) return displayed.toFixed(2);
    return Math.round(displayed).toLocaleString();
  };

  const colorMap = {
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
    indigo: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400',
  };

  return (
    <div
      className="premium-card animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br border ${colorMap[color]}`}>
          <span className="block">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest truncate">{label}</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5 tabular-nums tracking-tight">
            {formatVal()}
          </p>
        </div>
      </div>
    </div>
  );
};

/* ── System Health Dot ────────────────────────────────────────── */
const StatusDot = ({ status }) => {
  const isOnline = status === 'connected' || status === 'online';
  return (
    <div className="relative flex items-center gap-1.5">
      <span className={`relative flex w-2 h-2`}>
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      </span>
      <span className={`text-xs font-bold capitalize ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>{status}</span>
    </div>
  );
};

/* ── Toggle Switch ────────────────────────────────────────────── */
const ToggleSwitch = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`toggle-switch shrink-0 ${checked ? 'bg-amber-500' : 'bg-slate-700 dark:bg-slate-800'}`}
  >
    <div className={`toggle-switch-thumb ${checked ? 'toggle-switch-on' : ''}`} />
  </button>
);

/* ── Main Component ───────────────────────────────────────────── */
export const DashboardOverview = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { stats, isStatsLoading } = useSelector((state) => state.data);

  const [systemHealth, setSystemHealth] = useState(null);
  const [serverLogs, setServerLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const loadDashboardData = useCallback(async () => {
    dispatch(fetchDashboardStats());
    if (user?.role === 'admin') {
      try {
        setAdminLoading(true);
        const [healthRes, logsRes, backupsRes] = await Promise.all([
          API.get('/admin/system/health'),
          API.get('/admin/system/logs?limit=15'),
          API.get('/admin/backups'),
        ]);
        setSystemHealth(healthRes.data.data);
        setServerLogs(logsRes.data.data || []);
        setBackups(backupsRes.data.data || []);
        setMaintenanceEnabled(healthRes.data.data.maintenance?.enabled || false);
        setMaintenanceMessage(healthRes.data.data.maintenance?.message || 'System under maintenance.');
      } catch (err) {
        console.error('Failed to load system dashboard aggregates:', err);
        toast.error('Could not load server monitoring data');
      } finally {
        setAdminLoading(false);
      }
    }
  }, [dispatch, user]);

  useEffect(() => {
    const timer = setTimeout(() => { loadDashboardData(); }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboardData]);

  const handleClearCache = async () => {
    try {
      const loadToast = toast.loading('Clearing application cache...');
      const res = await API.delete('/admin/cache/clear');
      toast.dismiss(loadToast);
      if (res.data.success) toast.success(`Cache cleared! Cleared ${res.data.data.keysCleared} keys.`);
    } catch { toast.error('Failed to clear server cache'); }
  };

  const handleToggleMaintenance = async () => {
    const nextState = !maintenanceEnabled;
    if (!window.confirm(`Are you sure you want to ${nextState ? 'ENABLE' : 'DISABLE'} maintenance mode?`)) return;
    try {
      const loadToast = toast.loading('Updating maintenance state...');
      const res = await API.post('/admin/system/maintenance', {
        enable: nextState,
        message: maintenanceMessage || 'System is under maintenance. Please check back later.',
      });
      toast.dismiss(loadToast);
      if (res.data.success) {
        setMaintenanceEnabled(res.data.data.maintenanceMode);
        toast.success(`Maintenance mode is now ${res.data.data.maintenanceMode ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update maintenance state'); }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getMethodColor = (method) => {
    const m = { GET: 'text-sky-400 bg-sky-500/10', POST: 'text-emerald-400 bg-emerald-500/10', PUT: 'text-amber-400 bg-amber-500/10', DELETE: 'text-rose-400 bg-rose-500/10', PATCH: 'text-purple-400 bg-purple-500/10' };
    return m[method] || 'text-slate-400 bg-slate-500/10';
  };

  return (
    <>
      <Helmet>
        <title>Dashboard Overview | Amazon Order Dashboard</title>
        <meta name="description" content="Manage and review Amazon-style customer orders." />
      </Helmet>

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">

        {/* ── Welcome Hero ──────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl p-7 animate-slide-up"
             style={{ background: 'linear-gradient(135deg, #111827 0%, #0d1220 50%, #1a2438 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Ambient glow */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <WbSunnyIcon className="text-amber-400" style={{ fontSize: 16 }} />
                <span className="text-xs font-semibold text-amber-400">{greeting}</span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                {user?.name} 👋
              </h2>
              <p className="text-slate-500 text-sm mt-1.5 max-w-lg">
                Welcome back to your Amazon Order Management System. Here&apos;s a snapshot of your dashboard.
              </p>
            </div>
            <div className="flex gap-3 items-center shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-bold uppercase tracking-wider text-slate-300">
                <ShieldIcon style={{ fontSize: 14, color: '#f59e0b' }} />
                {user?.role}
              </div>
              {user?.role === 'admin' && (
                <button
                  onClick={loadDashboardData}
                  disabled={adminLoading || isStatsLoading}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 transition-all disabled:opacity-50"
                  title="Refresh Dashboard"
                >
                  <RefreshIcon className={adminLoading ? 'animate-spin' : ''} style={{ fontSize: 18 }} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Profile Summary Row ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <AccountCircleIcon style={{ fontSize: 22 }} />, label: 'Full Name', value: user?.name, color: 'amber' },
            { icon: <AlternateEmailIcon style={{ fontSize: 22 }} />, label: 'Email Address', value: user?.email, color: 'blue', truncate: true },
            { icon: <VerifiedUserIcon style={{ fontSize: 22 }} />, label: 'Email Status', badge: user?.isEmailVerified ? 'Verified' : 'Pending', badgeColor: user?.isEmailVerified ? 'emerald' : 'amber', color: 'emerald' },
            { icon: <ShieldIcon style={{ fontSize: 22 }} />, label: 'Account Health', badge: user?.isActive ? 'Active' : 'Deactivated', badgeColor: user?.isActive ? 'emerald' : 'rose', color: 'rose' },
          ].map((item, i) => (
            <div key={i} className="premium-card animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="p-5 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  { amber: 'bg-amber-500/10 text-amber-400', blue: 'bg-blue-500/10 text-blue-400', emerald: 'bg-emerald-500/10 text-emerald-400', rose: 'bg-rose-500/10 text-rose-400' }[item.color]
                }`}>
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                  {item.badge ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold ${
                      item.badgeColor === 'emerald' ? 'badge-delivered' :
                      item.badgeColor === 'amber' ? 'badge-pending' :
                      'badge-cancelled'
                    }`}>
                      {item.badge}
                    </span>
                  ) : (
                    <p className={`text-sm font-bold text-slate-800 dark:text-slate-100 ${item.truncate ? 'truncate' : ''}`}>
                      {item.value}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ADMIN VIEW ─────────────────────────────────────── */}
        {user?.role === 'admin' && (
          <div className="space-y-6">

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <KpiCard
                icon={<ShoppingCartIcon style={{ fontSize: 22 }} />}
                label="Total Orders"
                value={isStatsLoading ? 0 : stats.metrics?.totalOrders || 0}
                color="amber"
                delay={0}
              />
              <KpiCard
                icon={<AttachMoneyIcon style={{ fontSize: 22 }} />}
                label="Total Revenue"
                value={isStatsLoading ? '$0.00' : formatCurrency(stats.metrics?.totalRevenue || 0)}
                color="emerald"
                delay={100}
              />
              <KpiCard
                icon={<ShoppingBagIcon style={{ fontSize: 22 }} />}
                label="Avg Order Value"
                value={isStatsLoading ? '$0.00' : formatCurrency(stats.metrics?.avgOrderValue || 0)}
                color="blue"
                delay={200}
              />
            </div>

            {/* System Performance & Admin Utilities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Server Monitoring */}
              <div className="lg:col-span-2 premium-card animate-slide-up">
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <DnsIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                      Server Monitoring
                    </h4>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Live Diagnostics
                    </span>
                  </div>

                  {adminLoading ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 skeleton rounded-xl" />
                      ))}
                    </div>
                  ) : systemHealth ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { icon: <StorageIcon style={{ fontSize: 14 }} />, label: 'Database', value: <StatusDot status={systemHealth.database?.state} /> },
                          { icon: <SpeedIcon style={{ fontSize: 14 }} />, label: 'DB Latency', value: <span className="text-sm font-black text-slate-800 dark:text-slate-200">{systemHealth.database?.pingMs}ms</span> },
                          { icon: <SettingsIcon style={{ fontSize: 14 }} />, label: 'Uptime', value: <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block" title={systemHealth.server?.uptime}>{systemHealth.server?.uptime}</span>, colspan: true },
                        ].map((item, i) => (
                          <div key={i} className={`p-3.5 rounded-xl bg-black/20 dark:bg-black/30 border border-white/[0.05] space-y-1.5 ${item.colspan ? 'col-span-2' : ''}`}>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              <span className="text-slate-600">{item.icon}</span>
                              {item.label}
                            </div>
                            {item.value}
                          </div>
                        ))}
                      </div>

                      {/* CPU Info */}
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <MemoryIcon style={{ fontSize: 14 }} />
                          {systemHealth.cpu?.model}
                        </span>
                        <span className="font-bold text-slate-400">{systemHealth.cpu?.cores} cores</span>
                      </div>

                      {/* Memory Usage Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">RAM Utilization</span>
                          <span className="text-slate-800 dark:text-slate-200 font-black tabular-nums">
                            {systemHealth.memory?.processHeapUsedMB}MB / {systemHealth.memory?.systemTotalMB}MB
                            <span className="text-amber-400 ml-1">({systemHealth.memory?.usagePercent}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-black/20 dark:bg-black/30 rounded-full h-2.5 overflow-hidden border border-white/[0.04]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${systemHealth.memory?.usagePercent}%`,
                              background: `linear-gradient(90deg, #f59e0b, #f97316)`,
                              boxShadow: '0 0 8px rgba(245,158,11,0.5)',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-center py-8">Diagnostics currently unavailable.</p>
                  )}
                </div>
              </div>

              {/* Control Panel */}
              <div className="premium-card animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="p-6 flex flex-col h-full gap-5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">System Control Panel</h4>

                  <div className="space-y-3 flex-1">
                    {/* Maintenance Mode */}
                    <div className="p-4 rounded-xl bg-black/20 dark:bg-black/30 border border-white/[0.05] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Maintenance Mode</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Block non-admin API access</p>
                        {maintenanceEnabled && (
                          <span className="mt-1 inline-block text-[9px] font-extrabold text-rose-400 uppercase tracking-wider">● ACTIVE</span>
                        )}
                      </div>
                      <ToggleSwitch checked={maintenanceEnabled} onChange={handleToggleMaintenance} />
                    </div>

                    {/* Cache Cleaner */}
                    <div className="p-4 rounded-xl bg-black/20 dark:bg-black/30 border border-white/[0.05] flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Aggregate Cache</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">Flush backend aggregates</p>
                      </div>
                      <button
                        onClick={handleClearCache}
                        className="btn-amber px-3.5 py-1.5 text-xs rounded-xl shrink-0"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-700 text-center border-t border-white/[0.05] pt-3 font-mono">
                    Session: <span className="text-amber-500/60 select-all">{localStorage.getItem('sessionId')?.slice(0, 12) || 'n/a'}...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Logs & Backups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Live Server Logs */}
              <div className="premium-card animate-slide-up">
                <div className="p-6 flex flex-col min-h-[380px]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <TerminalIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                      Live Server Logs
                    </h4>
                    <span className="flex items-center gap-1.5 text-[9px] uppercase font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <FiberManualRecordIcon style={{ fontSize: 8 }} className="animate-pulse" />
                      Live
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                    {adminLoading ? (
                      [...Array(6)].map((_, i) => <div key={i} className="h-8 skeleton rounded-lg" />)
                    ) : serverLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600">No API calls recorded.</div>
                    ) : (
                      serverLogs.map((log, idx) => {
                        const isError = log.statusCode >= 400;
                        return (
                          <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-black/20 dark:bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${getMethodColor(log.method)}`}>
                                {log.method}
                              </span>
                              <span className="text-slate-400 truncate">{log.path}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-black text-xs ${isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {log.statusCode}
                              </span>
                              <span className="text-[10px] text-slate-600">({log.durationMs}ms)</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Database Backups */}
              <div className="premium-card animate-slide-up" style={{ animationDelay: '80ms' }}>
                <div className="p-6 flex flex-col min-h-[380px]">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <BackupIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                      Database Backups
                    </h4>
                    <span className="text-[10px] text-slate-600 bg-black/20 px-2 py-0.5 rounded-lg border border-white/[0.05]">Simulated</span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
                    {adminLoading ? (
                      [...Array(4)].map((_, i) => <div key={i} className="py-3"><div className="h-10 skeleton rounded-lg" /></div>)
                    ) : backups.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-600">No backups registered.</div>
                    ) : (
                      backups.map((bkp) => (
                        <div key={bkp.backupId} className="flex justify-between items-center py-3 gap-3 hover:bg-white/[0.02] transition-colors rounded-lg px-1">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono truncate">{bkp.backupId}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {new Date(bkp.createdAt).toLocaleDateString()} · <span className="capitalize">{bkp.type}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-black/20 text-slate-500 border border-white/[0.05]">
                              {(bkp.sizeKB / 1024).toFixed(1)}MB
                            </span>
                            <span className="badge-delivered inline-flex px-2 py-0.5 text-[10px] font-extrabold rounded-lg uppercase">
                              {bkp.status}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USER VIEW ──────────────────────────────────────── */}
        {user?.role !== 'admin' && (
          <div className="space-y-6">

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { to: '/orders', icon: <ShoppingCartIcon style={{ fontSize: 28 }} />, title: 'Orders Database', desc: 'View your complete order histories, filter actions, and check delivery status.', color: 'amber', delay: 0 },
                { to: '/profile', icon: <PersonIcon style={{ fontSize: 28 }} />, title: 'Profile Management', desc: 'Update contact settings, check authorization scopes, or revoke active sessions.', color: 'blue', delay: 100 },
                { to: '/settings', icon: <SettingsIcon style={{ fontSize: 28 }} />, title: 'Settings Panel', desc: 'Adjust theme layout, configure notification triggers, or flush local preferences.', color: 'emerald', delay: 200 },
              ].map((card) => {
                const colorMap = {
                  amber: { icon: 'bg-amber-500/10 text-amber-400 border-amber-500/20', hover: 'hover:border-amber-500/40', arrow: 'group-hover:text-amber-400' },
                  blue: { icon: 'bg-blue-500/10 text-blue-400 border-blue-500/20', hover: 'hover:border-blue-500/40', arrow: 'group-hover:text-blue-400' },
                  emerald: { icon: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', hover: 'hover:border-emerald-500/40', arrow: 'group-hover:text-emerald-400' },
                };
                return (
                  <Link
                    key={card.to}
                    to={card.to}
                    className={`premium-card group transition-all duration-200 ${colorMap[card.color].hover} animate-slide-up`}
                    style={{ animationDelay: `${card.delay}ms` }}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-5">
                        <div className={`p-3 rounded-xl border ${colorMap[card.color].icon} group-hover:scale-105 transition-transform`}>
                          {card.icon}
                        </div>
                        <ArrowForwardIcon
                          className={`text-slate-600 transition-colors ${colorMap[card.color].arrow}`}
                          style={{ fontSize: 18 }}
                        />
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">{card.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-600 leading-relaxed">{card.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Marketplace Metrics */}
            <div className="premium-card animate-slide-up">
              <div className="p-6 space-y-5">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <BarChartIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                  Overall Marketplace Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Total Sales Volume', value: `${stats.metrics?.totalOrders || 0} orders` },
                    { label: 'Gross Merchandise Value', value: formatCurrency(stats.metrics?.totalRevenue || 0) },
                    { label: 'Mean Transaction Ticket', value: formatCurrency(stats.metrics?.avgOrderValue || 0) },
                  ].map((m, i) => (
                    <div key={i} className="p-4 rounded-xl bg-black/10 dark:bg-black/20 border border-white/[0.05]">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{m.label}</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="premium-card animate-slide-up">
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Recent Orders</h4>
                  <Link
                    to="/orders"
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold transition-colors"
                  >
                    View All <ArrowForwardIcon style={{ fontSize: 14 }} />
                  </Link>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/20 dark:bg-black/30">
                        <th className="p-3">Order ID</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {stats.recentOrders?.length > 0 ? (
                        stats.recentOrders.slice(0, 5).map((order) => (
                          <tr key={order.OrderID} className="table-row-hover">
                            <td className="p-3 font-mono font-bold text-amber-400 text-xs">{order.OrderID}</td>
                            <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{order.CustomerName}</td>
                            <td className="p-3 text-slate-500 truncate max-w-[180px]">{order.ProductName}</td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(order.TotalAmount)}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold badge-${(order.OrderStatus || '').toLowerCase().replace(' ', '-')}`}>
                                {order.OrderStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-600">No recent orders registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardOverview;
