import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api"; // your axios instance

// Fetch notifications
export const fetchNotifications = createAsyncThunk(
  "notifications/fetchNotifications",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get("/api/notifications/");
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const markAsRead = createAsyncThunk(
  "notifications/markAsRead",
  async (notificationId, { getState, rejectWithValue }) => {
    const state = getState();
    const notification = state.notifications.notifications.find(
      (n) => n.id === notificationId
    );

    // Skip if already marked as read
    if (notification?.is_read) {
      return rejectWithValue("Notification already marked as read.");
    }

    try {
      const response = await axios.patch(`/api/notifications/${notificationId}/`);
      return notificationId; // Return notificationId to update the state
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to mark as read.");
    }
  }
);

const initialState = {
  notifications: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.is_read).length;
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
      state.unreadCount++;
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
    .addCase(markAsRead.fulfilled, (state, action) => {
      const notificationId = action.payload;
      const notification = state.notifications.find((n) => n.id === notificationId);
      if (notification) {
        notification.is_read = true;
        state.unreadCount--;
      }
    })
    .addCase(fetchNotifications.fulfilled, (state, action) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.is_read).length;
    })
    .addCase(markAsRead.rejected, (state, action) => {
      if (action.payload !== "Notification already marked as read.") {
        console.error("Failed to mark notification as read:", action.payload);
      }
    });
  },
});

export const { setNotifications, addNotification, clearNotifications } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;

