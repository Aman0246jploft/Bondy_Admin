import authAxiosClient from "./authAxiosClient";

const userApi = {
    getSelfProfile: () => authAxiosClient.get("/user/selfProfile"),
    updateProfile: (data) => authAxiosClient.post("/user/update", data),
};

export default userApi;
