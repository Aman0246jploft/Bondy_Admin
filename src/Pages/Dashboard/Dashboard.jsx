import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import dashboardApi from "../../api/dashboardApi";
import { AiOutlineCloseCircle } from "react-icons/ai";

const StatCard = ({ title, value, subtitle, theme }) => {
  return (
    <div
      className="rounded-xl p-6 shadow-sm border-t-4 border transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: theme.colors.card,
        borderTopColor: "#098D8A",
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex flex-col">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: "#098D8A" }}
        >
          {title}
        </p>
        <p
          className="text-3xl font-bold mb-1"
          style={{ color: theme.colors.textPrimary }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {subtitle && (
          <p
            className="text-xs mt-1"
            style={{ color: theme.colors.textMuted }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError(err.message || "Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: "#098D8A" }}
          ></div>
          <p
            className="mt-4 text-lg"
            style={{ color: theme.colors.textSecondary }}
          >
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div className="text-center">
          <AiOutlineCloseCircle
            className="mx-auto mb-4"
            style={{ color: theme.colors.error, fontSize: "48px" }}
          />
          <p className="text-lg font-medium" style={{ color: theme.colors.error }}>
            {error}
          </p>
          <button
            onClick={fetchStats}
            className="mt-4 px-6 py-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: "#098D8A",
              color: "#fff",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-8"
      style={{
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="mb-10">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: theme.colors.textPrimary }}
        >
          Dashboard Overview
        </h1>
        <p style={{ color: theme.colors.textSecondary }}>
          Welcome back! Here's what's happening with your platform.
        </p>
      </div>

      {/* User Statistics */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ color: theme.colors.textPrimary }}
        >
          <span style={{ backgroundColor: "#098D8A", width: "4px", height: "16px", display: "inline-block", borderRadius: "2px" }}></span>
          User Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.users?.totalUsers || 0}
            theme={theme}
          />
          <StatCard
            title="Customers"
            value={stats?.users?.totalCustomers || 0}
            theme={theme}
          />
          <StatCard
            title="Organizers"
            value={stats?.users?.totalOrganizers || 0}
            theme={theme}
          />
        </div>
      </div>

      {/* Events & Courses */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ color: theme.colors.textPrimary }}
        >
          <span style={{ backgroundColor: "#098D8A", width: "4px", height: "16px", display: "inline-block", borderRadius: "2px" }}></span>
          Events & Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Events"
            value={stats?.events?.totalEvents || 0}
            subtitle={`${stats?.events?.upcomingEvents || 0} upcoming, ${stats?.events?.liveEvents || 0} live`}
            theme={theme}
          />
          <StatCard
            title="Total Courses"
            value={stats?.courses?.totalCourses || 0}
            subtitle={`${stats?.courses?.featuredCourses || 0} featured`}
            theme={theme}
          />
          <StatCard
            title="Course Enrollments"
            value={stats?.courses?.totalEnrollments || 0}
            theme={theme}
          />
          <StatCard
            title="Tickets Sold"
            value={stats?.finance?.totalTicketsSold || 0}
            theme={theme}
          />
        </div>
      </div>

      {/* Revenue Statistics */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ color: theme.colors.textPrimary }}
        >
          <span style={{ backgroundColor: "#098D8A", width: "4px", height: "16px", display: "inline-block", borderRadius: "2px" }}></span>
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Revenue"
            value={`₮${(stats?.finance?.totalRevenue || 0).toLocaleString()}`}
            theme={theme}
          />
          <StatCard
            title="Total Commission"
            value={`₮${(stats?.finance?.totalCommission || 0).toLocaleString()}`}
            theme={theme}
          />
        </div>
      </div>

      {/* Support & Administration */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold mb-4 flex items-center gap-2"
          style={{ color: theme.colors.textPrimary }}
        >
          <span style={{ backgroundColor: "#098D8A", width: "4px", height: "16px", display: "inline-block", borderRadius: "2px" }}></span>
          Support & Administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tickets"
            value={stats?.tickets?.totalTickets || 0}
            subtitle={`${stats?.tickets?.resolvedTickets || 0} resolved`}
            theme={theme}
          />
          <StatCard
            title="Pending Tickets"
            value={stats?.tickets?.pendingTickets || 0}
            theme={theme}
          />
          <StatCard
            title="Pending Verifications"
            value={stats?.verifications?.pendingCount || 0}
            subtitle={`${stats?.verifications?.rejectedCount || 0} rejected`}
            theme={theme}
          />
          <StatCard
            title="Pending Payouts"
            value={stats?.payouts?.pendingCount || 0}
            subtitle={`₮${(stats?.payouts?.pendingAmount || 0).toLocaleString()}`}
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}
