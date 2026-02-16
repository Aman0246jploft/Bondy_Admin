import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/theme/hook/useTheme";
import dashboardApi from "../../api/dashboardApi";
import {
  AiOutlineTeam,
  AiOutlineCalendar,
  AiOutlineBook,
  AiOutlineDollar,
  AiOutlineCustomerService,
  AiOutlineCheckCircle,
  AiOutlineCloseCircle,
  AiOutlineClockCircle,
  AiOutlineRise,
  AiOutlineCrown,
  AiOutlineFileProtect,
  AiOutlineWallet,
} from "react-icons/ai";

const StatCard = ({ title, value, subtitle, icon: Icon, color, theme }) => {
  return (
    <div
      className="rounded-lg p-6 shadow-sm border transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: theme.colors.card,
        borderColor: theme.colors.border,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className="text-sm font-medium mb-1"
            style={{ color: theme.colors.textSecondary }}
          >
            {title}
          </p>
          <p
            className="text-3xl font-bold mb-2"
            style={{ color: theme.colors.textPrimary }}
          >
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p
              className="text-xs"
              style={{ color: theme.colors.textMuted }}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
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
            style={{ borderColor: theme.colors.primary }}
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
              backgroundColor: theme.colors.buttonPrimary,
              color: theme.colors.buttonTextOnPrimary,
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
      className="p-6"
      style={{
        backgroundColor: theme.colors.background,
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div className="mb-8">
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
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: theme.colors.textPrimary }}
        >
          User Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={stats?.users?.totalUsers || 0}
            icon={AiOutlineTeam}
            color="#3b82f6"
            theme={theme}
          />
          <StatCard
            title="Customers"
            value={stats?.users?.totalCustomers || 0}
            icon={AiOutlineTeam}
            color="#10b981"
            theme={theme}
          />
          <StatCard
            title="Organizers"
            value={stats?.users?.totalOrganizers || 0}
            icon={AiOutlineCrown}
            color="#f59e0b"
            theme={theme}
          />
        </div>
      </div>

      {/* Events & Courses */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: theme.colors.textPrimary }}
        >
          Events & Courses
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Events"
            value={stats?.events?.totalEvents || 0}
            subtitle={`${stats?.events?.upcomingEvents || 0} upcoming, ${stats?.events?.liveEvents || 0} live`}
            icon={AiOutlineCalendar}
            color="#8b5cf6"
            theme={theme}
          />
          <StatCard
            title="Total Courses"
            value={stats?.courses?.totalCourses || 0}
            subtitle={`${stats?.courses?.featuredCourses || 0} featured`}
            icon={AiOutlineBook}
            color="#ec4899"
            theme={theme}
          />
          <StatCard
            title="Course Enrollments"
            value={stats?.courses?.totalEnrollments || 0}
            icon={AiOutlineRise}
            color="#06b6d4"
            theme={theme}
          />
          <StatCard
            title="Tickets Sold"
            value={stats?.finance?.totalTicketsSold || 0}
            icon={AiOutlineCheckCircle}
            color="#14b8a6"
            theme={theme}
          />
        </div>
      </div>

      {/* Revenue Statistics */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: theme.colors.textPrimary }}
        >
          Revenue Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title="Total Revenue"
            value={`$${(stats?.finance?.totalRevenue || 0).toFixed(2)}`}
            icon={AiOutlineDollar}
            color="#22c55e"
            theme={theme}
          />
          <StatCard
            title="Total Commission"
            value={`$${(stats?.finance?.totalCommission || 0).toFixed(2)}`}
            icon={AiOutlineWallet}
            color="#f97316"
            theme={theme}
          />
        </div>
      </div>

      {/* Support & Administration */}
      <div className="mb-6">
        <h2
          className="text-xl font-semibold mb-4"
          style={{ color: theme.colors.textPrimary }}
        >
          Support & Administration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Tickets"
            value={stats?.tickets?.totalTickets || 0}
            subtitle={`${stats?.tickets?.resolvedTickets || 0} resolved`}
            icon={AiOutlineCustomerService}
            color="#6366f1"
            theme={theme}
          />
          <StatCard
            title="Pending Tickets"
            value={stats?.tickets?.pendingTickets || 0}
            icon={AiOutlineClockCircle}
            color="#f59e0b"
            theme={theme}
          />
          <StatCard
            title="Pending Verifications"
            value={stats?.verifications?.pendingCount || 0}
            subtitle={`${stats?.verifications?.rejectedCount || 0} rejected`}
            icon={AiOutlineFileProtect}
            color="#ef4444"
            theme={theme}
          />
          <StatCard
            title="Pending Payouts"
            value={stats?.payouts?.pendingCount || 0}
            subtitle={`$${(stats?.payouts?.pendingAmount || 0).toFixed(2)}`}
            icon={AiOutlineWallet}
            color="#8b5cf6"
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}
