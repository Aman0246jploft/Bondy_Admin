// src/features/user/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";
import authAxiosClient from "../../api/authAxiosClient";
import useToast from "../../Component/ToastProvider/useToast";
import { toast } from "react-toastify";

export function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Unauthenticated API call
export const fetchPublicUsers = createAsyncThunk(
  "user/fetchPublicUsers",
  async (_, thunkAPI) => {
    try {
      const res = await axiosClient.get("/users/public");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Error");
    }
  }
);

// Authenticated API call
export const fetchPrivateUsers = createAsyncThunk(
  "user/fetchPrivateUsers",
  async (_, thunkAPI) => {
    try {
      const res = await authAxiosClient.get("/users/private");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Error");
    }
  }
);

export const login = createAsyncThunk("user/login", async (data, thunkAPI) => {
  try {
    const res = await axiosClient.post("/user/admin/login", data);
    localStorage.setItem("kadSunInfo", JSON.stringify(res.data?.data));
    localStorage.setItem("token", res.data?.data?.token);

    return res.data;
  } catch (err) {
    console.error(`Login error [${err.responseCode || 500}]: ${err.message}`);
    let message = capitalizeFirstLetter(err.message);
    toast.error(message);
    return thunkAPI.rejectWithValue({
      message: err.message,
      code: err.responseCode || 500,
    });
  }
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    loading: false,
    error: null,
    authData: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.authData = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default userSlice.reducer;
