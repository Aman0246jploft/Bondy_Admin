// src/App.jsx

import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import LayoutWrapper from "./Component/Layout/LayoutWrapper";
import Loader from "./Component/Common/Loader";
import SellProduct from "./Component/SellProduct/SellProduct";


// Lazy-loaded pages
const Login = lazy(() => import("./Pages/Auth/Login"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard"));
const Home = lazy(() => import("./Pages/Home/Home"));
const User = lazy(() => import("./Pages/User/User"));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Private Routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<LayoutWrapper />}>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/user" element={<User />} />
              <Route path="/sellProduct" element={<SellProduct />} />
     
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
