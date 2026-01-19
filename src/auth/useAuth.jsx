// src/auth/useAuth.js
export const useAuth = () => {
  let user = JSON.parse(localStorage.getItem("kadSunInfo"));
  user = user?.token;
  return { user };
};
