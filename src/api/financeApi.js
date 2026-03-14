import authAxiosClient from "./authAxiosClient";

const financeApi = {
  getFinanceStats: async () => {
    const res = await authAxiosClient.get("/payout/finance-stats");
    return res.data;
  },

  getAllPayouts: async (params = {}) => {
    const res = await authAxiosClient.get("/payout/all-payouts", { params });
    return res.data;
  },

  getAllTransactions: async (params = {}) => {
    const res = await authAxiosClient.get("/payout/all-transactions", { params });
    return res.data;
  },

  approvePayout: async (payoutId, transactionId, adminNote) => {
    const res = await authAxiosClient.post("/payout/approve-request", {
      payoutId,
      transactionId,
      adminNote,
    });
    return res.data;
  },

  rejectPayout: async (payoutId, adminNote) => {
    const res = await authAxiosClient.post("/payout/reject-request", {
      payoutId,
      adminNote,
    });
    return res.data;
  },

  getGlobalSettings: async () => {
    const res = await authAxiosClient.get("/globalSetting/all");
    return res.data;
  },

  updateGlobalSetting: async (key, value) => {
    const res = await authAxiosClient.post("/globalSetting/upsert", { key, value });
    return res.data;
  },
};

export default financeApi;
