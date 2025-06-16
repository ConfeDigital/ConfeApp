import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import notificationsReducer from "./features/notifications/notificationsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    notifications: notificationsReducer,
  },
});

export default store;
