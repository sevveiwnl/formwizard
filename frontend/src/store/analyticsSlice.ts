import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface FormStat {
  event_type: string;
  count: number;
  timestamp?: string;
}

interface AnalyticsState {
  formStats: FormStat[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  formStats: [],
  loading: false,
  error: null,
};

export const fetchFormAnalytics = createAsyncThunk(
  'analytics/fetchFormAnalytics',
  async (formId: string) => {
    const res = await fetch(`http://localhost:3001/api/analytics/${formId}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    const data: FormStat[] = await res.json();
    return data;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFormAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFormAnalytics.fulfilled, (state, action: PayloadAction<FormStat[]>) => {
        state.loading = false;
        state.formStats = action.payload;
      })
      .addCase(fetchFormAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error fetching analytics';
      });
  },
});

export default analyticsSlice.reducer;

