import authAxiosClient from "./authAxiosClient";

const userApi = {
    getSelfProfile: () => authAxiosClient.get("/user/selfProfile"),
    updateProfile: (data) => authAxiosClient.post("/user/update-profile", data),
    changePassword: (data) => authAxiosClient.post("/user/change-password", data),
};

export default userApi;
