import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

const initialState = {
  orders: [],
  total: 0,
  page: 1,
  pages: 1,
  limit: 10,
  isLoading: false,
  error: null,
  stats: {
    metrics: {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0
    },
    statusDistribution: [],
    recentOrders: []
  },
  searchQuery: sessionStorage.getItem('temp_searchQuery') || '',
  sortKey: sessionStorage.getItem('temp_sortKey') || '',
  filterType: sessionStorage.getItem('temp_filterType') || '', // 'status', 'payment', 'category', 'brand', etc.
  filterValue: sessionStorage.getItem('temp_filterValue') || '', // value corresponding to filter type
  isStatsLoading: false,
  bulkLoading: false
};

// Async Thunks
export const fetchOrders = createAsyncThunk(
  'data/fetchOrders',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { data } = getState();
      const { page, limit, searchQuery, sortKey, filterType, filterValue } = data;

      // 1. If filter is active
      if (filterType && filterValue) {
        let endpoint = `/orders/filter/${filterType}`;
        const params = {};
        
        if (filterType === 'status') params.type = filterValue;
        else if (filterType === 'payment') params.method = filterValue;
        else if (filterType === 'category') params.name = filterValue;
        else if (filterType === 'brand') params.name = filterValue;
        else if (filterType === 'country') params.name = filterValue;
        else if (filterType === 'state') params.name = filterValue;
        else if (filterType === 'city') params.name = filterValue;

        const response = await API.get(endpoint, { params });
        // Since filtering endpoint doesn't support backend paging, we return it directly
        // and fake the paging layout.
        const filteredData = response.data.data || [];
        return {
          data: filteredData,
          total: filteredData.length,
          page: 1,
          pages: 1,
          limit: filteredData.length || 10
        };
      }

      // 2. If search is active
      if (searchQuery) {
        const response = await API.get('/orders/search/paged', {
          params: { q: searchQuery, page, limit }
        });
        return response.data; // { success, count, total, page, pages, data }
      }

      // 3. If sort is active
      if (sortKey) {
        const response = await API.get('/orders/sort', {
          params: { sort: sortKey, page, limit }
        });
        return response.data; // { success, count, total, page, pages, data }
      }

      // 4. Default: regular paged list
      const response = await API.get('/orders/paged', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'data/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/dashboard/overview');
      return response.data.data; // { metrics, statusDistribution, recentOrders }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

export const createOrder = createAsyncThunk(
  'data/createOrder',
  async (orderData, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.post('/orders', orderData);
      dispatch(fetchOrders());
      dispatch(fetchDashboardStats());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const updateOrder = createAsyncThunk(
  'data/updateOrder',
  async ({ orderId, orderData }, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.patch(`/orders/${orderId}`, orderData);
      dispatch(fetchOrders());
      dispatch(fetchDashboardStats());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order');
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'data/deleteOrder',
  async (orderId, { dispatch, rejectWithValue }) => {
    try {
      await API.delete(`/orders/${orderId}`);
      dispatch(fetchOrders());
      dispatch(fetchDashboardStats());
      return orderId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete order');
    }
  }
);

export const executeBulkAction = createAsyncThunk(
  'data/executeBulkAction',
  async ({ action, body }, { dispatch, rejectWithValue }) => {
    try {
      let response;
      if (action === 'delete') {
        response = await API.delete('/orders/bulk/delete', { data: body });
      } else if (action === 'status') {
        response = await API.patch('/orders/bulk/status', body);
      } else if (action === 'archive') {
        response = await API.patch('/orders/bulk/archive', body);
      } else if (action === 'restore') {
        response = await API.patch('/orders/bulk/restore', body);
      } else {
        throw new Error('Unsupported bulk action');
      }
      dispatch(fetchOrders());
      dispatch(fetchDashboardStats());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || `Failed to execute bulk ${action}`);
    }
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
      state.page = 1; // reset to page 1 on limit change
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.filterType = ''; // Clear other filters
      state.filterValue = '';
      state.page = 1;
      sessionStorage.setItem('temp_searchQuery', action.payload);
      sessionStorage.removeItem('temp_filterType');
      sessionStorage.removeItem('temp_filterValue');
    },
    setSortKey: (state, action) => {
      state.sortKey = action.payload;
      state.page = 1;
      sessionStorage.setItem('temp_sortKey', action.payload);
    },
    setFilter: (state, action) => {
      state.filterType = action.payload.type;
      state.filterValue = action.payload.value;
      state.searchQuery = ''; // Clear search when filter is applied
      state.page = 1;
      sessionStorage.setItem('temp_filterType', action.payload.type);
      sessionStorage.setItem('temp_filterValue', action.payload.value);
      sessionStorage.removeItem('temp_searchQuery');
    },
    clearFilters: (state) => {
      state.searchQuery = '';
      state.sortKey = '';
      state.filterType = '';
      state.filterValue = '';
      state.page = 1;
      sessionStorage.removeItem('temp_searchQuery');
      sessionStorage.removeItem('temp_sortKey');
      sessionStorage.removeItem('temp_filterType');
      sessionStorage.removeItem('temp_filterValue');
    },
    clearDataError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Dashboard Stats
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isStatsLoading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isStatsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state) => {
        state.isStatsLoading = false;
      })
      // Bulk Actions
      .addCase(executeBulkAction.pending, (state) => {
        state.bulkLoading = true;
      })
      .addCase(executeBulkAction.fulfilled, (state) => {
        state.bulkLoading = false;
      })
      .addCase(executeBulkAction.rejected, (state, action) => {
        state.bulkLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setPage,
  setLimit,
  setSearchQuery,
  setSortKey,
  setFilter,
  clearFilters,
  clearDataError
} = dataSlice.actions;

export default dataSlice.reducer;
