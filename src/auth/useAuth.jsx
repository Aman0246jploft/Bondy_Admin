// src/auth/useAuth.js
// export const useAuth = () => {
//   let user = JSON.parse(localStorage.getItem("kadSunInfo"));
//   user = user?.token;
//   return { user };
// };



export const useAuth = () => {
  let user = null;

  try {
    const stored = localStorage.getItem("kadSunInfo");

    if (stored && stored !== "undefined") {
      user = JSON.parse(stored);
    }
  } catch (err) {
    console.error("Invalid kadSunInfo:", err);
    localStorage.removeItem("kadSunInfo");
  }

  return {
    user: user?.token || null,
  };
};