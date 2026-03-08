import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://212sbot.up.railway.app/api";

export default function AdminWsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [adminId, setAdminId] = useState(localStorage.getItem("admin_id") || "");

  const [streamerId, setStreamerId] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [wsPassword, setWsPassword] = useState("");

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  function addLog(message, type = "info") {
    const time = new Date().toLocaleTimeString("tr-TR");
    setLogs((prev) => [
      { id: Date.now() + Math.random(), time, message, type },
      ...prev,
    ]);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/admin/login`, {
        username,
        password,
      });

      const newToken = res.data.token;
      const newAdminId = res.data.admin_id;

      localStorage.setItem("admin_token", newToken);
      localStorage.setItem("admin_id", newAdminId);

      setToken(newToken);
      setAdminId(newAdminId);

      addLog("Admin girişi başarılı.", "success");
    } catch (err) {
      addLog(err.response?.data?.error || "Login başarısız.", "error");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_id");
    setToken("");
    setAdminId("");
    setStatus(null);
    addLog("Çıkış yapıldı.", "info");
  }

  async function fetchStatus(customStreamerId) {
    const sid = customStreamerId || streamerId;
    if (!sid) {
      addLog("Durum sorgulamak için streamer id gir.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/ws/status/${sid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStatus(res.data);

      if (res.data.connected) {
        addLog(
          `Bağlantı aktif. Host=${res.data.host} Port=${res.data.port}`,
          "success"
        );
      } else {
        addLog("Bağlantı aktif değil.", "info");
      }
    } catch (err) {
      addLog(err.response?.data?.error || "Durum alınamadı.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function connectWs(e) {
    e.preventDefault();

    if (!streamerId || !host || !port || !wsPassword) {
      addLog("Streamer ID, host, port ve websocket şifresi zorunlu.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/ws/connect`,
        {
          streamer_id: streamerId,
          host,
          port: Number(port),
          password: wsPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        addLog("WebSocket bağlantı isteği başarılı.", "success");
      } else {
        addLog("WebSocket bağlantısı başarısız.", "error");
      }

      await fetchStatus(streamerId);
    } catch (err) {
      addLog(err.response?.data?.error || "Bağlantı kurulamadı.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function disconnectWs() {
    if (!streamerId) {
      addLog("Disconnect için streamer id gir.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/ws/disconnect`,
        {
          streamer_id: streamerId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        addLog("WebSocket bağlantısı kapatıldı.", "success");
      } else {
        addLog("Bağlantı kapatılamadı.", "error");
      }

      await fetchStatus(streamerId);
    } catch (err) {
      addLog(err.response?.data?.error || "Disconnect başarısız.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && streamerId) {
      fetchStatus(streamerId);
    }
  }, []);

  const boxStyle = {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    background: "#fff",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    marginBottom: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const buttonStyle = {
    padding: "10px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: "#111",
    color: "#fff",
    marginRight: "8px",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    background: "#666",
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    background: "#b00020",
  };

  if (!token) {
    return (
      <div
        style={{
          maxWidth: "420px",
          margin: "60px auto",
          fontFamily: "Arial, sans-serif",
          padding: "16px",
        }}
      >
        <div style={boxStyle}>
          <h2 style={{ marginTop: 0 }}>Admin Giriş</h2>

          <form onSubmit={handleLogin}>
            <label>Kullanıcı Adı</label>
            <input
              style={inputStyle}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin username"
            />

            <label>Şifre</label>
            <input
              style={inputStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="admin password"
            />

            <button style={buttonStyle} type="submit" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        <div style={boxStyle}>
          <h3 style={{ marginTop: 0 }}>Loglar</h3>
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {logs.length === 0 ? (
              <div>Henüz log yok.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid #eee",
                    color:
                      log.type === "error"
                        ? "#b00020"
                        : log.type === "success"
                        ? "green"
                        : "#333",
                  }}
                >
                  [{log.time}] {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
        padding: "16px",
        background: "#f6f6f6",
      }}
    >
      <div style={boxStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>WebSocket Admin Panel</h2>
            <div style={{ marginTop: "6px", color: "#555" }}>
              Admin ID: {adminId || "-"}
            </div>
          </div>

          <button style={dangerButtonStyle} onClick={logout}>
            Çıkış Yap
          </button>
        </div>
      </div>

      <div style={boxStyle}>
        <h3 style={{ marginTop: 0 }}>Bağlantı Ayarları</h3>

        <form onSubmit={connectWs}>
          <label>Streamer ID</label>
          <input
            style={inputStyle}
            value={streamerId}
            onChange={(e) => setStreamerId(e.target.value)}
            placeholder="örnek: 64329490"
          />

          <label>Host</label>
          <input
            style={inputStyle}
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="örnek: localhost veya 192.168.1.50"
          />

          <label>Port</label>
          <input
            style={inputStyle}
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="örnek: 8081"
          />

          <label>WebSocket Şifresi</label>
          <input
            style={inputStyle}
            type="password"
            value={wsPassword}
            onChange={(e) => setWsPassword(e.target.value)}
            placeholder="uzak websocket auth şifresi"
          />

          <button style={buttonStyle} type="submit" disabled={loading}>
            {loading ? "İşleniyor..." : "Bağlan"}
          </button>

          <button
            style={secondaryButtonStyle}
            type="button"
            onClick={() => fetchStatus()}
            disabled={loading}
          >
            Durum Getir
          </button>

          <button
            style={dangerButtonStyle}
            type="button"
            onClick={disconnectWs}
            disabled={loading}
          >
            Bağlantıyı Kes
          </button>
        </form>
      </div>

      <div style={boxStyle}>
        <h3 style={{ marginTop: 0 }}>Bağlantı Durumu</h3>

        {!status ? (
          <div>Henüz durum alınmadı.</div>
        ) : (
          <div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Bağlı mı:</strong> {status.connected ? "Evet" : "Hayır"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Ready State:</strong>{" "}
              {status.readyState !== undefined ? status.readyState : "-"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Host:</strong> {status.host || "-"}
            </div>
            <div style={{ marginBottom: "8px" }}>
              <strong>Port:</strong> {status.port || "-"}
            </div>
          </div>
        )}
      </div>

      <div style={boxStyle}>
        <h3 style={{ marginTop: 0 }}>Loglar</h3>
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #eee",
            borderRadius: "6px",
            padding: "12px",
            maxHeight: "350px",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {logs.length === 0 ? (
            <div>Henüz log yok.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                  color:
                    log.type === "error"
                      ? "#b00020"
                      : log.type === "success"
                      ? "green"
                      : "#333",
                }}
              >
                [{log.time}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}