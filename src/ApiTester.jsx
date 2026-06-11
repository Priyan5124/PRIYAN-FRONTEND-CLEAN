import React, { useState } from "react";
import axios from "axios";

export default function ApiTester({ apiKeys }) {
    const [endpoint, setEndpoint] = useState("/api/demo");
    const [method, setMethod] = useState("GET");
    const [body, setBody] = useState("{}");
    const [response, setResponse] = useState("");
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);

    const selectedKey = apiKeys?.[0]?.key || "";

    const sendRequest = async () => {
        try {
            setLoading(true);

            const config = {
                method,
                url: `https://priyan-api-1.onrender.com${endpoint}`,
                headers: {
                    "x-api-key": selectedKey,
                    "Content-Type": "application/json",
                },
            };

            if (method !== "GET") {
                config.data = JSON.parse(body);
            }

            const res = await axios(config);

            setStatus(res.status);
            setResponse(JSON.stringify(res.data, null, 2));
        } catch (err) {
            setStatus(err.response?.status || 500);

            setResponse(
                JSON.stringify(
                    err.response?.data || { message: err.message },
                    null,
                    2
                )
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tester-panel">
            <div className="tester-header">
                <h2>API Tester</h2>
                <p>Test your APIs directly from dashboard</p>
            </div>

            <div className="tester-controls">
                <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>DELETE</option>
                </select>

                <input
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/demo"
                />

                <button onClick={sendRequest}>
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>

            <div className="tester-key">
                <strong>Using API Key:</strong>
                <code>{selectedKey || "No API key found"}</code>
            </div>

            {method !== "GET" && (
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder='{"name":"Priyan"}'
                />
            )}

            <div className="tester-response">
                <div className="response-top">
                    <strong>Response</strong>

                    {status && (
                        <span className={status < 400 ? "success" : "error"}>
                            Status: {status}
                        </span>
                    )}
                </div>

                <pre>{response || "No response yet"}</pre>
            </div>
        </div>
    );
}