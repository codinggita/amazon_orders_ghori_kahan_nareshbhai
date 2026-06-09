import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';

// MUI Components & Icons
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import GroupIcon from '@mui/icons-material/Group';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import CopyAllIcon from '@mui/icons-material/CopyAll';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import {
  fetchOrders,
  fetchDashboardStats,
  createOrder,
  updateOrder,
  deleteOrder,
  executeBulkAction,
  setPage,
  setLimit,
  setSearchQuery,
  setSortKey,
  setFilter,
  clearFilters
} from '../features/dataSlice';

import API from '../services/api';

// Yup Schema for Order Form Validation
const OrderSchema = Yup.object().shape({
  OrderID: Yup.string()
    .required('Order ID is required')
    .min(3, 'Minimum 3 characters')
    .matches(/^[A-Za-z0-9-]+$/, 'Only alphanumeric characters and hyphens allowed'),
  CustomerName: Yup.string().required('Customer Name is required'),
  CustomerID: Yup.string().required('Customer ID is required'),
  ProductName: Yup.string().required('Product Name is required'),
  ProductID: Yup.string().required('Product ID is required'),
  Category: Yup.string().required('Category is required'),
  Brand: Yup.string().required('Brand is required'),
  Quantity: Yup.number()
    .typeError('Quantity must be a number')
    .integer('Must be an integer')
    .min(1, 'Minimum 1 item')
    .required('Quantity is required'),
  UnitPrice: Yup.number()
    .typeError('Price must be a number')
    .min(0.01, 'Price must be greater than 0')
    .required('Unit Price is required'),
  Discount: Yup.number()
    .typeError('Discount must be a number')
    .min(0, 'Discount cannot be negative')
    .default(0),
  Tax: Yup.number()
    .typeError('Tax must be a number')
    .min(0, 'Tax cannot be negative')
    .default(0),
  ShippingCost: Yup.number()
    .typeError('Shipping Cost must be a number')
    .min(0, 'Shipping Cost cannot be negative')
    .default(0),
  PaymentMethod: Yup.string().required('Payment Method is required'),
  OrderStatus: Yup.string().required('Order Status is required'),
  City: Yup.string().required('City is required'),
  State: Yup.string().required('State is required'),
  Country: Yup.string().required('Country is required'),
  SellerID: Yup.string().required('Seller ID is required'),
});

export const Orders = () => {
  const dispatch = useDispatch();
  const {
    orders,
    total,
    page,
    pages,
    limit,
    isLoading,
    stats,
    searchQuery,
    sortKey,
    filterType,
    filterValue,
    bulkLoading
  } = useSelector((state) => state.data);

  // Component local states
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [activeModal, setActiveModal] = useState(null); // 'create' | 'edit' | 'view' | 'delete' | 'bulk_status' | 'invoice'
  const [currentOrder, setCurrentOrder] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [bulkStatusToUpdate, setBulkStatusToUpdate] = useState('Shipped');

  // Load orders and stats on load
  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchDashboardStats());
  }, [dispatch, page, limit, sortKey, filterType, filterValue]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput !== searchQuery) {
        dispatch(setSearchQuery(searchInput));
        dispatch(fetchOrders());
      }
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [searchInput, dispatch, searchQuery]);

  // Update local search input if global search query is cleared
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Handle pagination changes
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pages) {
      dispatch(setPage(newPage));
    }
  };

  const handleLimitChange = (e) => {
    dispatch(setLimit(Number(e.target.value)));
  };

  // Sort cycles: '' -> 'key' -> '-key' -> ''
  const handleSortToggle = (field) => {
    let nextSort = '';
    if (sortKey === field) {
      nextSort = `-${field}`;
    } else if (sortKey === `-${field}`) {
      nextSort = '';
    } else {
      nextSort = field;
    }
    dispatch(setSortKey(nextSort));
  };

  // Filter handlers
  const handleFilterChange = (type, value) => {
    if (!value) {
      dispatch(clearFilters());
    } else {
      dispatch(setFilter({ type, value }));
    }
    dispatch(fetchOrders());
  };

  const handleClearAll = () => {
    setSearchInput('');
    dispatch(clearFilters());
    dispatch(fetchOrders());
    setSelectedOrders([]);
  };

  // Checkbox row selectors
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrders(orders.map((o) => o._id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedOrders((prev) => [...prev, id]);
    } else {
      setSelectedOrders((prev) => prev.filter((item) => item !== id));
    }
  };

  // CRUD & Specialized Operations
  const handleCreateSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await dispatch(createOrder(values)).unwrap();
      toast.success('Order created successfully!');
      setActiveModal(null);
      resetForm();
    } catch (err) {
      toast.error(err || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (values, { setSubmitting }) => {
    try {
      await dispatch(updateOrder({ orderId: currentOrder._id || currentOrder.OrderID, orderData: values })).unwrap();
      toast.success('Order updated successfully!');
      setActiveModal(null);
    } catch (err) {
      toast.error(err || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const orderIdToDelete = currentOrder._id || currentOrder.OrderID;
      await dispatch(deleteOrder(orderIdToDelete)).unwrap();
      toast.success('Order deleted successfully!');
      setSelectedOrders((prev) => prev.filter((id) => id !== currentOrder._id));
      setActiveModal(null);
    } catch (err) {
      toast.error(err || 'Failed to delete order');
    }
  };

  // Specialized APIs
  const handleCancelOrder = async (orderId) => {
    try {
      const loadingToast = toast.loading('Cancelling order...');
      const response = await API.post(`/orders/${orderId}/cancel`);
      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success('Order cancelled successfully!');
        dispatch(fetchOrders());
        dispatch(fetchDashboardStats());
        if (currentOrder) {
          setCurrentOrder(response.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleDuplicateOrder = async (orderId) => {
    try {
      const loadingToast = toast.loading('Duplicating order...');
      const response = await API.post(`/orders/${orderId}/duplicate`);
      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success('Order duplicated successfully!');
        dispatch(fetchOrders());
        dispatch(fetchDashboardStats());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate order');
    }
  };

  const handleArchiveOrder = async (orderId, shouldArchive) => {
    try {
      const actionEndpoint = shouldArchive ? 'archive' : 'restore';
      const loadingToast = toast.loading(`${shouldArchive ? 'Archiving' : 'Restoring'} order...`);
      const response = await API.patch(`/orders/${orderId}/${actionEndpoint}`);
      toast.dismiss(loadingToast);
      if (response.data.success) {
        toast.success(`Order ${shouldArchive ? 'archived' : 'restored'} successfully!`);
        dispatch(fetchOrders());
        dispatch(fetchDashboardStats());
        if (currentOrder) {
          setCurrentOrder(response.data.data);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleFetchInvoice = async (orderId) => {
    try {
      setInvoiceLoading(true);
      setActiveModal('invoice');
      const response = await API.get(`/orders/${orderId}/invoice`);
      if (response.data.success) {
        setInvoiceData(response.data.data);
      }
    } catch (err) {
      toast.error('Failed to load invoice');
      setActiveModal(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Bulk operation executor
  const handleBulkActionExecute = async (action) => {
    setActionDropdownOpen(false);
    if (selectedOrders.length === 0) return;

    const actionText = {
      delete: 'delete selected',
      archive: 'archive selected',
      restore: 'restore selected',
      status: `update selected to ${bulkStatusToUpdate}`
    }[action];

    const confirmAction = window.confirm(`Are you sure you want to bulk ${actionText} (${selectedOrders.length} orders)?`);
    if (!confirmAction) return;

    try {
      let body = {};
      if (action === 'delete') {
        body = { orderIds: selectedOrders };
      } else if (action === 'status') {
        body = { orderIds: selectedOrders, status: bulkStatusToUpdate };
      } else {
        body = { orderIds: selectedOrders };
      }

      await dispatch(executeBulkAction({ action, body })).unwrap();
      toast.success('Bulk action executed successfully!');
      setSelectedOrders([]);
    } catch (err) {
      toast.error(err || 'Failed to execute bulk action');
    }
  };

  // Formatting helpers
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusClass = (status) => {
    const clean = (status || '').toLowerCase().trim();
    switch (clean) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
      case 'shipped':
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/50 dark:border-sky-900/30';
      case 'pending':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
      case 'refunded':
      case 'returned':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/50 dark:border-purple-900/30';
      case 'archived':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/30';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400';
    }
  };

  return (
    <>
      <Helmet>
        <title>Amazon Orders Listing & CRUD | Admin Dashboard</title>
        <meta name="description" content="Manage customer orders, perform pagination, search, sort, filters, and standard MongoDB CRUD." />
      </Helmet>

      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
              Orders Database
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Perform high-level aggregate listings, custom filters, pagination, and transactional CRUD.
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentOrder({
                OrderID: `AMZ-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`,
                CustomerName: '',
                CustomerID: `CUST-${Math.floor(10000 + Math.random() * 90000)}`,
                ProductName: '',
                ProductID: `PROD-${Math.floor(10000 + Math.random() * 90000)}`,
                Category: 'Electronics',
                Brand: '',
                Quantity: 1,
                UnitPrice: '',
                Discount: 0,
                Tax: 0,
                ShippingCost: 0,
                TotalAmount: 0,
                PaymentMethod: 'Credit Card',
                OrderStatus: 'Pending',
                City: '',
                State: '',
                Country: 'United States',
                SellerID: `SELL-${Math.floor(1000 + Math.random() * 9000)}`,
              });
              setActiveModal('create');
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all focus:outline-none"
          >
            <AddIcon className="w-4 h-4" /> Add Order
          </button>
        </div>

        {/* KPI / Dashboard Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
              <ShoppingCartIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {stats.metrics?.totalOrders || 0}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl shrink-0">
              <AttachMoneyIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {formatCurrency(stats.metrics?.totalRevenue || 0)}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl shrink-0">
              <ShoppingBagIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Average Order</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {formatCurrency(stats.metrics?.avgOrderValue || 0)}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-4 bg-sky-500/10 text-sky-500 rounded-2xl shrink-0">
              <GroupIcon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Active Statuses</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {stats.statusDistribution?.slice(0, 3).map((item) => (
                  <span key={item.status} className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 border border-slate-200/50 dark:border-slate-700/50">
                    {item.status}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Bulk Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <SearchIcon className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by Order ID, Customer Name, Product, Brand..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm transition-all"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-450 hover:text-slate-650 dark:hover:text-slate-250"
                >
                  <ClearIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Status:</span>
                <select
                  value={filterType === 'status' ? filterValue : ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border-none p-0 pr-6"
                >
                  <option value="">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Payment Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Payment:</span>
                <select
                  value={filterType === 'payment' ? filterValue : ''}
                  onChange={(e) => handleFilterChange('payment', e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border-none p-0 pr-6"
                >
                  <option value="">All</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
                <span className="text-xs text-slate-400 font-medium">Category:</span>
                <select
                  value={filterType === 'category' ? filterValue : ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer border-none p-0 pr-6"
                >
                  <option value="">All</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Sports">Sports</option>
                </select>
              </div>

              {(searchQuery || sortKey || filterType) && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold px-3 py-2 border border-rose-200 dark:border-rose-950/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-2xl transition-all"
                >
                  <ClearIcon className="w-3.5 h-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-amber-500/10 dark:bg-amber-950/20 border border-amber-250 dark:border-amber-900/40 rounded-2xl animate-in fade-in duration-200 gap-3">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-400">
                {selectedOrders.length} order(s) selected
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-450 dark:text-slate-400">Bulk status:</span>
                <select
                  value={bulkStatusToUpdate}
                  onChange={(e) => setBulkStatusToUpdate(e.target.value)}
                  className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button
                  disabled={bulkLoading}
                  onClick={() => handleBulkActionExecute('status')}
                  className="text-xs font-bold px-3.5 py-1.5 bg-slate-900 dark:bg-slate-805 hover:bg-slate-800 text-white rounded-xl transition-all"
                >
                  Apply
                </button>

                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1"></div>

                <button
                  disabled={bulkLoading}
                  onClick={() => handleBulkActionExecute('archive')}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-slate-350 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                  title="Archive Selected"
                >
                  <ArchiveIcon className="w-3.5 h-3.5" /> Archive
                </button>

                <button
                  disabled={bulkLoading}
                  onClick={() => handleBulkActionExecute('restore')}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 border border-slate-350 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
                  title="Restore Selected"
                >
                  <UnarchiveIcon className="w-3.5 h-3.5" /> Restore
                </button>

                <button
                  disabled={bulkLoading}
                  onClick={() => handleBulkActionExecute('delete')}
                  className="flex items-center gap-1 text-xs font-bold px-3.5 py-1.5 bg-rose-650 hover:bg-rose-700 text-white rounded-xl transition-all"
                >
                  <DeleteIcon className="w-3.5 h-3.5" /> Bulk Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Database Table view */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-150 dark:border-slate-800 text-[11px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={orders.length > 0 && selectedOrders.length === orders.length}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                    />
                  </th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4 cursor-pointer select-none group" onClick={() => handleSortToggle('date')}>
                    <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                      Date
                      {sortKey === 'date' && <ArrowUpwardIcon className="w-3 h-3 text-amber-500" />}
                      {sortKey === '-date' && <ArrowDownwardIcon className="w-3 h-3 text-amber-500" />}
                    </div>
                  </th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 cursor-pointer select-none group" onClick={() => handleSortToggle('amount')}>
                    <div className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                      Total Amount
                      {sortKey === 'amount' && <ArrowUpwardIcon className="w-3 h-3 text-amber-500" />}
                      {sortKey === '-amount' && <ArrowDownwardIcon className="w-3 h-3 text-amber-500" />}
                    </div>
                  </th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 text-sm">
                {isLoading ? (
                  // Skeleton Rows
                  Array.from({ length: limit }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="p-4 text-center">
                        <div className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-6 mx-auto"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20"></div>
                      </td>
                      <td className="p-4">
                        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center">
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  // Empty State Row
                  <tr>
                    <td colSpan="11" className="p-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto text-slate-400">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-full text-slate-500">
                          <ShoppingCartIcon className="w-8 h-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-750 dark:text-slate-200">No Orders Found</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No orders match the selected filters or search parameters. Try clearing your filters or creating a new order.
                        </p>
                        <button
                          onClick={handleClearAll}
                          className="text-xs font-semibold px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Data Rows
                  orders.map((order) => {
                    const rowId = order._id;
                    const isChecked = selectedOrders.includes(rowId);
                    return (
                      <tr
                        key={rowId}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors ${
                          isChecked ? 'bg-amber-500/5 dark:bg-amber-500/5' : ''
                        }`}
                      >
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectRow(e, rowId)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700"
                          />
                        </td>
                        <td className="p-4 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                          <button
                            onClick={() => {
                              setCurrentOrder(order);
                              setActiveModal('view');
                            }}
                            className="hover:underline text-amber-500 text-left font-bold"
                          >
                            {order.OrderID}
                          </button>
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          {order.OrderDate ? new Date(order.OrderDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'N/A'}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 font-semibold max-w-[150px] truncate">
                          {order.CustomerName}
                        </td>
                        <td className="p-4 text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={order.ProductName}>
                          {order.ProductName}
                        </td>
                        <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                          {order.Category || 'N/A'}
                        </td>
                        <td className="p-4 text-center text-slate-700 dark:text-slate-300">
                          {order.Quantity || 0}
                        </td>
                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(order.TotalAmount)}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusClass(order.OrderStatus)}`}>
                            {order.OrderStatus}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                          {order.PaymentMethod || 'N/A'}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1 justify-center items-center">
                            <button
                              onClick={() => {
                                setCurrentOrder(order);
                                setActiveModal('view');
                              }}
                              className="p-1.5 text-slate-450 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="View Details"
                            >
                              <VisibilityIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentOrder(order);
                                setActiveModal('edit');
                              }}
                              className="p-1.5 text-slate-450 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Edit Order"
                            >
                              <EditIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setCurrentOrder(order);
                                setActiveModal('delete');
                              }}
                              className="p-1.5 text-slate-450 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                              title="Delete Order"
                            >
                              <DeleteIcon className="w-4 h-4" />
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

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-slate-50/50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Show</span>
              <select
                value={limit}
                onChange={handleLimitChange}
                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded focus:outline-none text-slate-700 dark:text-slate-350 cursor-pointer font-bold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
              <span className="ml-4 border-l border-slate-200 dark:border-slate-800 pl-4">
                Showing {orders.length > 0 ? (page - 1) * limit + 1 : 0} to {Math.min(page * limit, total)} of {total} entries
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1 || isLoading}
                onClick={() => handlePageChange(page - 1)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-750 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <NavigateBeforeIcon className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }).map((_, idx) => {
                  // simple paginator logic centered around current page
                  let pageNum = idx + 1;
                  if (page > 3 && pages > 5) {
                    pageNum = page - 3 + idx;
                    if (pageNum + (4 - idx) > pages) {
                      pageNum = pages - 4 + idx;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        page === pageNum
                          ? 'bg-amber-500 text-slate-950 font-bold shadow'
                          : 'border border-slate-250 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page >= pages || isLoading}
                onClick={() => handlePageChange(page + 1)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-750 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <NavigateNextIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CREATE / EDIT ORDER MODAL */}
      {(activeModal === 'create' || activeModal === 'edit') && currentOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden scale-in-center">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {activeModal === 'create' ? 'Create New Amazon Order' : `Edit Order: ${currentOrder.OrderID}`}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
              >
                <ClearIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <Formik
                initialValues={currentOrder}
                validationSchema={OrderSchema}
                onSubmit={activeModal === 'create' ? handleCreateSubmit : handleEditSubmit}
              >
                {({ values, errors, touched, setFieldValue, isSubmitting }) => {
                  
                  // Auto-calculate Total Amount in real-time when inputs change
                  // Formula: total = (qty * price) - discount + tax + shipping
                  React.useEffect(() => {
                    const qty = parseInt(values.Quantity) || 0;
                    const price = parseFloat(values.UnitPrice) || 0;
                    const discount = parseFloat(values.Discount) || 0;
                    const tax = parseFloat(values.Tax) || 0;
                    const shipping = parseFloat(values.ShippingCost) || 0;
                    const computedTotal = (qty * price) - discount + tax + shipping;
                    setFieldValue('TotalAmount', computedTotal.toFixed(2));
                  }, [values.Quantity, values.UnitPrice, values.Discount, values.Tax, values.ShippingCost, setFieldValue]);

                  return (
                    <Form className="space-y-6">
                      
                      {/* Grid Sections */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Order Metadata */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Order ID</label>
                          <Field
                            name="OrderID"
                            disabled={activeModal === 'edit'}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
                          />
                          {errors.OrderID && touched.OrderID && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.OrderID}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Order Date</label>
                          <Field
                            type="date"
                            name="OrderDate"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.OrderDate && touched.OrderDate && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.OrderDate}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Order Status</label>
                          <Field
                            as="select"
                            name="OrderStatus"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Refunded">Refunded</option>
                          </Field>
                          {errors.OrderStatus && touched.OrderStatus && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.OrderStatus}</span>
                          )}
                        </div>

                        {/* Customer Details */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Customer Name</label>
                          <Field
                            name="CustomerName"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.CustomerName && touched.CustomerName && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.CustomerName}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Customer ID</label>
                          <Field
                            name="CustomerID"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.CustomerID && touched.CustomerID && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.CustomerID}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Seller ID</label>
                          <Field
                            name="SellerID"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.SellerID && touched.SellerID && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.SellerID}</span>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Product Name</label>
                          <Field
                            name="ProductName"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.ProductName && touched.ProductName && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.ProductName}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Product ID</label>
                          <Field
                            name="ProductID"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.ProductID && touched.ProductID && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.ProductID}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Category</label>
                          <Field
                            name="Category"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.Category && touched.Category && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.Category}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Brand</label>
                          <Field
                            name="Brand"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.Brand && touched.Brand && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.Brand}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Payment Method</label>
                          <Field
                            as="select"
                            name="PaymentMethod"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Credit Card">Credit Card</option>
                            <option value="Debit Card">Debit Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Net Banking">Net Banking</option>
                            <option value="Cash on Delivery">Cash on Delivery</option>
                          </Field>
                          {errors.PaymentMethod && touched.PaymentMethod && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.PaymentMethod}</span>
                          )}
                        </div>

                        {/* Pricing & Totals */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Quantity</label>
                          <Field
                            type="number"
                            name="Quantity"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.Quantity && touched.Quantity && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.Quantity}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">UnitPrice ($)</label>
                          <Field
                            name="UnitPrice"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.UnitPrice && touched.UnitPrice && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.UnitPrice}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Discount ($)</label>
                          <Field
                            name="Discount"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Tax ($)</label>
                          <Field
                            name="Tax"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Shipping Cost ($)</label>
                          <Field
                            name="ShippingCost"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Total Amount ($)</label>
                          <Field
                            name="TotalAmount"
                            readOnly
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm font-bold focus:outline-none cursor-not-allowed border-dashed"
                          />
                        </div>

                        {/* Location Details */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">City</label>
                          <Field
                            name="City"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.City && touched.City && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.City}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">State</label>
                          <Field
                            name="State"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.State && touched.State && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.State}</span>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-1.5">Country</label>
                          <Field
                            name="Country"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                          {errors.Country && touched.Country && (
                            <span className="text-[11px] text-rose-500 font-semibold mt-1 block">{errors.Country}</span>
                          )}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setActiveModal(null)}
                          className="px-5 py-2 border border-slate-250 hover:bg-slate-50 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 font-semibold text-sm rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow transition-all disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Save Order'}
                        </button>
                      </div>

                    </Form>
                  );
                }}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {activeModal === 'view' && currentOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full flex flex-col shadow-2xl overflow-hidden scale-in-center">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  Order Details
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 font-mono mt-0.5">{currentOrder.OrderID}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFetchInvoice(currentOrder._id || currentOrder.OrderID)}
                  className="p-1.5 text-slate-450 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  title="Generate Invoice"
                >
                  <ReceiptIcon className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => handleDuplicateOrder(currentOrder._id || currentOrder.OrderID)}
                  className="p-1.5 text-slate-450 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all"
                  title="Duplicate Order"
                >
                  <CopyAllIcon className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-650 dark:hover:text-slate-200 transition-all"
                >
                  <ClearIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300">
              
              {/* Primary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Detail Info */}
                <div className="bg-slate-50/60 dark:bg-slate-950/30 p-4 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2.5">Item Summary</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-slate-450 font-medium">Product Name:</span> <strong className="text-slate-800 dark:text-slate-100">{currentOrder.ProductName}</strong></p>
                    <p><span className="text-slate-450 font-medium">Product ID:</span> <span className="font-mono text-xs">{currentOrder.ProductID}</span></p>
                    <p><span className="text-slate-450 font-medium">Brand:</span> <span>{currentOrder.Brand || 'N/A'}</span></p>
                    <p><span className="text-slate-450 font-medium">Category:</span> <span>{currentOrder.Category || 'N/A'}</span></p>
                  </div>
                </div>

                {/* Customer Detail Info */}
                <div className="bg-slate-50/60 dark:bg-slate-950/30 p-4 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2.5">Customer & Seller</h4>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="text-slate-450 font-medium">Customer Name:</span> <strong className="text-slate-800 dark:text-slate-100">{currentOrder.CustomerName}</strong></p>
                    <p><span className="text-slate-450 font-medium">Customer ID:</span> <span className="font-mono text-xs">{currentOrder.CustomerID}</span></p>
                    <p><span className="text-slate-450 font-medium">Seller ID:</span> <span className="font-mono text-xs">{currentOrder.SellerID || 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              {/* Transactions Breakdowns */}
              <div className="bg-slate-50/60 dark:bg-slate-950/30 p-5 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-3.5">Billings Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-slate-450 text-xs">Quantity</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{currentOrder.Quantity || 0}</p>
                  </div>
                  <div>
                    <span className="text-slate-450 text-xs">Unit Price</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(currentOrder.UnitPrice)}</p>
                  </div>
                  <div>
                    <span className="text-slate-450 text-xs">Discount</span>
                    <p className="font-bold text-rose-500">-{formatCurrency(currentOrder.Discount || 0)}</p>
                  </div>
                  <div>
                    <span className="text-slate-450 text-xs">Shipping Cost</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(currentOrder.ShippingCost || 0)}</p>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-slate-450 text-xs">Payment Method:</span>
                    <span className="ml-1.5 font-semibold text-slate-800 dark:text-slate-200">{currentOrder.PaymentMethod || 'N/A'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-450 text-xs block">Grand Total</span>
                    <span className="text-lg font-black text-amber-500">{formatCurrency(currentOrder.TotalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Geographic Info */}
              <div className="bg-slate-50/60 dark:bg-slate-950/30 p-4 border border-slate-150 dark:border-slate-800/80 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-2.5">Delivery Destination</h4>
                <p className="text-sm">
                  {currentOrder.City}, {currentOrder.State}, {currentOrder.Country}
                </p>
              </div>

              {/* Status Timeline History */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">Status Timeline</h4>
                <div className="relative border-l border-slate-200 dark:border-slate-800 pl-5 ml-2.5 space-y-4 text-xs">
                  {/* Active status */}
                  <div className="relative">
                    <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{currentOrder.OrderStatus}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Updated: {currentOrder.updatedAt ? new Date(currentOrder.updatedAt).toLocaleString() : 'N/A'}</p>
                  </div>

                  {/* Creation status */}
                  <div className="relative">
                    <span className="absolute -left-[26px] top-0.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <p className="font-semibold text-slate-500">Order Placed Successfully</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Created: {currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap justify-between gap-3">
              <div className="flex gap-2">
                {currentOrder.OrderStatus !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancelOrder(currentOrder._id || currentOrder.OrderID)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-650 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-450 font-bold text-xs rounded-xl transition-all"
                  >
                    <CancelScheduleSendIcon className="w-3.5 h-3.5" /> Cancel Order
                  </button>
                )}

                {currentOrder.isArchived ? (
                  <button
                    onClick={() => handleArchiveOrder(currentOrder._id || currentOrder.OrderID, false)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-250 hover:bg-slate-50 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    <UnarchiveIcon className="w-3.5 h-3.5" /> Restore
                  </button>
                ) : (
                  <button
                    onClick={() => handleArchiveOrder(currentOrder._id || currentOrder.OrderID, true)}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-250 hover:bg-slate-50 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
                  >
                    <ArchiveIcon className="w-3.5 h-3.5" /> Archive
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setActiveModal('edit');
                  }}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-650 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Edit details
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {activeModal === 'delete' && currentOrder && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl p-6 text-center space-y-4 scale-in-center">
            <div className="mx-auto w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center dark:bg-rose-950/30 dark:text-rose-400">
              <DeleteIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Order?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete order <strong className="font-mono text-slate-700 dark:text-slate-200">{currentOrder.OrderID}</strong>? This action will remove the order permanently from the MongoDB database.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-250 hover:bg-slate-50 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-650 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow transition-all"
              >
                Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW MODAL */}
      {activeModal === 'invoice' && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden scale-in-center">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                Invoice Generator
              </h3>
              <button
                onClick={() => setActiveModal('view')}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-650 dark:hover:text-slate-200 transition-all"
              >
                <ClearIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {invoiceLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="text-xs text-slate-450">Generating invoice details...</span>
                </div>
              ) : invoiceData ? (
                <div className="space-y-6 bg-slate-50 dark:bg-slate-950/40 p-5 border border-slate-100 dark:border-slate-850 rounded-2xl font-sans text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">AMAZON DASHBOARD INC.</h4>
                      <p className="text-[10px] text-slate-450 mt-0.5">Automated Invoice Billing Service</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{invoiceData.invoiceNumber}</p>
                      <p className="text-[10px] mt-0.5">Date: {new Date(invoiceData.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-slate-700 dark:text-slate-350">Bill To:</p>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold">{invoiceData.customer}</p>
                  </div>

                  <div className="border-t border-b border-slate-200 dark:border-slate-800 py-3">
                    <div className="flex justify-between font-bold text-slate-750 dark:text-slate-350 mb-2">
                      <span>Product Item Description</span>
                      <span>Total Price</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="truncate max-w-[250px]">{invoiceData.product}</span>
                      <span className="font-mono">{formatCurrency(invoiceData.total)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pl-24">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatCurrency(invoiceData.total)}</span>
                    </div>
                    <div className="flex justify-between text-amber-600 font-semibold">
                      <span>Taxes & Duties (10%):</span>
                      <span className="font-mono">+{formatCurrency(invoiceData.tax)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-black text-slate-800 dark:text-slate-100 text-sm">
                      <span>Grand Total:</span>
                      <span className="font-mono text-amber-500">{formatCurrency(invoiceData.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-xs text-rose-500 py-6">Could not load invoice data.</p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button
                onClick={() => setActiveModal('view')}
                className="px-4 py-2 border border-slate-250 hover:bg-slate-50 dark:border-slate-750 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                Back to Details
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
              >
                <OpenInNewIcon className="w-3.5 h-3.5" /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default Orders;
