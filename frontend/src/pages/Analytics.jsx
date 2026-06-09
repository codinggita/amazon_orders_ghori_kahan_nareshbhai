import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import API from '../services/api';
import toast from 'react-hot-toast';

export const Analytics = () => {
  // Local state for all aggregate data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [paymentDistribution, setPaymentDistribution] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [topCities, setTopCities] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [returnRateData, setReturnRateData] = useState(null);
  const [discountUsageData, setDiscountUsageData] = useState(null);
  const [cancellationData, setCancellationData] = useState(null);

  // Chart interactivity states
  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState(null);
  const [hoveredPayment, setHoveredPayment] = useState(null);
  const [hoveredCityIndex, setHoveredCityIndex] = useState(null);

  // Fetch all analytics APIs concurrently
  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        resMonthlyRev,
        resPaymentDist,
        resTopCategories,
        resTopCities,
        resTopCustomers,
        resReturnRate,
        resDiscountUsage,
        resCancellation
      ] = await Promise.all([
        API.get('/analytics/revenue/monthly'),
        API.get('/analytics/payments/distribution'),
        API.get('/analytics/categories/top?limit=5'),
        API.get('/analytics/locations/top-cities?limit=5'),
        API.get('/analytics/customers/top?limit=5'),
        API.get('/analytics/returns/rate'),
        API.get('/analytics/discounts/usage'),
        API.get('/analytics/orders/cancelled')
      ]);

      setMonthlyRevenue(resMonthlyRev.data.data || []);
      setPaymentDistribution(resPaymentDist.data.data || []);
      setTopCategories(resTopCategories.data.data || []);
      setTopCities(resTopCities.data.data || []);
      setTopCustomers(resTopCustomers.data.data || []);
      setReturnRateData(resReturnRate.data.data || null);
      setDiscountUsageData(resDiscountUsage.data.data || null);
      setCancellationData(resCancellation.data.data || null);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err.response?.data?.message || 'Failed to load aggregation analytics data');
      toast.error('Failed to update analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  // Format currency helper
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ─── 1. Monthly Revenue Area Chart calculations ─────────────────────────────
  const areaChartData = useMemo(() => {
    if (monthlyRevenue.length === 0) return null;

    const width = 600;
    const height = 280;
    const padding = { left: 60, right: 20, top: 20, bottom: 45 };

    const revenues = monthlyRevenue.map((d) => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000);
    const minRevenue = 0; // Baseline at 0

    // Coordinate maps
    const points = monthlyRevenue.map((d, index) => {
      const x = padding.left + (index * (width - padding.left - padding.right)) / Math.max(monthlyRevenue.length - 1, 1);
      const y = height - padding.bottom - ((d.revenue - minRevenue) * (height - padding.top - padding.bottom)) / (maxRevenue - minRevenue);
      return { x, y, data: d };
    });

    // Generate SVG path for line
    let linePath = '';
    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    }

    // Generate SVG path for area fill
    let areaPath = '';
    if (points.length > 0) {
      areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
    }

    return { width, height, padding, points, linePath, areaPath, maxRevenue };
  }, [monthlyRevenue]);

  // ─── 2. Payment Distribution Doughnut calculations ──────────────────────────
  const doughnutChartData = useMemo(() => {
    if (paymentDistribution.length === 0) return null;

    const radius = 70;
    const strokeWidth = 18;
    const circumference = 2 * Math.PI * radius; // ~439.8

    // Colors mapping
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#6366f1'];

    let currentOffset = 0;
    const segments = paymentDistribution.map((item, index) => {
      const percentage = item.percentage || 0;
      const arcLength = (percentage / 100) * circumference;
      const offset = currentOffset;
      currentOffset -= arcLength;

      return {
        ...item,
        color: colors[index % colors.length],
        arcLength,
        offset,
        circumference
      };
    });

    const totalOrders = paymentDistribution.reduce((acc, cur) => acc + (cur.count || 0), 0);

    return { radius, strokeWidth, segments, totalOrders };
  }, [paymentDistribution]);

  // ─── 3. Geographic Revenue Column Chart calculations ─────────────────────────
  const columnChartData = useMemo(() => {
    if (topCities.length === 0) return null;

    const width = 500;
    const height = 280;
    const padding = { left: 65, right: 15, top: 20, bottom: 45 };

    const maxRevenue = Math.max(...topCities.map((c) => c.totalRevenue), 1000);

    const barWidth = 40;
    const columns = topCities.map((cityData, index) => {
      const x = padding.left + (index * (width - padding.left - padding.right)) / topCities.length + 15;
      const columnHeight = ((cityData.totalRevenue) * (height - padding.top - padding.bottom)) / maxRevenue;
      const y = height - padding.bottom - columnHeight;

      return {
        x,
        y,
        width: barWidth,
        height: columnHeight,
        data: cityData
      };
    });

    return { width, height, padding, columns, maxRevenue };
  }, [topCities]);

  // Handle revenue hover coordinate finding
  const handleRevenueMouseMove = (e, chart) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Find nearest point
    let nearestIdx = 0;
    let minDiff = Infinity;
    
    chart.points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = idx;
      }
    });

    setHoveredRevenueIndex(nearestIdx);
  };

  return (
    <>
      <Helmet>
        <title>Analytics & Aggregation Metrics | Amazon Order Dashboard</title>
        <meta name="description" content="Detailed analysis of monthly revenue, top categories, payment splits, and cities using MongoDB aggregates." />
      </Helmet>

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              MongoDB aggregation pipeline insights showing trends, breakdowns, and statistics.
            </p>
          </div>
          
          <button
            onClick={fetchAllAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-350 text-xs font-semibold focus:outline-none transition-all disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>

        {/* LOADING SKELETON */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl animate-pulse h-40"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl animate-pulse h-96"></div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl animate-pulse h-96"></div>
            </div>
          </div>
        ) : error ? (
          /* ERROR STATE PANEL */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl text-center space-y-4 max-w-xl mx-auto mt-12 shadow-sm">
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center">
              <WarningAmberIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Failed to load analytics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The backend returned an error: <code className="bg-slate-100 dark:bg-slate-950 p-1.5 rounded text-rose-500 text-xs font-mono">{error}</code>
            </p>
            <button
              onClick={fetchAllAnalytics}
              className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all hover:bg-amber-600"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          /* MAIN ANALYTICS GRID CONTENT */
          <div className="space-y-6">
            
            {/* KPI Progress Rings Section (Return, Cancellation, Discount Usage) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Return Rate Widget */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Return & Refund Rate</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {returnRateData?.returnRate || '0.00%'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Returned Volume: <strong className="text-slate-700 dark:text-slate-350">{returnRateData?.returnedOrders || 0}</strong>
                    <p className="mt-0.5 text-rose-500 font-semibold">Lost: {formatCurrency(returnRateData?.totalReturnedRevenue || 0)}</p>
                  </div>
                </div>
                
                {/* SVG Radial Progress Ring */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="2.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="transparent"
                      stroke="#a855f7"
                      strokeWidth="2.5"
                      strokeDasharray="100 100"
                      strokeDashoffset={100 - parseFloat(returnRateData?.returnRate || 0)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300">
                    {parseInt(returnRateData?.returnRate || 0)}%
                  </div>
                </div>
              </div>

              {/* Cancellation Rate Widget */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Cancellation Rate</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {cancellationData?.cancellationRate || '0.00%'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Cancelled Volume: <strong className="text-slate-700 dark:text-slate-350">{cancellationData?.cancelledOrders || 0}</strong>
                    <p className="mt-0.5 text-rose-500 font-semibold">Lost: {formatCurrency(cancellationData?.totalLostRevenue || 0)}</p>
                  </div>
                </div>

                {/* SVG Radial Progress Ring */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="2.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="transparent"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeDasharray="100 100"
                      strokeDashoffset={100 - parseFloat(cancellationData?.cancellationRate || 0)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300">
                    {parseInt(cancellationData?.cancellationRate || 0)}%
                  </div>
                </div>
              </div>

              {/* Discount Usage Widget */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Discount Usage Rate</span>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                    {discountUsageData?.discountUsageRate || '0.00%'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    Applied In: <strong className="text-slate-700 dark:text-slate-350">{discountUsageData?.discountedOrders || 0} orders</strong>
                    <p className="mt-0.5 text-emerald-500 font-semibold">Total Given: {formatCurrency(discountUsageData?.totalDiscountGiven || 0)}</p>
                  </div>
                </div>

                {/* SVG Radial Progress Ring */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" className="dark:stroke-slate-800" strokeWidth="2.5" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="100 100"
                      strokeDashoffset={100 - parseFloat(discountUsageData?.discountUsageRate || 0)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-700 dark:text-slate-300">
                    {parseInt(discountUsageData?.discountUsageRate || 0)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Section: Revenue Trend & Payment Doughnut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Monthly Revenue Area Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[380px]">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    <TrendingUpIcon className="text-amber-500 w-5 h-5" /> Monthly Sales & Revenue Trend
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                    Aggregation Trend
                  </span>
                </div>

                <div className="relative flex-1 mt-4">
                  {areaChartData ? (
                    <>
                      {/* SVG Canvas */}
                      <svg
                        viewBox={`0 0 ${areaChartData.width} ${areaChartData.height}`}
                        className="w-full h-full"
                        onMouseMove={(e) => handleRevenueMouseMove(e, areaChartData)}
                        onMouseLeave={() => setHoveredRevenueIndex(null)}
                      >
                        <defs>
                          {/* Gradient definition for premium glowing line area */}
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Y-Axis Gridlines */}
                        {Array.from({ length: 5 }).map((_, idx) => {
                          const y = areaChartData.padding.top + (idx * (areaChartData.height - areaChartData.padding.top - areaChartData.padding.bottom)) / 4;
                          const gridVal = areaChartData.maxRevenue - (idx * areaChartData.maxRevenue) / 4;
                          return (
                            <g key={idx} className="opacity-40">
                              <line
                                x1={areaChartData.padding.left}
                                y1={y}
                                x2={areaChartData.width - areaChartData.padding.right}
                                y2={y}
                                stroke="#cbd5e1"
                                className="dark:stroke-slate-800"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={areaChartData.padding.left - 10}
                                y={y + 4}
                                fill="#94a3b8"
                                className="text-[10px] font-semibold text-right"
                                textAnchor="end"
                              >
                                {gridVal >= 1000 ? `$${(gridVal / 1000).toFixed(1)}k` : `$${gridVal.toFixed(0)}`}
                              </text>
                            </g>
                          );
                        })}

                        {/* Area Fill */}
                        <path d={areaChartData.areaPath} fill="url(#areaGrad)" />

                        {/* Glowing Line Path */}
                        <path d={areaChartData.linePath} fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />

                        {/* X-Axis Labels */}
                        {areaChartData.points.map((p, idx) => (
                          <text
                            key={idx}
                            x={p.x}
                            y={areaChartData.height - 15}
                            fill="#94a3b8"
                            className="text-[9px] font-bold"
                            textAnchor="middle"
                          >
                            {p.data.monthLabel}
                          </text>
                        ))}

                        {/* Interactive vertical guide cursor and hover dots */}
                        {hoveredRevenueIndex !== null && areaChartData.points[hoveredRevenueIndex] && (
                          <g>
                            <line
                              x1={areaChartData.points[hoveredRevenueIndex].x}
                              y1={areaChartData.padding.top}
                              x2={areaChartData.points[hoveredRevenueIndex].x}
                              y2={areaChartData.height - areaChartData.padding.bottom}
                              stroke="#cbd5e1"
                              className="dark:stroke-slate-800"
                              strokeWidth="1.5"
                            />
                            <circle
                              cx={areaChartData.points[hoveredRevenueIndex].x}
                              cy={areaChartData.points[hoveredRevenueIndex].y}
                              r="6"
                              fill="#f59e0b"
                              stroke="#ffffff"
                              className="dark:stroke-slate-900"
                              strokeWidth="2"
                            />
                          </g>
                        )}
                      </svg>

                      {/* Tooltip Overlay */}
                      {hoveredRevenueIndex !== null && areaChartData.points[hoveredRevenueIndex] && (
                        <div className="absolute top-0 right-0 bg-slate-950/90 text-white border border-slate-800 px-3 py-2 rounded-2xl shadow-xl space-y-0.5 z-10 pointer-events-none text-xs backdrop-blur-md">
                          <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                            {areaChartData.points[hoveredRevenueIndex].data.monthLabel} {areaChartData.points[hoveredRevenueIndex].data.year}
                          </p>
                          <p className="text-sm font-black text-amber-500">
                            {formatCurrency(areaChartData.points[hoveredRevenueIndex].data.revenue)}
                          </p>
                          <p className="text-[10px] text-slate-350">
                            Orders count: <strong>{areaChartData.points[hoveredRevenueIndex].data.orderCount}</strong>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No monthly revenue trends data.</div>
                  )}
                </div>
              </div>

              {/* Payment Methods Distribution Doughnut */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[380px]">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    <CreditCardIcon className="text-amber-500 w-5 h-5" /> Payment Distribution
                  </h4>
                </div>

                {doughnutChartData ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-4 space-y-4">
                    
                    {/* SVG Doughnut ring */}
                    <div className="relative w-40 h-40">
                      <svg viewBox="0 0 200 200" className="w-full h-full">
                        {doughnutChartData.segments.map((seg) => {
                          const isHovered = hoveredPayment === seg.paymentMethod;
                          return (
                            <circle
                              key={seg.paymentMethod}
                              cx="100"
                              cy="100"
                              r={doughnutChartData.radius}
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth={isHovered ? doughnutChartData.strokeWidth + 3 : doughnutChartData.strokeWidth}
                              strokeDasharray={`${seg.arcLength} ${seg.circumference}`}
                              strokeDashoffset={seg.offset}
                              transform="rotate(-90 100 100)"
                              className="transition-all duration-200 cursor-pointer origin-center"
                              onMouseEnter={() => setHoveredPayment(seg.paymentMethod)}
                              onMouseLeave={() => setHoveredPayment(null)}
                            />
                          );
                        })}
                      </svg>
                      
                      {/* Central total label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          {hoveredPayment ? hoveredPayment : 'Total Orders'}
                        </span>
                        <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                          {hoveredPayment
                            ? doughnutChartData.segments.find((s) => s.paymentMethod === hoveredPayment)?.count
                            : doughnutChartData.totalOrders}
                        </span>
                        <span className="text-[10px] text-amber-500 font-extrabold mt-0.5">
                          {hoveredPayment
                            ? `${doughnutChartData.segments.find((s) => s.paymentMethod === hoveredPayment)?.percentage}%`
                            : '100%'}
                        </span>
                      </div>
                    </div>

                    {/* Legends */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-xs mt-2">
                      {doughnutChartData.segments.map((seg) => (
                        <div
                          key={seg.paymentMethod}
                          className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors cursor-pointer ${
                            hoveredPayment === seg.paymentMethod ? 'bg-slate-100 dark:bg-slate-800' : ''
                          }`}
                          onMouseEnter={() => setHoveredPayment(seg.paymentMethod)}
                          onMouseLeave={() => setHoveredPayment(null)}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }}></span>
                          <span className="truncate text-slate-650 dark:text-slate-350" title={seg.paymentMethod}>
                            {seg.paymentMethod}
                          </span>
                        </div>
                      ))}
                    </div>

                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">No payment methods distribution data.</div>
                )}
              </div>

            </div>

            {/* Bottom Grid: Top Categories & Cities performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Performance (Horizontal progress bars) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    <ShoppingBagIcon className="text-amber-500 w-5 h-5" /> Top Categories by Revenue
                  </h4>
                </div>

                <div className="space-y-5">
                  {topCategories.length > 0 ? (
                    (() => {
                      const maxCategoryRev = Math.max(...topCategories.map((c) => c.totalRevenue), 1);
                      return topCategories.map((cat, index) => {
                        const widthPct = (cat.totalRevenue / maxCategoryRev) * 100;
                        const colors = ['bg-amber-500', 'bg-sky-500', 'bg-emerald-500', 'bg-purple-500', 'bg-indigo-500'];
                        const colorClass = colors[index % colors.length];

                        return (
                          <div key={cat.category} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{cat.category}</span>
                              <div className="space-x-2">
                                <span className="text-slate-450">{cat.orderCount} orders</span>
                                <span className="text-slate-800 dark:text-slate-100 font-black">{formatCurrency(cat.totalRevenue)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`${colorClass} h-full rounded-full transition-all duration-1000 ease-out`}
                                style={{ width: `${widthPct}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <p className="text-slate-400 text-center py-8">No category analytics.</p>
                  )}
                </div>
              </div>

              {/* Top Cities (Vertical Column Chart) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between min-h-[350px]">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                    <LocationOnIcon className="text-amber-500 w-5 h-5" /> Top Cities by Revenue
                  </h4>
                </div>

                <div className="relative flex-1 mt-4">
                  {columnChartData ? (
                    <>
                      <svg viewBox={`0 0 ${columnChartData.width} ${columnChartData.height}`} className="w-full h-full">
                        {/* Horizontal guide lines */}
                        {Array.from({ length: 4 }).map((_, idx) => {
                          const y = columnChartData.padding.top + (idx * (columnChartData.height - columnChartData.padding.top - columnChartData.padding.bottom)) / 3;
                          const gridVal = columnChartData.maxRevenue - (idx * columnChartData.maxRevenue) / 3;
                          return (
                            <g key={idx} className="opacity-45">
                              <line
                                x1={columnChartData.padding.left}
                                y1={y}
                                x2={columnChartData.width - columnChartData.padding.right}
                                y2={y}
                                stroke="#cbd5e1"
                                className="dark:stroke-slate-800"
                                strokeDasharray="3 3"
                              />
                              <text
                                x={columnChartData.padding.left - 10}
                                y={y + 4}
                                fill="#94a3b8"
                                className="text-[9px] font-bold"
                                textAnchor="end"
                              >
                                {gridVal >= 1000 ? `$${(gridVal / 1000).toFixed(0)}k` : `$${gridVal.toFixed(0)}`}
                              </text>
                            </g>
                          );
                        })}

                        {/* Rendering Columns */}
                        {columnChartData.columns.map((col, idx) => {
                          const isHovered = hoveredCityIndex === idx;
                          return (
                            <g
                              key={idx}
                              className="cursor-pointer"
                              onMouseEnter={() => setHoveredCityIndex(idx)}
                              onMouseLeave={() => setHoveredCityIndex(null)}
                            >
                              {/* Animated Bar */}
                              <rect
                                x={col.x}
                                y={col.y}
                                width={col.width}
                                height={col.height}
                                fill={isHovered ? '#f59e0b' : '#3b82f6'}
                                rx="5"
                                ry="5"
                                className="transition-all duration-300"
                              />
                              
                              {/* City Text Label */}
                              <text
                                x={col.x + col.width / 2}
                                y={columnChartData.height - 15}
                                fill="#94a3b8"
                                className="text-[9px] font-bold"
                                textAnchor="middle"
                              >
                                {col.data.city}
                              </text>
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip Overlay for Column Chart */}
                      {hoveredCityIndex !== null && columnChartData.columns[hoveredCityIndex] && (
                        <div className="absolute top-0 right-0 bg-slate-950/90 text-white border border-slate-800 px-3 py-2 rounded-2xl shadow-xl z-10 pointer-events-none text-xs backdrop-blur-md">
                          <p className="font-bold text-[10px] text-slate-450 uppercase tracking-wider">
                            {columnChartData.columns[hoveredCityIndex].data.city}, {columnChartData.columns[hoveredCityIndex].data.state}
                          </p>
                          <p className="text-sm font-black text-amber-500">
                            {formatCurrency(columnChartData.columns[hoveredCityIndex].data.totalRevenue)}
                          </p>
                          <p className="text-[10px] text-slate-350">
                            Orders volume: <strong>{columnChartData.columns[hoveredCityIndex].data.orderCount}</strong>
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">No cities revenue data.</div>
                  )}
                </div>
              </div>

            </div>

            {/* Top Spenders Customers list */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2">
                <h4 className="text-sm font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                  <PeopleIcon className="text-amber-500 w-5 h-5" /> Top Spenders & Customer Lifetime Value
                </h4>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-850 text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-3">Customer ID</th>
                      <th className="p-3">Customer Name</th>
                      <th className="p-3 text-center">Orders Count</th>
                      <th className="p-3">Avg Order Value</th>
                      <th className="p-3">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {topCustomers.length > 0 ? (
                      topCustomers.map((cust) => (
                        <tr key={cust.customerID} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="p-3 font-mono text-slate-500 font-bold">{cust.customerID}</td>
                          <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{cust.customerName}</td>
                          <td className="p-3 text-center text-slate-700 dark:text-slate-300 font-semibold">{cust.orderCount}</td>
                          <td className="p-3 text-slate-600 dark:text-slate-400">{formatCurrency(cust.avgOrderValue)}</td>
                          <td className="p-3 font-black text-emerald-500">{formatCurrency(cust.totalSpent)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-6 text-center text-slate-400">No spenders dataset.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
};

export default Analytics;
