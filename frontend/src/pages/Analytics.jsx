import { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

import API from '../services/api';
import toast from 'react-hot-toast';

/* ── Animated SVG Ring ────────────────────────────────────────── */
const AnimatedRing = ({ rate, color, size = 80 }) => {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const pct = parseFloat(rate) || 0;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
        <circle
          cx="18" cy="18" r={r}
          fill="transparent"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(.25,.8,.25,1)',
            filter: `drop-shadow(0 0 4px ${color}80)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-black" style={{ color }}>{Math.round(pct)}%</span>
      </div>
    </div>
  );
};

export const Analytics = () => {
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

  const [hoveredRevenueIndex, setHoveredRevenueIndex] = useState(null);
  const [hoveredPayment, setHoveredPayment] = useState(null);
  const [hoveredCityIndex, setHoveredCityIndex] = useState(null);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [
        resMonthlyRev, resPaymentDist, resTopCategories,
        resTopCities, resTopCustomers, resReturnRate,
        resDiscountUsage, resCancellation
      ] = await Promise.all([
        API.get('/analytics/revenue/monthly'),
        API.get('/analytics/payments/distribution'),
        API.get('/analytics/categories/top?limit=5'),
        API.get('/analytics/locations/top-cities?limit=5'),
        API.get('/analytics/customers/top?limit=5'),
        API.get('/analytics/returns/rate'),
        API.get('/analytics/discounts/usage'),
        API.get('/analytics/orders/cancelled'),
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
    const timer = setTimeout(() => { fetchAllAnalytics(); }, 0);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ── Area Chart ────────────────────────────────────────────────
  const areaChartData = useMemo(() => {
    if (monthlyRevenue.length === 0) return null;
    const width = 600, height = 280;
    const padding = { left: 60, right: 20, top: 20, bottom: 45 };
    const revenues = monthlyRevenue.map((d) => d.revenue);
    const maxRevenue = Math.max(...revenues, 1000);

    const points = monthlyRevenue.map((d, index) => {
      const x = padding.left + (index * (width - padding.left - padding.right)) / Math.max(monthlyRevenue.length - 1, 1);
      const y = height - padding.bottom - ((d.revenue) * (height - padding.top - padding.bottom)) / maxRevenue;
      return { x, y, data: d };
    });

    // Bezier smooth path
    const smoothLinePath = points.length > 1
      ? points.reduce((path, p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cpx = (prev.x + p.x) / 2;
          return `${path} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
        }, '')
      : `M ${points[0]?.x} ${points[0]?.y}`;

    const areaPath = points.length > 0
      ? `${smoothLinePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
      : '';

    return { width, height, padding, points, linePath: smoothLinePath, areaPath, maxRevenue };
  }, [monthlyRevenue]);

  // ── Doughnut Chart ─────────────────────────────────────────────
  const doughnutChartData = useMemo(() => {
    if (paymentDistribution.length === 0) return null;
    const radius = 70, strokeWidth = 18;
    const circumference = 2 * Math.PI * radius;
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899', '#6366f1'];
    let currentOffset = 0;
    const segments = paymentDistribution.map((item, index) => {
      const percentage = item.percentage || 0;
      const arcLength = (percentage / 100) * circumference;
      const offset = currentOffset;
      currentOffset -= arcLength;
      return { ...item, color: colors[index % colors.length], arcLength, offset, circumference };
    });
    const totalOrders = paymentDistribution.reduce((acc, cur) => acc + (cur.count || 0), 0);
    return { radius, strokeWidth, segments, totalOrders };
  }, [paymentDistribution]);

  // ── Bar Chart ──────────────────────────────────────────────────
  const columnChartData = useMemo(() => {
    if (topCities.length === 0) return null;
    const width = 500, height = 280;
    const padding = { left: 65, right: 15, top: 20, bottom: 45 };
    const maxRevenue = Math.max(...topCities.map((c) => c.totalRevenue), 1000);
    const barWidth = 40;
    const columns = topCities.map((cityData, index) => {
      const x = padding.left + (index * (width - padding.left - padding.right)) / topCities.length + 15;
      const columnHeight = (cityData.totalRevenue * (height - padding.top - padding.bottom)) / maxRevenue;
      const y = height - padding.bottom - columnHeight;
      return { x, y, width: barWidth, height: columnHeight, data: cityData };
    });
    return { width, height, padding, columns, maxRevenue };
  }, [topCities]);

  const handleRevenueMouseMove = (e, chart) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let nearestIdx = 0, minDiff = Infinity;
    chart.points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) { minDiff = diff; nearestIdx = idx; }
    });
    setHoveredRevenueIndex(nearestIdx);
  };

  return (
    <>
      <Helmet>
        <title>Analytics & Store Metrics | Amazon Order Dashboard</title>
        <meta name="description" content="Detailed analysis of monthly revenue trends, top category splits, payment breakdowns, and top cities using MongoDB aggregation pipelines." />
      </Helmet>

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">

        {/* Header */}
        <div className="flex justify-between items-center animate-slide-up">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">
              Analytics Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              MongoDB aggregation pipeline insights — trends, breakdowns, and statistics.
            </p>
          </div>
          <button
            onClick={fetchAllAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshIcon className={loading ? 'animate-spin' : ''} style={{ fontSize: 16 }} />
            Refresh Data
          </button>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 skeleton h-96 rounded-2xl" />
              <div className="skeleton h-96 rounded-2xl" />
            </div>
          </div>
        ) : error ? (
          /* Error State */
          <div className="premium-card p-10 text-center space-y-4 max-w-md mx-auto mt-12">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
              <WarningAmberIcon style={{ fontSize: 28 }} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Failed to load analytics</h3>
            <p className="text-xs text-slate-500">
              Backend error: <code className="bg-black/20 px-2 py-1 rounded-lg text-rose-400 font-mono">{error}</code>
            </p>
            <button onClick={fetchAllAnalytics} className="btn-amber px-6 py-2.5 rounded-xl text-sm">
              Retry Connection
            </button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* KPI Ring Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  label: 'Return & Refund Rate',
                  rate: returnRateData?.returnRate,
                  color: '#a855f7',
                  sub1: `Volume: ${returnRateData?.returnedOrders || 0}`,
                  sub2: `Lost: ${formatCurrency(returnRateData?.totalReturnedRevenue || 0)}`,
                  sub2color: 'text-rose-400',
                },
                {
                  label: 'Cancellation Rate',
                  rate: cancellationData?.cancellationRate,
                  color: '#f43f5e',
                  sub1: `Cancelled: ${cancellationData?.cancelledOrders || 0}`,
                  sub2: `Lost: ${formatCurrency(cancellationData?.totalLostRevenue || 0)}`,
                  sub2color: 'text-rose-400',
                },
                {
                  label: 'Discount Usage Rate',
                  rate: discountUsageData?.discountUsageRate,
                  color: '#10b981',
                  sub1: `Applied in: ${discountUsageData?.discountedOrders || 0} orders`,
                  sub2: `Total Given: ${formatCurrency(discountUsageData?.totalDiscountGiven || 0)}`,
                  sub2color: 'text-emerald-400',
                },
              ].map((kpi, i) => (
                <div key={i} className={`premium-card animate-slide-up`} style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{kpi.label}</span>
                      <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                        {kpi.rate || '0.00%'}
                      </h3>
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <p>{kpi.sub1}</p>
                        <p className={`font-semibold ${kpi.sub2color}`}>{kpi.sub2}</p>
                      </div>
                    </div>
                    <AnimatedRing rate={parseFloat(kpi.rate) || 0} color={kpi.color} size={76} />
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Trend + Doughnut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* Area Chart */}
              <div className="lg:col-span-2 premium-card animate-slide-up">
                <div className="p-6 flex flex-col min-h-[380px]">
                  <div className="flex justify-between items-center mb-5">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <TrendingUpIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                      Monthly Revenue Trend
                    </h4>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-black/20 border border-white/[0.06] px-2.5 py-1 rounded-full">
                      Aggregation Trend
                    </span>
                  </div>

                  <div className="relative flex-1">
                    {areaChartData ? (
                      <>
                        <svg
                          viewBox={`0 0 ${areaChartData.width} ${areaChartData.height}`}
                          className="w-full h-full"
                          onMouseMove={(e) => handleRevenueMouseMove(e, areaChartData)}
                          onMouseLeave={() => setHoveredRevenueIndex(null)}
                        >
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                            </linearGradient>
                            <filter id="glow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                          </defs>

                          {/* Gridlines */}
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const y = areaChartData.padding.top + (idx * (areaChartData.height - areaChartData.padding.top - areaChartData.padding.bottom)) / 4;
                            const gridVal = areaChartData.maxRevenue - (idx * areaChartData.maxRevenue) / 4;
                            return (
                              <g key={idx} opacity="0.3">
                                <line x1={areaChartData.padding.left} y1={y} x2={areaChartData.width - areaChartData.padding.right} y2={y} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 4" />
                                <text x={areaChartData.padding.left - 8} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end" fontWeight="600">
                                  {gridVal >= 1000 ? `$${(gridVal / 1000).toFixed(1)}k` : `$${gridVal.toFixed(0)}`}
                                </text>
                              </g>
                            );
                          })}

                          {/* Area fill */}
                          <path d={areaChartData.areaPath} fill="url(#areaGrad)" />

                          {/* Line stroke */}
                          <path
                            d={areaChartData.linePath}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                          />

                          {/* X-axis labels */}
                          {areaChartData.points.map((p, idx) => (
                            <text key={idx} x={p.x} y={areaChartData.height - 12} fill="#64748b" fontSize="9" textAnchor="middle" fontWeight="700">
                              {p.data.monthLabel}
                            </text>
                          ))}

                          {/* Hover guide */}
                          {hoveredRevenueIndex !== null && areaChartData.points[hoveredRevenueIndex] && (
                            <g>
                              <line
                                x1={areaChartData.points[hoveredRevenueIndex].x}
                                y1={areaChartData.padding.top}
                                x2={areaChartData.points[hoveredRevenueIndex].x}
                                y2={areaChartData.height - areaChartData.padding.bottom}
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth="1.5"
                              />
                              <circle
                                cx={areaChartData.points[hoveredRevenueIndex].x}
                                cy={areaChartData.points[hoveredRevenueIndex].y}
                                r="5"
                                fill="#f59e0b"
                                stroke="#090d1a"
                                strokeWidth="2"
                                filter="url(#glow)"
                              />
                            </g>
                          )}
                        </svg>

                        {/* Tooltip */}
                        {hoveredRevenueIndex !== null && areaChartData.points[hoveredRevenueIndex] && (
                          <div className="absolute top-0 right-0 modal-content px-3.5 py-3 rounded-xl shadow-xl z-10 pointer-events-none text-xs animate-fade-in">
                            <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                              {areaChartData.points[hoveredRevenueIndex].data.monthLabel}{' '}
                              {areaChartData.points[hoveredRevenueIndex].data.year}
                            </p>
                            <p className="text-base font-black text-amber-400 tabular-nums">
                              {formatCurrency(areaChartData.points[hoveredRevenueIndex].data.revenue)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Orders: <strong className="text-slate-300">{areaChartData.points[hoveredRevenueIndex].data.orderCount}</strong>
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600">No monthly revenue data.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Doughnut Chart */}
              <div className="premium-card animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="p-6 flex flex-col min-h-[380px]">
                  <div className="flex items-center gap-2 mb-5">
                    <CreditCardIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Payment Distribution</h4>
                  </div>

                  {doughnutChartData ? (
                    <div className="flex flex-col items-center justify-center flex-1 gap-5">
                      <div className="relative w-44 h-44">
                        <svg viewBox="0 0 200 200" className="w-full h-full">
                          {doughnutChartData.segments.map((seg) => {
                            const isHovered = hoveredPayment === seg.paymentMethod;
                            return (
                              <circle
                                key={seg.paymentMethod}
                                cx="100" cy="100"
                                r={doughnutChartData.radius}
                                fill="transparent"
                                stroke={seg.color}
                                strokeWidth={isHovered ? doughnutChartData.strokeWidth + 4 : doughnutChartData.strokeWidth}
                                strokeDasharray={`${seg.arcLength} ${seg.circumference}`}
                                strokeDashoffset={seg.offset}
                                transform="rotate(-90 100 100)"
                                className="transition-all duration-200 cursor-pointer"
                                style={{ filter: isHovered ? `drop-shadow(0 0 6px ${seg.color}80)` : 'none' }}
                                onMouseEnter={() => setHoveredPayment(seg.paymentMethod)}
                                onMouseLeave={() => setHoveredPayment(null)}
                              />
                            );
                          })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {hoveredPayment || 'Total'}
                          </span>
                          <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                            {hoveredPayment
                              ? doughnutChartData.segments.find((s) => s.paymentMethod === hoveredPayment)?.count
                              : doughnutChartData.totalOrders}
                          </span>
                          <span className="text-xs text-amber-400 font-extrabold">
                            {hoveredPayment
                              ? `${doughnutChartData.segments.find((s) => s.paymentMethod === hoveredPayment)?.percentage}%`
                              : '100%'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 w-full">
                        {doughnutChartData.segments.map((seg) => (
                          <div
                            key={seg.paymentMethod}
                            className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${
                              hoveredPayment === seg.paymentMethod ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                            }`}
                            onMouseEnter={() => setHoveredPayment(seg.paymentMethod)}
                            onMouseLeave={() => setHoveredPayment(null)}
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}80` }} />
                            <span className="text-[11px] truncate text-slate-500" title={seg.paymentMethod}>{seg.paymentMethod}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-600">No payment data.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Categories + Cities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Top Categories */}
              <div className="premium-card animate-slide-up">
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-2">
                    <ShoppingBagIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Top Categories by Revenue</h4>
                  </div>

                  <div className="space-y-4">
                    {topCategories.length > 0 ? (() => {
                      const maxCategoryRev = Math.max(...topCategories.map((c) => c.totalRevenue), 1);
                      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#6366f1'];
                      return topCategories.map((cat, index) => {
                        const widthPct = (cat.totalRevenue / maxCategoryRev) * 100;
                        return (
                          <div key={cat.category} className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-700 dark:text-slate-300 font-bold">{cat.category}</span>
                              <div className="flex gap-3">
                                <span className="text-slate-500">{cat.orderCount} orders</span>
                                <span className="text-slate-800 dark:text-slate-100 font-black tabular-nums">{formatCurrency(cat.totalRevenue)}</span>
                              </div>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                  width: `${widthPct}%`,
                                  backgroundColor: colors[index % colors.length],
                                  boxShadow: `0 0 8px ${colors[index % colors.length]}60`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })() : (
                      <p className="text-slate-600 text-center py-8">No category analytics.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Top Cities Bar Chart */}
              <div className="premium-card animate-slide-up" style={{ animationDelay: '80ms' }}>
                <div className="p-6 flex flex-col min-h-[350px]">
                  <div className="flex items-center gap-2 mb-5">
                    <LocationOnIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Top Cities by Revenue</h4>
                  </div>

                  <div className="relative flex-1">
                    {columnChartData ? (
                      <>
                        <svg viewBox={`0 0 ${columnChartData.width} ${columnChartData.height}`} className="w-full h-full">
                          <defs>
                            <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#f97316" />
                            </linearGradient>
                            <linearGradient id="barGradHover" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#fbbf24" />
                              <stop offset="100%" stopColor="#fb923c" />
                            </linearGradient>
                          </defs>

                          {Array.from({ length: 4 }).map((_, idx) => {
                            const y = columnChartData.padding.top + (idx * (columnChartData.height - columnChartData.padding.top - columnChartData.padding.bottom)) / 3;
                            const gridVal = columnChartData.maxRevenue - (idx * columnChartData.maxRevenue) / 3;
                            return (
                              <g key={idx} opacity="0.3">
                                <line x1={columnChartData.padding.left} y1={y} x2={columnChartData.width - columnChartData.padding.right} y2={y} stroke="rgba(255,255,255,0.15)" strokeDasharray="3 4" />
                                <text x={columnChartData.padding.left - 8} y={y + 4} fill="#64748b" fontSize="9" textAnchor="end" fontWeight="600">
                                  {gridVal >= 1000 ? `$${(gridVal / 1000).toFixed(0)}k` : `$${gridVal.toFixed(0)}`}
                                </text>
                              </g>
                            );
                          })}

                          {columnChartData.columns.map((col, idx) => {
                            const isHovered = hoveredCityIndex === idx;
                            return (
                              <g key={idx} className="cursor-pointer" onMouseEnter={() => setHoveredCityIndex(idx)} onMouseLeave={() => setHoveredCityIndex(null)}>
                                <rect
                                  x={col.x} y={col.y}
                                  width={col.width} height={col.height}
                                  fill={isHovered ? 'url(#barGradHover)' : 'url(#barGrad)'}
                                  rx="5" ry="5"
                                  className="transition-all duration-200"
                                  style={{ filter: isHovered ? 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' : 'none' }}
                                  opacity={isHovered ? 1 : 0.7}
                                />
                                <text x={col.x + col.width / 2} y={columnChartData.height - 12} fill="#64748b" fontSize="9" textAnchor="middle" fontWeight="700">
                                  {col.data.city}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        {hoveredCityIndex !== null && columnChartData.columns[hoveredCityIndex] && (
                          <div className="absolute top-0 right-0 modal-content px-3.5 py-3 rounded-xl shadow-xl z-10 pointer-events-none text-xs animate-fade-in">
                            <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">
                              {columnChartData.columns[hoveredCityIndex].data.city}, {columnChartData.columns[hoveredCityIndex].data.state}
                            </p>
                            <p className="text-base font-black text-amber-400 tabular-nums">
                              {formatCurrency(columnChartData.columns[hoveredCityIndex].data.totalRevenue)}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Orders: <strong className="text-slate-300">{columnChartData.columns[hoveredCityIndex].data.orderCount}</strong>
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600">No city revenue data.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Spenders Table */}
            <div className="premium-card animate-slide-up">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                  <PeopleIcon style={{ fontSize: 18, color: '#f59e0b' }} />
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Top Spenders & Customer Lifetime Value
                  </h4>
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/[0.05]">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/[0.05] text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-black/20">
                        <th className="p-3 w-8">#</th>
                        <th className="p-3">Customer ID</th>
                        <th className="p-3">Customer Name</th>
                        <th className="p-3 text-center">Orders</th>
                        <th className="p-3">Avg Order</th>
                        <th className="p-3">Total Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {topCustomers.length > 0 ? (
                        topCustomers.map((cust, i) => (
                          <tr key={cust.customerID} className="table-row-hover">
                            <td className="p-3">
                              {i === 0 ? (
                                <EmojiEventsIcon style={{ fontSize: 16, color: '#f59e0b' }} />
                              ) : (
                                <span className="text-slate-600 font-bold">{i + 1}</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-500 font-bold text-[11px]">{cust.customerID}</td>
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{cust.customerName}</td>
                            <td className="p-3 text-center text-slate-400 font-semibold tabular-nums">{cust.orderCount}</td>
                            <td className="p-3 text-slate-500 tabular-nums">{formatCurrency(cust.avgOrderValue)}</td>
                            <td className="p-3 font-black text-emerald-400 tabular-nums" style={{ textShadow: '0 0 12px rgba(16,185,129,0.3)' }}>
                              {formatCurrency(cust.totalSpent)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-600">No spenders dataset.</td>
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

export default Analytics;
