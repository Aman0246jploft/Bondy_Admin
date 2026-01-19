// src/features/user/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAxiosClient from '../../api/authAxiosClient';
import { toast } from 'react-toastify';

export function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}


export const mainCategory = createAsyncThunk(
    'category/listCategoryNames',
    async (queryParams = {}, thunkAPI) => {
        try {
            const res = await authAxiosClient.get('/category/listCategoryNames', { params: queryParams });
            return res.data;
        } catch (err) {
            console.error(`Category List [${err.responseCode || 500}]: ${err.message}`);
            let message = capitalizeFirstLetter(err.message)
            toast.error(message)
            return thunkAPI.rejectWithValue({
                message: err.message,
                code: err.responseCode || 500,
            });
        }
    }
);





const CategorySlice = createSlice({
    name: 'user',
    initialState: {
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(mainCategory.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(mainCategory.fulfilled, (state, action) => {
                state.loading = false;
                state.categoryList = action.payload.data;
            })
            .addCase(mainCategory.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

    },
});

export default CategorySlice.reducer;
