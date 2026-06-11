import React, { useState } from "react";

export default function Settings() {
    const [darkMode, setDarkMode] = useState(
        document.body.classList.contains("dark")
    );
    const toggleDarkMode = () => {
        const next = !darkMode;

        setDarkMode(next);

        if (next) {
            document.body.classList.add("dark");
        } else {
            document.body.classList.remove("dark");
        }
    };
    const [notifications, setNotifications] = useState(true);

    const [profile, setProfile] = useState({
        name: "Priyan",
        email: "priyan@example.com",
    });

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
    });

    const handleProfileSave = () => {
        alert("Profile updated successfully");
    };

    const handlePasswordChange = () => {
        alert("Password changed successfully");
    };

    return (
        <div className="settings-page">
            <div className="settings-grid">

                {/* Profile */}
                <div className="settings-card">
                    <h2>Profile Settings</h2>

                    <label>Name</label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                        }
                    />

                    <label>Email</label>
                    <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                            setProfile({ ...profile, email: e.target.value })
                        }
                    />

                    <button onClick={handleProfileSave}>
                        Save Profile
                    </button>
                </div>

                {/* Password */}
                <div className="settings-card">
                    <h2>Security</h2>

                    <label>Current Password</label>
                    <input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) =>
                            setPasswords({
                                ...passwords,
                                currentPassword: e.target.value,
                            })
                        }
                    />

                    <label>New Password</label>
                    <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) =>
                            setPasswords({
                                ...passwords,
                                newPassword: e.target.value,
                            })
                        }
                    />

                    <button onClick={handlePasswordChange}>
                        Change Password
                    </button>
                </div>

                {/* Appearance */}
                <div className="settings-card">
                    <h2>Appearance</h2>

                    <div className="setting-toggle">
                        <span>Dark Mode</span>

                        <button
                            className={darkMode ? "toggle active" : "toggle"}
                            onClick={() => setDarkMode(!darkMode)}
                        >
                            {darkMode ? "ON" : "OFF"}
                        </button>
                    </div>
                </div>

                {/* Notifications */}
                <div className="settings-card">
                    <h2>Notifications</h2>

                    <div className="setting-toggle">
                        <span>Email Notifications</span>

                        <button
                            className={notifications ? "toggle active" : "toggle"}
                            onClick={() => setNotifications(!notifications)}
                        >
                            {notifications ? "ON" : "OFF"}
                        </button>
                    </div>
                </div>

                {/* Subscription */}
                <div className="settings-card">
                    <h2>Subscription</h2>

                    <div className="subscription-box">
                        <h3>Pro Plan</h3>
                        <p>10000 API requests/day</p>

                        <button className="upgrade-btn">
                            Upgrade Plan
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}