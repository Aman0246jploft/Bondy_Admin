import apiClient from "./authAxiosClient";

const contactApi = {
    listContacts: (params) => apiClient.get("/contact/listContacts", { params }),
    deleteContact: (data) => apiClient.post("/contact/deleteContact", data),
    updateContact: (data) => apiClient.post("/contact/updateContact", data),
};


export default contactApi;
