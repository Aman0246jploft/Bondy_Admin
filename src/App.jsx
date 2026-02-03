// src/App.jsx

import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import LayoutWrapper from "./Component/Layout/LayoutWrapper";
import Loader from "./Component/Common/Loader";


// Lazy-loaded pages
const Login = lazy(() => import("./Pages/Auth/Login"));
const Dashboard = lazy(() => import("./Pages/Dashboard/Dashboard"));
const Home = lazy(() => import("./Pages/Home/Home"));
const Customers = lazy(() => import("./Pages/User/Customers"));
const Organizers = lazy(() => import("./Pages/User/Organizers"));
const VerificationRequests = lazy(() => import("./Pages/Verification/VerificationRequests"));
const Categories = lazy(() => import("./Pages/Category/Categories"));
const Events = lazy(() => import("./Pages/Events/Events"));
const Courses = lazy(() => import("./Pages/Courses/Courses"));
const Taxes = lazy(() => import("./Pages/Settings/Taxes"));
const PromoCodes = lazy(() => import("./Pages/Settings/PromoCodes"));
const GlobalSettings = lazy(() => import("./Pages/Settings/GlobalSettings"));
const PrivacyPolicy = lazy(() => import("./Component/Content/PrivacyPolicy"));
const TermsConditions = lazy(() => import("./Component/Content/TermsConditions"));
const FAQs = lazy(() => import("./Component/Content/FAQList"));
const SupportTickets = lazy(() => import("./Pages/SupportTickets/SupportTickets"));
const ContactList = lazy(() => import("./Pages/Contact/ContactList"));

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
              <Route path="/customers" element={<Customers />} />
              <Route path="/organizers" element={<Organizers />} />
              <Route path="/verification-requests" element={<VerificationRequests />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/events" element={<Events />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/taxes" element={<Taxes />} />
              <Route path="/promo-codes" element={<PromoCodes />} />
              <Route path="/settings" element={<GlobalSettings />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-conditions" element={<TermsConditions />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/faqs" element={<FAQs />} />
              <Route path="/support-tickets" element={<SupportTickets />} />
              <Route path="/contacts" element={<ContactList />} />
              {/* <Route path="/sellProduct" element={<SellProduct />} /> */}

            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
