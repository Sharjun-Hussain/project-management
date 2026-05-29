"use client";

import React from "react";
import {
  DollarSign,
  ShoppingBag,
  Users,
  TrendingUp,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal, 
  LayoutDashboard
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart
} from "recharts";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher as globalFetcher } from "../../lib/fetcher";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Package } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useMemo } from "react";

// --- COMPONENTS ---

const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    delivered: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    shipped: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    paid: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  };
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${styles[status?.toLowerCase()] || "bg-gray-100 text-gray-700"
        }`}
    >
      {status}
    </span>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [revenuePeriod, setRevenuePeriod] = useState("month");

  const fetcher = (url) => globalFetcher(url, session?.accessToken);

  const { data: statsRes, error: statsError, isLoading: statsLoading } = useSWR(
    session?.accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dashboard/stats`, session.accessToken] : null,
    ([url]) => fetcher(url)
  );

  const { data: ordersRes, error: ordersError, isLoading: ordersLoading } = useSWR(
    session?.accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dashboard/recent-orders`, session.accessToken] : null,
    ([url]) => fetcher(url)
  );

  const { data: trendsRes, error: trendsError, isLoading: trendsLoading } = useSWR(
    session?.accessToken ? [`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/dashboard/revenue-trends?period=${revenuePeriod}`, session.accessToken, revenuePeriod] : null,
    ([url]) => fetcher(url)
  );

  const stats = statsRes?.data || null;
  const recentOrders = ordersRes?.data || [];
  const trendsData = useMemo(() => {
    if (!trendsRes?.data) return [];
    return trendsRes.data.map(item => ({
      name: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      sales: parseFloat(item.total || 0),
      orders: parseInt(item.total_orders || 0)
    }));
  }, [trendsRes]);

  const orderDistribution = stats?.order_distribution || [];
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const kpis = [
    {
      title: "Total Revenue",
      value: `Rs. ${stats?.revenue?.total?.toLocaleString() || "0"}`,
      change: `${stats?.revenue?.growth_rate >= 0 ? "+" : ""}${stats?.revenue?.growth_rate || 0}%`,
      trend: stats?.revenue?.growth_rate >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Orders",
      value: stats?.orders?.total || "0",
      change: "Lifetime",
      trend: "up",
      icon: ShoppingBag,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "New Customers",
      value: stats?.customers?.new_30_days || "0",
      change: "Last 30 days",
      trend: "up",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Low Stock Items",
      value: stats?.inventory?.low_stock_count || "0",
      change: "Warning",
      trend: "down",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  if (statsLoading || ordersLoading) {
    return (
      <div className="space-y-6 px-8 py-6">
        {/* HEADER SKELETON */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4 items-stretch">
            <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"></div>
            <div className="flex flex-col justify-center py-1 space-y-2">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* KPI GRID SKELETON */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-11 h-11 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
                <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"></div>
              </div>
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-3"></div>
              <div className="h-7 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* CHARTS SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-[400px] animate-pulse flex flex-col">
            <div className="h-6 w-40 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-[400px] animate-pulse flex flex-col">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-8 py-6">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex gap-4 items-stretch">
            <div className="w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex flex-col items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-800/50 shadow-sm py-2">
              <LayoutDashboard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex flex-col justify-center py-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back, here's what's happening today.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${kpi.trend === "up"
                    ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  }`}
              >
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {kpi.change}
              </div>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">
              {kpi.title}
            </h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* 3. CHART & RECENT ORDERS SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE CHART (2/3 Width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Revenue Analytics</h3>
            <select
              value={revenuePeriod}
              onChange={(e) => setRevenuePeriod(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2 py-1 outline-none dark:text-slate-300 cursor-pointer"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 1 Year</option>
            </select>
          </div>

          <div className="h-[300px] w-full relative">
            {trendsLoading && (
              <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={(val) => `Rs. ${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", color: "var(--tooltip-text, #000)" }}
                  formatter={(value, name) => [name === "sales" ? `Rs. ${value.toLocaleString()}` : value, name === "sales" ? "Revenue" : "Orders"]}
                />
                <Area yAxisId="left" type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ORDER VOLUME CHART (1/3 Width) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white">Daily Orders</h3>
          </div>
          <div className="h-[300px] w-full relative">
            {trendsLoading && (
              <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-700" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} formatter={(value) => [value, "Orders"]} />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ORDER STATUS DISTRIBUTION PIE CHART */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Order Status</h3>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            {statsLoading && (
              <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center rounded-xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {orderDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Orders"]} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Orders</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{recentOrders.length} Recent</span>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const id = order.id ?? order.order_id;
                      if (id) {
                        router.push(`/app/orders?order_id=${id}`);
                      } else {
                        router.push(`/app/orders?order_number=${order.order_number}`);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {order.order_number}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {order.date ? new Date(order.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }) : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Rs. {order.amount?.toLocaleString()}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500">No recent orders</p>
                </div>
              )}
            </div>
          </div>
          <Link href="/app/orders" className="mt-4 w-full py-2 text-sm font-medium text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30">
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
