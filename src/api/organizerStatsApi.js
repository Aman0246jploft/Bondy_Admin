import apiClient from "./authAxiosClient";

const organizerStatsApi = {
    // Get summary statistics for an organizer
    getStatsSummary: (organizerId) =>
        apiClient.get(`/organizerStats/admin/organizer/${organizerId}/stats-summary`),

    // Get transactions with filters
    getTransactions: (organizerId, params) =>
        apiClient.get(`/organizerStats/admin/organizer/${organizerId}/transactions`, { params }),

    // Get wallet history with filters
    getWalletHistory: (organizerId, params) =>
        apiClient.get(`/organizerStats/admin/organizer/${organizerId}/wallet-history`, { params }),

    // Get payout requests with filters
    getPayouts: (organizerId, params) =>
        apiClient.get(`/organizerStats/admin/organizer/${organizerId}/payouts`, { params }),
};

export default organizerStatsApi;
