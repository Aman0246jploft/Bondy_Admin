import authAxiosClient from "./authAxiosClient";

const dashboardApi = {
    getStats: async () => {
        try {
            const response = await authAxiosClient.get("/analytics/admin/global-stats");
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default dashboardApi;
