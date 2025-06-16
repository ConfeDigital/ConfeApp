import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api";
import authAxios from "../../authApi";
import { ACCESS_TOKEN, REFRESH_TOKEN, AUTH_TYPE } from "../../constants";
import { jwtDecode } from "jwt-decode";
import { loginRequest } from "../../auth-config";

export const updateUserAttributes = createAsyncThunk(
  "auth/updateUserAttributes",
  async (updatedData, thunkAPI) => {
    try {
      const response = await axios.get("/api/auth/users/me/", updatedData);

      return response.data; // Updated user object
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Error al actualizar los datos del usuario"
      );
    }
  }
);

// Thunks for Djoser actions
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await authAxios.post("/api/auth/jwt/create/", {
        email,
        password,
      });
      const { access, refresh } = response.data;

      const userResponse = await axios.get("/api/auth/users/me/", {
        headers: { Authorization: `Bearer ${access}` },
      });

      sessionStorage.setItem(AUTH_TYPE, "djoser");

      return {
        access,
        refresh,
        user: userResponse.data,
      };
    } catch (error) {
      // If error.response is undefined, use error.message
      // const errMsg =
      //   error.response && error.response.data
      //     ? error.response.data
      //     : error.message || "Error en el inicio de sesión";
      const errMsg = "Email o contraseña son incorrectos";
      return thunkAPI.rejectWithValue(errMsg);
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (formData, thunkAPI) => {
    // Receive all form data
    try {
      const response = await axios.post("/api/candidatos/registrar/", formData); // Send all form data
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const activateAccount = createAsyncThunk(
  "auth/verifyEmail",
  async ({ uid, token }, thunkAPI) => {
    try {
      const response = await axios.post("/api/auth/users/activation/", {
        uid,
        token,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, thunkAPI) => {
    try {
      const response = await axios.post("/api/auth/users/reset_password/", {
        email,
      });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const confirmResetPassword = createAsyncThunk(
  "auth/confirmResetPassword",
  async ({ uid, token, new_password, re_new_password }, thunkAPI) => {
    try {
      const response = await axios.post(
        "/api/auth/users/reset_password_confirm/",
        { uid, token, new_password, re_new_password }
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

// Thunk for checking token expiration and refreshing if needed
export const checkAndRefreshToken = createAsyncThunk(
  "auth/checkAndRefreshToken",
  async (_, thunkAPI) => {
    const accessToken = sessionStorage.getItem(ACCESS_TOKEN);
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN);

    const dispatch = thunkAPI.dispatch;

    if (!accessToken || !refreshToken) {
      dispatch(setUnauthenticated());
      return thunkAPI.rejectWithValue("No tokens available");
    }

    const decoded = jwtDecode(accessToken);
    const tokenExpiration = decoded.exp;
    const now = Date.now() / 1000;

    if (tokenExpiration < now) {
      // Token expired, attempt to refresh
      try {
        const response = await authAxios.post("/api/auth/jwt/refresh/", {
          refresh: refreshToken,
        });
        const newAccessToken = response.data.access;
        sessionStorage.setItem(ACCESS_TOKEN, newAccessToken);

        const userResponse = await axios.get("/api/auth/users/me/", {
          headers: { Authorization: `Bearer ${newAccessToken}` },
        });

        dispatch(setUser(userResponse.data));
        dispatch(setAuthenticated());

        return newAccessToken;
      } catch (error) {
        dispatch(setUnauthenticated());
        return thunkAPI.rejectWithValue(
          error.response?.data || "Token refresh failed"
        );
      }
    }

    // Token still valid, fetch user and return current access token
    try {
      const userResponse = await axios.get("/api/auth/users/me/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      dispatch(setUser(userResponse.data));
      dispatch(setAuthenticated());

      return accessToken;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "User fetch failed"
      );
    }
  }
);

export const checkAndFetchUser = createAsyncThunk(
  "auth/checkAndFetchUser",
  async (instance, thunkAPI) => {
    const dispatch = thunkAPI.dispatch;

    try {
      if (!instance.getActiveAccount()) {
        dispatch(setUnauthenticated());
        throw new Error(
          "No active account found. Ensure the user is logged in."
        );
      }

      // Ensure instance is initialized
      if (!instance.isInitialized) {
        await instance.initialize();
      }

      const activeAccount = instance.getActiveAccount();
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account: activeAccount,
      });

      sessionStorage.setItem(AUTH_TYPE, "msal");

      const userResponse = await axios.get("/api/auth/users/me/", {
        headers: { Authorization: `Bearer ${response.accessToken}` },
      });

      dispatch(setUser(userResponse.data));
      dispatch(setAuthenticated());

      return {
        email: userResponse.data.email,
        first_name: userResponse.data.first_name,
        last_name: userResponse.data.last_name,
        id: userResponse.data.id,
        is_staff: userResponse.data.is_staff,
        is_active: userResponse.data.is_active,
        groups: userResponse.data.groups,
        center: userResponse.data.center,
      };
    } catch (error) {
      console.error("MSAL checkAndFetchUser failed:", error);
      dispatch(setUnauthenticated());
      return thunkAPI.rejectWithValue(error.message || "Authentication failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    message: "",
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      sessionStorage.removeItem(ACCESS_TOKEN);
      sessionStorage.removeItem(REFRESH_TOKEN);
      sessionStorage.removeItem(AUTH_TYPE);
    },
    setAuthenticated(state) {
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    setUnauthenticated(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
    },
    setUser(state, action) {
      state.user = action.payload;
      if(state.user.is_active == false) state.isAuthenticated = false;
    },
    setLoading(state) {
      state.isLoading = true;
    },
  },
  extraReducers: (builder) => {
    // Update user attributes
    // builder.addCase(updateUserAttributes.pending, (state) => {
    //   state.isLoading = true;
    //   state.error = null;
    // });

    builder.addCase(updateUserAttributes.fulfilled, (state, action) => {
      state.isLoading = false;
      state.user = action.payload; // Update user in store
      state.message = "Datos del usuario actualizados exitosamente.";
    });

    builder.addCase(updateUserAttributes.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
    // Login action
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
      state.message = "Inicio de sesión exitoso.";
      sessionStorage.setItem(ACCESS_TOKEN, action.payload.access);
      sessionStorage.setItem(REFRESH_TOKEN, action.payload.refresh);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.error = action.payload;
      state.message = "";
      state.isAuthenticated = false; // This was true in original code which seems incorrect
    });
    // Register action
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.message =
        "Registro exitoso. Revisa tu correo para activar tu cuenta.";
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.error = action.payload;
      state.message = "";
    });
    // Verify email action
    builder.addCase(activateAccount.fulfilled, (state) => {
      state.message =
        "¡Verificación de correo electrónico exitosa! Ahora puedes iniciar sesión.";
    });
    builder.addCase(activateAccount.rejected, (state, action) => {
      state.error = action.payload;
    });
    // Forgot password action
    builder.addCase(resetPassword.fulfilled, (state) => {
      state.message =
        "¡Si existe un usuario ya se envió un correo electrónico para restablecer la contraseña! Revisa tu bandeja de entrada.";
    });
    builder.addCase(resetPassword.rejected, (state, action) => {
      state.error = action.payload;
    });
    // Confirm reset password action
    builder.addCase(confirmResetPassword.fulfilled, (state) => {
      state.message =
        "¡La contraseña se restableció exitosamente! Ahora puedes iniciar sesión.";
    });
    builder.addCase(confirmResetPassword.rejected, (state, action) => {
      state.error = action.payload;
    });
    // Refresh token
    builder.addCase(checkAndRefreshToken.fulfilled, (state) => {
      state.isAuthenticated = true;
      state.isLoading = false;
    });
    builder.addCase(checkAndRefreshToken.rejected, (state) => {
      state.isAuthenticated = false;
      state.isLoading = false;
    });
    builder.addCase(checkAndFetchUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(checkAndFetchUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(checkAndFetchUser.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload;
    });
  },
});

export const {
  logout,
  setAuthenticated,
  setUnauthenticated,
  setUser,
  setLoading,
} = authSlice.actions;
export default authSlice.reducer;
