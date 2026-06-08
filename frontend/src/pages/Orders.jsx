import React from 'react';
import { Helmet } from 'react-helmet-async';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

export const Orders = () => {
  return (
    <>
      <Helmet>
        <title>Orders Management | Amazon Order Dashboard</title>
      </Helmet>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12">
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
          <ShoppingCartIcon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Orders Management
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          This dashboard will host full CRUD operations for Amazon orders, including search, sorting, filtering, and pagination.
        </p>
      </div>
    </>
  );
};

export default Orders;
