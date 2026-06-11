import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminPanel from "./AdminPanel";
import ApiTester from "./ApiTester";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import {
  FiHome,
  FiKey,
  FiActivity,
  FiCreditCard,
  FiUsers,
  FiBell,
  FiLogOut,
  FiSearch,
  FiMenu,

} from "react-icons/fi";

const api = axios.create({
  baseURL: "https://priyan-api-1.onrender.com"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [usage, setUsage] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true);

  const [authMode, setAuthMode] = useState("login");
  const [message, setMessage] = useState("");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [keyLabel, setKeyLabel] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");

  const plans = [
    { plan: "free", requestLimit: 100, price: 0 },
    { plan: "basic", requestLimit: 1000, price: 9.99 },
    { plan: "pro", requestLimit: 10000, price: 29.99 },
    { plan: "premium", requestLimit: 100000, price: 99.99 },
  ];

  useEffect(() => {
    if (token) loadDashboard();
  }, [token]);

  const loadDashboard = async () => {
    try {
      const meRes = await api.get("/api/auth/me");
      setUser(meRes.data);

      if (meRes.data?.role === "admin") {
        setApiKeys([]);
        setUsage([]);
        setSubscription(null);
        setSelectedPlan("free");
        return;
      }

      const [keysRes, usageRes, subRes] = await Promise.all([
        api.get("/api/keys/mine"),
        api.get("/api/usage/mine"),
        api.get("/api/subscriptions/mine"),
      ]);

      setApiKeys(keysRes.data || []);
      setUsage(usageRes.data || []);
      setSubscription(subRes.data || null);
      setSelectedPlan(subRes.data?.plan || "free");
    } catch (err) {
      logout();
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleAuthChange = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const register = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/api/auth/register", authForm);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setMessage("Registration successful");
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await api.post("/api/auth/login", {
        email: authForm.email,
        password: authForm.password,
      });

      if (authMode === "admin" && res.data.role !== "admin") {
        setMessage("This is not an admin account");
        return;
      }

      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setMessage("Login successful");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setApiKeys([]);
    setUsage([]);
    setSubscription(null);
    setAuthMode("login");
  };

  const generateApiKey = async () => {
    setLoading(true);
    setMessage("");
    try {
      await api.post("/api/keys/generate", { label: keyLabel || "Default Key" });
      setKeyLabel("");
      await loadDashboard();
      setMessage("API key generated");
    } catch (err) {
      setMessage(err.response?.data?.message || "Key generation failed");
    } finally {
      setLoading(false);
    }
  };

  const revokeKey = async (id) => {
    try {
      await api.delete(`/api/keys/${id}`);
      await loadDashboard();
      setMessage("API key revoked");
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not revoke key");
    }
  };

  const payForPlan = async (plan) => {
    try {
      const ok = await loadRazorpayScript();
      if (!ok) {
        alert("Razorpay SDK failed to load");
        return;
      }

      const orderRes = await api.post("/api/payments/create-order", { plan });

      if (!orderRes.data?.orderId) {
        throw new Error("orderId missing from backend response");
      }

      const options = {
        key: orderRes.data.keyId,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        name: "API Monetization Portal",
        description: `${plan} subscription`,
        order_id: orderRes.data.orderId,
        handler: async function (response) {
          await api.post("/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan,
          });

          alert("Payment successful");
          loadDashboard();
        },
        modal: {
          ondismiss: function () {
            console.log("Checkout closed by user");
          },
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.error("Payment failed event:", response);
        alert("Payment failed");
      });

      rzp.open();
    } catch (err) {
      console.error("Payment flow error:", err);
      alert(err.response?.data?.message || err.message || "Payment failed");
    }
  };

  const chartData = useMemo(() => {
    const grouped = {};

    usage.forEach((item) => {
      const date = new Date(item.createdAt).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
      name: date,
      requests: count,
    }));
  }, [usage]);

  const totalKeys = apiKeys.length;
  const totalUsage = usage.length;
  const currentPlan = subscription?.plan || "free";
  const dailyLimit = subscription?.requestLimit || 100;
  const activeKeys = apiKeys.filter((key) => key.status === "active").length;

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-badge">API</div>
            <div>
              <h1>
                {authMode === "admin"
                  ? "Admin Login"
                  : authMode === "register"
                    ? "Register"
                    : "Developer Portal"}
              </h1>
              <p>Secure APIs, usage control, monetization</p>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "tab active" : "tab"}
              onClick={() => setAuthMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "tab active" : "tab"}
              onClick={() => setAuthMode("register")}
              type="button"
            >
              Register
            </button>
            <button
              className={authMode === "admin" ? "tab active" : "tab"}
              onClick={() => setAuthMode("admin")}
              type="button"
            >
              Admin Login
            </button>
          </div>

          <form
            onSubmit={authMode === "register" ? register : login}
            className="auth-form"
          >
            {authMode === "register" && (
              <input
                name="name"
                placeholder="Full name"
                value={authForm.name}
                onChange={handleAuthChange}
              />
            )}
            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={authForm.email}
              onChange={handleAuthChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={handleAuthChange}
            />
            <button className="primary-btn" type="submit" disabled={loading}>
              {loading
                ? "Processing..."
                : authMode === "register"
                  ? "Create account"
                  : authMode === "admin"
                    ? "Admin sign in"
                    : "Sign in"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    );
  }

  if (user?.role === "admin") {
    return <AdminPanel onLogout={logout} />;
  }

  return (
    <div className="dashboard-shell">
      <aside className={menuOpen ? "sidebar open" : "sidebar"}>
        <div className="sidebar-top">
          <div className="logo">
            <span>AP</span>
          </div>
          <div>
            <h2>Portal</h2>
            <p>Monetization Suite</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <a href="#overview" className="nav-item active">
            <FiHome /> Overview
          </a>
          <a href="#keys" className="nav-item">
            <FiKey /> API Keys
          </a>
          <a href="#usage" className="nav-item">
            <FiActivity /> Usage
          </a>
          <a href="#subscription" className="nav-item">
            <FiCreditCard /> Subscription
          </a>
          <a href="#team" className="nav-item">
            <FiUsers /> Team
          </a>



        </nav>

        <button className="logout-btn" onClick={logout}>
          <FiLogOut /> Logout
        </button>
      </aside>

      <main className="content">
        <header className="topbar">
          <button
            className="icon-btn mobile-only"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            <FiMenu />
          </button>

          <div className="search-box">
            <FiSearch />
            <input placeholder="Search dashboard..." />
          </div>

          <div className="topbar-actions">
            <button className="icon-btn" type="button">
              <FiBell />
            </button>
            <div className="user-chip">
              <div className="avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <strong>{user?.name || "User"}</strong>
                <p>{user?.plan || "free"} plan</p>
              </div>
            </div>
          </div>
        </header>

        {message && <div className="alert">{message}</div>}

        <section id="overview" className="hero">
          <div>
            <h1>Welcome back, {user?.name || "Developer"}</h1>
            <p>Manage keys, monitor usage, and control billing from one place.</p>
          </div>

          <div className="hero-card">
            <span>Current Plan</span>
            <strong>{currentPlan.toUpperCase()}</strong>
            <p>{dailyLimit} requests/day</p>
          </div>
        </section>

        <section className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon blue">
              <FiKey />
            </div>
            <div>
              <span>Total API Keys</span>
              <h3>{totalKeys}</h3>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon green">
              <FiActivity />
            </div>
            <div>
              <span>Total Requests</span>
              <h3>{totalUsage}</h3>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon purple">
              <FiCreditCard />
            </div>
            <div>
              <span>Subscription</span>
              <h3>{currentPlan}</h3>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon orange">
              <FiUsers />
            </div>
            <div>
              <span>Active Keys</span>
              <h3>{activeKeys}</h3>
            </div>
          </div>
        </section>

        <section className="panel-grid">
          <div className="panel chart-panel">
            <div className="panel-header">
              <div>
                <h2>Usage Analytics</h2>
                <p>Recent API request activity</p>
              </div>
            </div>

            <div className="chart-wrap">
              {chartData.length === 0 ? (
                <div className="empty-state">No usage data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="usageGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopOpacity={0.4} />
                        <stop offset="95%" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      strokeWidth={3}
                      fill="url(#usageGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="panel subscription-panel" id="subscription">
            <div className="panel-header">
              <div>
                <h2>Subscription</h2>
                <p>Upgrade your request limits</p>
              </div>
            </div>

            <div className="plan-list">
              {plans.map((plan) => (
                <div
                  key={plan.plan}
                  className={
                    selectedPlan === plan.plan ? "plan-card selected" : "plan-card"
                  }
                >
                  <label className="plan-left">
                    <input
                      type="radio"
                      name="plan"
                      value={plan.plan}
                      checked={selectedPlan === plan.plan}
                      onChange={(e) => setSelectedPlan(e.target.value)}
                    />
                    <div>
                      <strong>{plan.plan.toUpperCase()}</strong>
                      <p>{plan.requestLimit} requests/day</p>
                      <span>${plan.price}</span>
                    </div>
                  </label>

                  <button
                    className="plan-pay-btn"
                    onClick={() => payForPlan(plan.plan)}
                    disabled={loading}
                    type="button"
                  >
                    Pay ₹
                    {plan.plan === "free"
                      ? 0
                      : plan.plan === "basic"
                        ? 999
                        : plan.plan === "pro"
                          ? 2999
                          : 9999}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="panel-grid lower">
          <div className="panel" id="keys">
            <div className="panel-header">
              <div>
                <h2>API Keys</h2>
                <p>Create and manage keys</p>
              </div>
            </div>

            <div className="inline-form">
              <input
                placeholder="Key label"
                value={keyLabel}
                onChange={(e) => setKeyLabel(e.target.value)}
              />
              <button
                className="primary-btn"
                onClick={generateApiKey}
                disabled={loading}
                type="button"
              >
                Generate
              </button>
            </div>

            <div className="list">
              {apiKeys.map((key) => (
                <div className="list-item" key={key._id}>
                  <div>
                    <strong>{key.label}</strong>
                    <p>{key.key}</p>
                    <span
                      className={
                        key.status === "active" ? "status active" : "status revoked"
                      }
                    >
                      {key.status}
                    </span>
                  </div>
                  <button className="ghost-btn" onClick={() => revokeKey(key._id)}>
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" id="usage">
            <div className="panel-header">
              <div>
                <h2>Recent Usage</h2>
                <p>Latest API calls</p>
              </div>
            </div>




            <div className="usage-list">
              {usage.slice(0, 8).map((item) => (
                <div className="usage-row" key={item._id}>
                  <div>
                    <strong>{item.endpoint}</strong>
                    <p>{item.method}</p>
                  </div>
                  <div className="usage-meta">
                    <span>HTTP {item.statusCode}</span>
                    <small>{new Date(item.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <ApiTester apiKeys={apiKeys} />
        </section>
      </main>
    </div>
  );
}