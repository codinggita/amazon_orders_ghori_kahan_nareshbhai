import { useState, useEffect, useLayoutEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toggleThemeMode, toggleSidebar } from '../features/uiSlice';
import { logoutUser } from '../features/authSlice';
import toast from 'react-hot-toast';

// MUI Icons
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BarChartIcon from '@mui/icons-material/BarChart';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ShieldIcon from '@mui/icons-material/Shield';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BoltIcon from '@mui/icons-material/Bolt';

// Live Clock component
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-xs font-mono font-semibold tabular-nums text-slate-400 dark:text-slate-500 hidden lg:block">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

export const DashboardLayout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useSelector((state) => state.auth);
  const { themeMode, sidebarOpen } = useSelector((state) => state.ui);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Close mobile menu on route change (useLayoutEffect to avoid set-state-in-effect lint)
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <DashboardIcon fontSize="small" />,
      description: 'Overview & metrics',
    },
    {
      name: 'Users',
      path: '/users',
      icon: <PeopleIcon fontSize="small" />,
      adminOnly: true,
      description: 'Manage accounts',
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: <ShoppingCartIcon fontSize="small" />,
      adminOnly: true,
      description: 'Order management',
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: <BarChartIcon fontSize="small" />,
      adminOnly: true,
      description: 'Revenue & trends',
    },
    {
      name: 'Profile',
      path: '/profile',
      icon: <PersonIcon fontSize="small" />,
      description: 'Your account',
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <SettingsIcon fontSize="small" />,
      description: 'Preferences',
    },
  ];

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || (user && user.role === 'admin')
  );

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    const found = navItems.find((n) => n.path === path);
    return found ? found.name : path.substring(1).replace('-', ' ');
  };

  const userInitial = user?.name?.charAt(0).toUpperCase() || '?';

  // Dummy notifications
  const notifications = [
    { id: 1, text: 'New order #AMZ-294810 placed', time: '2m ago', unread: true },
    { id: 2, text: 'System health check passed', time: '15m ago', unread: true },
    { id: 3, text: 'Monthly analytics report ready', time: '1h ago', unread: false },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#090d1a]">
      {/* ─── Mobile Overlay ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col h-full
          sidebar-gradient
          transition-all duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header / Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.05]">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Logo mark */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <BoltIcon className="text-slate-950" style={{ fontSize: 16 }} />
              </div>
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 opacity-20 blur-sm -z-10" />
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <span className="font-extrabold text-base bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent truncate block tracking-tight leading-tight">
                  AmazonDash
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-600 font-medium tracking-wider uppercase">
                  Admin Panel
                </span>
              </div>
            )}
          </div>
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="hidden md:flex p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            {sidebarOpen ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {/* Section label */}
          {sidebarOpen && (
            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-700 uppercase tracking-widest px-2 mb-3">
              Navigation
            </p>
          )}
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!sidebarOpen ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl
                  nav-item group relative
                  ${isActive ? 'nav-item-active' : 'text-slate-500 dark:text-slate-600'}
                `}
              >
                <span
                  className={`shrink-0 transition-all duration-200
                    ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300 dark:group-hover:text-slate-400'}
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                  `}
                >
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <div className="min-w-0 flex-1">
                    <span className={`text-sm font-semibold block truncate transition-colors
                      ${isActive
                        ? 'text-amber-400 dark:text-amber-300'
                        : 'text-slate-600 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      }`}>
                      {item.name}
                    </span>
                  </div>
                )}
                {/* Active indicator glow */}
                {isActive && (
                  <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_2px_rgba(251,191,36,0.5)]" />
                )}
                {/* Tooltip on collapsed */}
                {!sidebarOpen && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10 shadow-xl">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer — User Info */}
        <div className="p-3 border-t border-white/[0.05]">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-colors cursor-default overflow-hidden">
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20">
                  {userInitial}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#090d1a] rounded-full shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  {user?.name}
                  {user?.role === 'admin' && (
                    <ShieldIcon style={{ fontSize: 12, color: '#f59e0b' }} />
                  )}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-600 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black text-sm">
                  {userInitial}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#090d1a] rounded-full" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main Content Area ───────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ─── Top Navbar ─────────────────────────────────────── */}
        <header className="flex items-center justify-between h-16 px-4 md:px-6 border-b border-slate-200/50 dark:border-white/[0.05] bg-white/80 dark:bg-[#090d1a]/80 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile burger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors md:hidden"
            >
              <MenuIcon fontSize="small" />
            </button>

            {/* Breadcrumb title */}
            <div>
              <h1 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 capitalize tracking-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-600 hidden md:block">
                Amazon Orders Admin Panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live clock */}
            <LiveClock />

            {/* Theme Toggle */}
            <button
              onClick={() => dispatch(toggleThemeMode())}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {themeMode === 'light' ? (
                <DarkModeIcon fontSize="small" />
              ) : (
                <LightModeIcon fontSize="small" />
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileDropdownOpen(false); }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/5 transition-all relative"
              >
                <NotificationsNoneIcon fontSize="small" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 z-20 animate-slide-down">
                    <div className="modal-content rounded-2xl overflow-hidden shadow-2xl">
                      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Notifications</p>
                        <span className="text-[10px] text-amber-500 font-bold cursor-pointer hover:text-amber-400">
                          Mark all read
                        </span>
                      </div>
                      <div className="divide-y divide-white/[0.05]">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`px-4 py-3 flex items-start gap-3 hover:bg-white/[0.03] transition-colors cursor-pointer ${n.unread ? '' : 'opacity-60'}`}
                          >
                            {n.unread && (
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                            )}
                            {!n.unread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />}
                            <div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-snug">{n.text}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-600 mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all focus:outline-none"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-500/20">
                  {userInitial}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {user?.name?.split(' ')[0]}
                </span>
                <KeyboardArrowDownIcon
                  className={`hidden md:block text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                  fontSize="small"
                />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-60 z-20 animate-slide-down">
                    <div className="modal-content rounded-2xl overflow-hidden shadow-2xl">
                      {/* User info header */}
                      <div className="p-4 border-b border-white/[0.06]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
                            {userInitial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                              {user?.name}
                              {user?.role === 'admin' && (
                                <span className="text-[9px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/25 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-600 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-1.5">
                        <Link
                          to="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <PersonIcon fontSize="small" className="text-slate-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <SettingsIcon fontSize="small" className="text-slate-400" />
                          Settings
                        </Link>
                        <div className="mx-3 my-1 h-px bg-slate-100 dark:bg-white/[0.05]" />
                        <button
                          onClick={() => { setProfileDropdownOpen(false); handleLogout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-500 hover:bg-rose-500/[0.07] transition-colors"
                        >
                          <ExitToAppIcon fontSize="small" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ─── Content Viewport ──────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-[#090d1a]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
