import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    FiUsers,
    FiKey,
    FiActivity,
    FiCreditCard,
    FiLogOut,
    FiRefreshCcw,
    FiShield,
} from "react-icons/fi";

const api = axios.create({
    baseURL: "https://priyan-api-1.onrender.com",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default function AdminPanel({ onLogout }) {
    const [users, setUsers] = useState([]);
    const [keys, setKeys] = useState([]);
    const [usage, setUsage] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const loadAdminData = async () => {
        try {
            setLoading(true);
            setMessage("");

            const [usersRes, keysRes, usageRes, subsRes] = await Promise.all([
                api.get("/api/admin/users"),
                api.get("/api/admin/keys"),
                api.get("/api/admin/usage"),
                api.get("/api/admin/subscriptions"),
            ]);

            setUsers(usersRes.data || []);
            setKeys(keysRes.data || []);
            setUsage(usageRes.data || []);
            setSubscriptions(subsRes.data || []);
        } catch (err) {
            setMessage(err.response?.data?.message || "Admin data load failed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    const stats = [
        {
            label: "Total Users",
            value: users.length,
            icon: <FiUsers />,
            tone: "blue",
        },
        {
            label: "API Keys",
            value: keys.length,
            icon: <FiKey />,
            tone: "purple",
        },
        {
            label: "Usage Logs",
            value: usage.length,
            icon: <FiActivity />,
            tone: "green",
        },
        {
            label: "Subscriptions",
            value: subscriptions.length,
            icon: <FiCreditCard />,
            tone: "orange",
        },
    ];

    return (
        <div className="admin-shell">
            <div className="admin-bg-blur admin-blur-1" />
            <div className="admin-bg-blur admin-blur-2" />

            <div className="admin-card">
                <header className="admin-topbar">
                    <div className="admin-brand">
                        <div className="admin-brand-icon">
                            <FiShield />
                        </div>
                        <div>
                            <h1>Admin Console</h1>
                            <p>Users, keys, usage and billing control center</p>
                        </div>
                    </div>

                    <div className="admin-actions">
                        <button className="admin-refresh-btn" onClick={loadAdminData} disabled={loading}>
                            <FiRefreshCcw />
                            {loading ? "Refreshing..." : "Refresh"}
                        </button>

                        <button className="admin-logout-btn" onClick={onLogout}>
                            <FiLogOut />
                            Logout
                        </button>
                    </div>
                </header>

                {message && <div className="admin-alert">{message}</div>}

                <section className="admin-stats-grid">
                    {stats.map((stat) => (
                        <div key={stat.label} className={`admin-stat-card ${stat.tone}`}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div>
                                <span>{stat.label}</span>
                                <h3>{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </section>

                <div className="admin-panels">
                    <section className="admin-panel">
                        <div className="panel-head">
                            <h2>Users</h2>
                            <span>{users.length} records</span>
                        </div>
                        <div className="admin-list">
                            {users.map((u) => (
                                <div className="admin-row" key={u._id}>
                                    <div>
                                        <strong>{u.name}</strong>
                                        <p>{u.email}</p>
                                    </div>
                                    <div className="row-meta">
                                        <span className={`badge ${u.role}`}>{u.role}</span>
                                        <span className="badge plan">{u.plan}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="admin-panel">
                        <div className="panel-head">
                            <h2>API Keys</h2>
                            <span>{keys.length} records</span>
                        </div>
                        <div className="admin-list">
                            {keys.map((k) => (
                                <div className="admin-row" key={k._id}>
                                    <div>
                                        <strong>{k.label}</strong>
                                        <p>{k.key}</p>
                                    </div>
                                    <div className="row-meta">
                                        <span className={`badge ${k.status}`}>{k.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="admin-panel">
                        <div className="panel-head">
                            <h2>Usage Logs</h2>
                            <span>{usage.length} records</span>
                        </div>
                        <div className="admin-list">
                            {usage.map((u) => (
                                <div className="admin-row" key={u._id}>
                                    <div>
                                        <strong>{u.endpoint}</strong>
                                        <p>
                                            {u.method} • {new Date(u.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="row-meta">
                                        <span className="badge active">{u.statusCode}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="admin-panel">
                        <div className="panel-head">
                            <h2>Subscriptions</h2>
                            <span>{subscriptions.length} records</span>
                        </div>
                        <div className="admin-list">
                            {subscriptions.map((s) => (
                                <div className="admin-row" key={s._id}>
                                    <div>
                                        <strong>{s.user?.name || "User"}</strong>
                                        <p>{s.user?.email || ""}</p>
                                    </div>
                                    <div className="row-meta">
                                        <span className="badge plan">{s.plan}</span>
                                        <span className="badge active">{s.requestLimit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}