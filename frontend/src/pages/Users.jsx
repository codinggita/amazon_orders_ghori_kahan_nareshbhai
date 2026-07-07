import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

// MUI Icons
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ShieldIcon from '@mui/icons-material/Shield';
import PersonIcon from '@mui/icons-material/Person';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import {
  fetchUsers,
  banUser,
  unbanUser,
  changeUserRole,
  setUserPage,
  setUserLimit,
  setUserSearchQuery,
  setUserRoleFilter,
  clearUserFilters
} from '../features/userSlice';

export const Users = () => {
  const dispatch = useDispatch();
  
  // Get current logged-in user to prevent self-action
  const { user: currentUser } = useSelector((state) => state.auth);

  const {
    users,
    total,
    page,
    pages,
    limit,
    isLoading,
    searchQuery,
    roleFilter,
    error
  } = useSelector((state) => state.user);

  // Local state for search query
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Load users on filter changes
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch, page, limit, roleFilter]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setUserSearchQuery(searchInput));
        dispatch(fetchUsers());
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchInput, dispatch, searchQuery]);

  // Sync search input with Redux search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchInput(searchQuery);
    }, 0);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      dispatch(setUserPage(newPage));
    }
  };

  const handleLimitChange = (e) => {
    dispatch(setUserLimit(Number(e.target.value)));
  };

  const handleRoleFilterChange = (e) => {
    dispatch(setUserRoleFilter(e.target.value));
  };

  const handleClearAll = () => {
    setSearchInput('');
    dispatch(clearUserFilters());
    dispatch(fetchUsers());
  };

  // Perform Actions
  const handleBanToggle = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot ban your own account!');
      return;
    }

    const actionText = user.isActive ? 'ban' : 'unban';
    const confirmAction = window.confirm(`Are you sure you want to ${actionText} "${user.name}"?`);
    if (!confirmAction) return;

    try {
      const loadToast = toast.loading(`${user.isActive ? 'Banning' : 'Unbanning'} user...`);
      if (user.isActive) {
        await dispatch(banUser(user.id)).unwrap();
        toast.success(`User "${user.name}" banned successfully`);
      } else {
        await dispatch(unbanUser(user.id)).unwrap();
        toast.success(`User "${user.name}" unbanned successfully`);
      }
      toast.dismiss(loadToast);
    } catch (err) {
      toast.error(err || `Failed to ${actionText} user`);
    }
  };

  const handleRoleToggle = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error('You cannot change your own role!');
      return;
    }

    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    const confirmAction = window.confirm(
      `Are you sure you want to change "${user.name}" role from ${user.role.toUpperCase()} to ${nextRole.toUpperCase()}?`
    );
    if (!confirmAction) return;

    try {
      const loadToast = toast.loading(`Changing user role to ${nextRole}...`);
      await dispatch(changeUserRole({ userId: user.id, role: nextRole })).unwrap();
      toast.success(`User "${user.name}" role updated to ${nextRole}`);
      toast.dismiss(loadToast);
    } catch (err) {
      toast.error(err || 'Failed to update user role');
    }
  };

  return (
    <>
      <Helmet>
        <title>Users Management | Amazon Order Dashboard</title>
        <meta name="description" content="Manage and review system user permissions, block/ban statuses, and roles." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Users Management",
            "description": "Admin panel screen for managing registered dashboard users.",
            "isPartOf": {
              "@type": "WebApplication",
              "name": "Amazon Orders Dashboard",
              "url": "http://localhost:5173"
            }
          })}
        </script>
      </Helmet>

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-up">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
              <PeopleIcon style={{ fontSize: 26, color: '#f59e0b' }} /> Users Management
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage registered application users, grant admin privileges, or deactivate account sessions.
            </p>
          </div>
        </div>

        {/* Toolbar: Search & Role Filter */}
        <div className="premium-card p-4 animate-slide-up">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <SearchIcon style={{ fontSize: 18 }} />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Name or Email address..."
                className="input-dark w-full pl-10 pr-4 py-2.5 text-sm rounded-xl"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <ClearIcon style={{ fontSize: 16 }} />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-black/10 dark:bg-black/20 border border-white/[0.06] px-3 py-1.5 rounded-xl">
                <span className="text-[11px] text-slate-500 font-semibold">Role:</span>
                <select
                  value={roleFilter}
                  onChange={handleRoleFilterChange}
                  className="bg-transparent text-[11px] font-bold text-slate-400 focus:outline-none cursor-pointer border-none p-0 pr-5"
                >
                  <option value="" className="bg-slate-900">All Roles</option>
                  <option value="admin" className="bg-slate-900">Admin</option>
                  <option value="user" className="bg-slate-900">User</option>
                </select>
              </div>

              {(searchQuery || roleFilter) && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 border border-rose-500/20 hover:bg-rose-500/[0.07] rounded-xl transition-all"
                >
                  <ClearIcon style={{ fontSize: 14 }} /> Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Database Table View */}
        <div className="premium-card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/20">
                  <th className="p-4">User ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Account Health</th>
                  <th className="p-4 text-center">Sessions Count</th>
                  <th className="p-4">Registered On</th>
                  <th className="p-4 text-center w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-sm">
                {isLoading ? (
                  // Skeleton Loading Rows
                  Array.from({ length: limit }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-44"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-6 mx-auto"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <div className="w-20 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                          <div className="w-16 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  // Error Panel
                  <tr>
                    <td colSpan="8" className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2 text-rose-500">
                        <WarningAmberIcon className="w-8 h-8" />
                        <h4 className="font-bold">Error loading users</h4>
                        <p className="text-xs text-slate-500">{error}</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  // Empty State Row
                  <tr>
                    <td colSpan="8" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto text-slate-455">
                        <div className="p-3 bg-slate-105 dark:bg-slate-800/40 rounded-full text-slate-500">
                          <PeopleIcon className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-750 dark:text-slate-200">No Users Found</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No registered users match the search terms or filters selected.
                        </p>
                        <button
                          onClick={handleClearAll}
                          className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-705 dark:text-slate-300"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // User Rows
                  users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    // Gradient colors for avatar
                    const gradients = [
                      'from-amber-400 to-orange-500',
                      'from-blue-400 to-indigo-500',
                      'from-emerald-400 to-teal-500',
                      'from-purple-400 to-pink-500',
                      'from-rose-400 to-red-500',
                    ];
                    const grad = gradients[user.name?.charCodeAt(0) % gradients.length] || gradients[0];
                    return (
                      <tr
                        key={user.id}
                        className={`table-row-hover transition-colors ${
                          isSelf ? 'bg-amber-500/[0.04]' : ''
                        }`}
                      >
                        {/* User ID */}
                        <td className="p-4 font-mono text-xs font-bold text-slate-500">
                          {user.id}
                        </td>
                        
                        {/* Name */}
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white font-black text-xs shadow-md shrink-0`}>
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="flex items-center gap-1.5">
                              {user.name}
                              {isSelf && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                                  You
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        
                        {/* Email */}
                        <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                          {user.email}
                        </td>
                        
                        {/* Role */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            user.role === 'admin'
                              ? 'badge-pending'
                              : 'badge-archived'
                          }`}>
                            {user.role === 'admin' ? (
                              <><ShieldIcon style={{ fontSize: 12 }} /> Admin</>
                            ) : (
                              <><PersonIcon style={{ fontSize: 12 }} /> User</>
                            )}
                          </span>
                        </td>
                        
                        {/* Account status */}
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                            user.isActive ? 'badge-delivered' : 'badge-cancelled'
                          }`}>
                            {user.isActive ? 'Active' : 'Banned'}
                          </span>
                        </td>
                        
                        {/* Active Session count */}
                        <td className="p-4 text-center text-slate-700 dark:text-slate-300 font-semibold">
                          {user.sessionCount || 0}
                        </td>
                        
                        {/* Registered date */}
                        <td className="p-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </td>
                        
                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex gap-2 justify-center items-center">
                            <button
                              onClick={() => handleRoleToggle(user)}
                              disabled={isSelf}
                              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 border rounded-lg transition-all focus:outline-none ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed border-white/[0.06] text-slate-500'
                                  : 'border-indigo-500/25 hover:bg-indigo-500/10 text-indigo-400'
                              }`}
                              title={user.role === 'admin' ? 'Revoke admin status' : 'Promote to admin'}
                            >
                              <ShieldIcon style={{ fontSize: 13 }} />
                              Role
                            </button>

                            <button
                              onClick={() => handleBanToggle(user)}
                              disabled={isSelf}
                              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 border rounded-lg transition-all focus:outline-none ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed border-white/[0.06] text-slate-500'
                                  : user.isActive
                                  ? 'border-rose-500/25 hover:bg-rose-500/10 text-rose-400'
                                  : 'border-emerald-500/25 hover:bg-emerald-500/10 text-emerald-400'
                              }`}
                              title={user.isActive ? 'Ban Account' : 'Activate Account'}
                            >
                              {user.isActive ? (
                                <><GavelIcon style={{ fontSize: 13 }} /> Ban</>
                              ) : (
                                <><CheckCircleIcon style={{ fontSize: 13 }} /> Unban</>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          {!isLoading && !error && users.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-white/[0.05] text-slate-500 text-xs">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={limit}
                  onChange={handleLimitChange}
                  className="px-2 py-1 bg-black/20 border border-white/[0.06] rounded-lg focus:outline-none cursor-pointer text-slate-400"
                >
                  <option value={5} className="bg-slate-900">5</option>
                  <option value={10} className="bg-slate-900">10</option>
                  <option value={20} className="bg-slate-900">20</option>
                  <option value={50} className="bg-slate-900">50</option>
                </select>
                <span>users per page</span>
              </div>

              <span className="text-slate-600">
                Showing <strong className="text-slate-400">{Math.min(limit * (page - 1) + 1, total)}</strong> to{' '}
                <strong className="text-slate-400">{Math.min(limit * page, total)}</strong> of <strong className="text-slate-400">{total}</strong> users
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="p-2 border border-white/[0.06] hover:bg-white/[0.04] rounded-xl disabled:opacity-40 transition-colors focus:outline-none"
                >
                  <NavigateBeforeIcon style={{ fontSize: 18 }} />
                </button>
                {Array.from({ length: pages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => handlePageChange(pNum)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all focus:outline-none ${
                        page === pNum
                          ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : 'border-white/[0.06] hover:bg-white/[0.04] text-slate-500'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === pages}
                  className="p-2 border border-white/[0.06] hover:bg-white/[0.04] rounded-xl disabled:opacity-40 transition-colors focus:outline-none"
                >
                  <NavigateNextIcon style={{ fontSize: 18 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Users;
