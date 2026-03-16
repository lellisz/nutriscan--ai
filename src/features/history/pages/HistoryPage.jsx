import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import * as db from "../../../lib/db";

const T = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  surface2: "#F7F7FA",
  border: "#E5E5EA",
  text: "#1C1C1E",
  text2: "#636366",
  text3: "#AEAEB2",
  blue: "#007AFF",
  green: "#34C759",
  r: "18px",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await db.listScanHistory(user.id, 50);
      setScans(data || []);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoading(false);
    }
  }

  const groupedScans = scans.reduce((acc, scan) => {
    const date = new Date(scan.scanned_at).toLocaleDateString("pt-BR");
    if (!acc[date]) acc[date] = [];
    acc[date].push(scan);
    return acc;
  }, {});

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1>Histórico de Análises</h1>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "8px 16px",
            background: T.surface2,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          ← Voltar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: `3px solid ${T.blue}30`,
            borderTop: `3px solid ${T.blue}`,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto",
          }} />
        </div>
      ) : scans.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: T.text2 }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
          <div style={{ fontSize: "14px" }}>Nenhuma análise ainda. Comece a escanear alimentos!</div>
        </div>
      ) : (
        Object.entries(groupedScans).map(([date, dateScan]) => (
          <div key={date} style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: T.text3, marginBottom: "12px", textTransform: "uppercase" }}>
              {date}
            </div>
            {dateScan.map((scan) => (
              <div
                key={scan.id}
                style={{
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                  borderRadius: T.r,
                  padding: "16px",
                  marginBottom: "12px",
                  boxShadow: T.shadow,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>{scan.food_name || "Alimento desconhecido"}</div>
                  <span style={{ fontSize: "12px", color: T.text2 }}>
                    {new Date(scan.scanned_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ background: T.surface2, padding: "8px", borderRadius: "8px", textAlign: "center", fontSize: "12px" }}>
                    <div style={{ fontWeight: 700, color: T.blue }}>{scan.calories}</div>
                    <div style={{ color: T.text3, fontSize: "10px" }}>kcal</div>
                  </div>
                  <div style={{ background: T.surface2, padding: "8px", borderRadius: "8px", textAlign: "center", fontSize: "12px" }}>
                    <div style={{ fontWeight: 700, color: T.green }}>{scan.protein}g</div>
                    <div style={{ color: T.text3, fontSize: "10px" }}>P</div>
                  </div>
                  <div style={{ background: T.surface2, padding: "8px", borderRadius: "8px", textAlign: "center", fontSize: "12px" }}>
                    <div style={{ fontWeight: 700 }}>{scan.carbs}g</div>
                    <div style={{ color: T.text3, fontSize: "10px" }}>C</div>
                  </div>
                </div>
                {scan.ai_tip && (
                  <div style={{ fontSize: "12px", color: T.text2, borderTop: `1px solid ${T.border}`, paddingTop: "8px", marginTop: "8px" }}>
                    {scan.ai_tip}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
