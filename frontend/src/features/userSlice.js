import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

const initialState = {
  users: [],
  total: 0,
  page: 1,
  pages: 1,
  limit: 10,
  isLoading: false,
  error: null,
  currentUserDetail: null,
  isDetailLoading: false,
  searchQuery: '',
  roleFilter: '',
};

// Async Thunks
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { user: userState } = getState();
      const { page, limit, searchQuery, roleFilter } = userState;
      
      const response = await API.get('/admin/users', {
        params: {
          page,
          limit,
          search: searchQuery,
          role: roleFilter
        }
      });
      return response.data; // { success, count, total, page, pages, data: [safeUser] }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/users/${userId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user details');
    }
  }
);

export const banUser = createAsyncThunk(
  'user/banUser',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.patch(`/admin/users/${userId}/ban`);
      dispatch(fetchUsers());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to ban user');
    }
  }
);

export const unbanUser = createAsyncThunk(
  'user/unbanUser',
  async (userId, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.patch(`/admin/users/${userId}/unban`);
      dispatch(fetchUsers());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unban user');
    }
  }
);

export const changeUserRole = createAsyncThunk(
  'user/changeUserRole',
  async ({ userId, role }, { dispatch, rejectWithValue }) => {
    try {
      const response = await API.patch(`/admin/users/${userId}/role`, { role });
      dispatch(fetchUsers());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to change user role');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserPage: (state, action) => {
      state.page = action.payload;
    },
    setUserLimit: (state, action) => {
      state.limit = action.payload;
      state.page = 1;
    },
    setUserSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.page = 1;
    },
    setUserRoleFilter: (state, action) => {
      state.roleFilter = action.payload;
      state.page = 1;
    },
    clearUserFilters: (state) => {
      state.searchQuery = '';
      state.roleFilter = '';
      state.page = 1;
    },
    clearUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data || [];
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.pages = action.payload.pages || 1;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch User By ID
      .addCase(fetchUserById.pending, (state) => {
        state.isDetailLoading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isDetailLoading = false;
        state.currentUserDetail = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setUserPage,
  setUserLimit,
  setUserSearchQuery,
  setUserRoleFilter,
  clearUserFilters,
  clearUserError
} = userSlice.actions;

export default userSlice.reducer;
