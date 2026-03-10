import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = "https://212sbot.up.railway.app/api";

export default function Klipciler({ token, streamerId }) {
  const [clipciler, setClipciler] = useState([]);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchClipciler() {
    if (!streamerId) return;

    try {
      const res = await axios.get(
        `${API_BASE}/clipciler/${streamerId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setClipciler(res.data || []);
    } catch (err) {
      console.error("Liste alınamadı:", err.response?.data || err.message);
    }
  }

  async function addClipci(e) {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      await axios.post(
        `${API_BASE}/clipciler/add`,
        {
          streamer_id: streamerId,
          username: username.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUsername("");
      await fetchClipciler();
    } catch (err) {
      console.error("Ekleme hatası:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteClipci(id) {
    setLoading(true);
    try {
      await axios.delete(
        `${API_BASE}/clipciler/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      await fetchClipciler();
    } catch (err) {
      console.error("Silme hatası:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && streamerId) {
      fetchClipciler();
    }
  }, [token, streamerId]);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        marginTop: "20px",
        background: "#fff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Klipçiler</h3>

      <form onSubmit={addClipci}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Kullanıcı adı"
          style={{
            padding: "8px",
            marginRight: "8px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 12px",
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Ekle
        </button>
      </form>

      <div style={{ marginTop: "15px" }}>
        {clipciler.length === 0 ? (
          <div>Henüz klipçi yok.</div>
        ) : (
          clipciler.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #eee",
              }}
            >
              <span>{c.username}</span>
              <button
                onClick={() => deleteClipci(c.id)}
                style={{
                  background: "#b00020",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  cursor: "pointer",
                }}
              >
                Sil
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}