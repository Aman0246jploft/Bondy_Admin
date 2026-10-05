import authAxiosClient from "./authAxiosClient";

const notificationApi = {
  getRecipientCounts: () => authAxiosClient.get("/notification/admin/recipient-counts"),
  sendCustomNotification: (payload) => authAxiosClient.post("/notification/admin/send", payload),
  getNotificationHistory: (params) => authAxiosClient.get("/notification/admin/history", { params }),
};

export default notificationApi;
