import React from 'react';
import { Helmet } from 'react-helmet-async';
import BarChartIcon from '@mui/icons-material/BarChart';

export const Analytics = () => {
  return (
    <>
      <Helmet>
        <title>Analytics Dashboard | Amazon Order Dashboard</title>
      </Helmet>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto mt-12">
        <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl">
          <BarChartIcon className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Analytics Dashboard
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Visualize real-time order statistics, revenue details, status distributions, and category breakdowns using graphs.
        </p>
      </div>
    </>
  );
};

export default Analytics;
