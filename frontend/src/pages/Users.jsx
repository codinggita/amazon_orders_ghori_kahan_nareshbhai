import React from 'react';
import { Helmet } from 'react-helmet-async';
import PeopleIcon from '@mui/icons-material/People';

export const Users = () => {
  return (
    <>
      <Helmet>
        <title>Users Management | Amazon Order Dashboard</title>
      </Helmet>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12">
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
          <PeopleIcon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Users Management Dashboard
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This dashboard will list and edit user details stored in MongoDB, support user blocking/deactivation, and roles editing. This feature is mapped for integration.
        </p>
      </div>
    </>
  );
};

export default Users;
