import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "./contexts/theme/ThemeContext.jsx";
import { ConfirmProvider } from "./contexts/confirm/ConfirmContext.jsx";
import { Provider } from "react-redux";
import { store } from "./features/store/store.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <Provider store={store}>
        <ConfirmProvider>
          <App />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnHover
            theme="light"
          />
        </ConfirmProvider>
      </Provider>
    </ThemeProvider>
  </StrictMode>
);
