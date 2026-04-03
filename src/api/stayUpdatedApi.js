import authAxiosClient from "./authAxiosClient";

const stayUpdatedApi = {
    listSignups: (params) => authAxiosClient.get("/stayUpdated/list", { params }),
    deleteSignup: (id) => authAxiosClient.delete(`/stayUpdated/delete/${id}`),
};

export default stayUpdatedApi;
