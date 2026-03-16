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
  orange: "#FF9500",
  red: "#FF3B30",
  r: "18px",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
};

function greet() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [goals, setGoals] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const profileData = await db.getProfile(user.id);
      const goalsData = await db.getDailyGoals(user.id);
      const scansData = await db.listScanHistory(user.id, 5);

      setProfile(profileData);
      setGoals(goalsData);
      setScans(scansData || []);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toLocaleDateString("pt-BR");
  const todayScans = scans.filter((s) => new Date(s.scanned_at).toLocaleDateString("pt-BR") === today);
  const totalCalories = todayScans.reduce((sum, s) => sum + (s.calories || 0), 0);
  const totalProtein = todayScans.reduce((sum, s) => sum + (s.protein || 0), 0);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", minHeight: "100vh", paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h1 style={{ margin: "0 0 4px 0" }}>{greet()}</h1>
          <div style={{ fontSize: "14px", color: T.text2 }}>{profile?.full_name || "Usuário"}</div>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate("/signin");
          }}
          style={{
            padding: "8px 16px",
            background: T.surface2,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          Sair
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
      ) : (
        <>
          {goals && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "20px", marginBottom: "20px", boxShadow: T.shadow }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: T.text3, marginBottom: "12px", textTransform: "uppercase" }}>Metas de Hoje</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                <div style={{ background: T.blue + "08", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: T.blue }}>{goals.calories}</div>
                  <div style={{ fontSize: "12px", color: T.text2 }}>kcal</div>
                  <div style={{ fontSize: "11px", color: T.text3, marginTop: "4px" }}>Consumido: {totalCalories}</div>
                </div>
                <div style={{ background: T.green + "08", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: T.green }}>{goals.protein}g</div>
                  <div style={{ fontSize: "12px", color: T.text2 }}>Proteína</div>
                  <div style={{ fontSize: "11px", color: T.text3, marginTop: "4px" }}>Consumida: {totalProtein}g</div>
                </div>
              </div>
              <div style={{ background: T.orange + "08", padding: "12px", borderRadius: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: T.orange }}>{goals.water}ml</div>
                <div style={{ fontSize: "12px", color: T.text2 }}>Meta de água</div>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={() => navigate("/scan")}
              style={{
                padding: "16px",
                background: T.blue,
                color: "white",
                border: "none",
                borderRadius: T.r,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📸 Novo Scan
            </button>
            <button
              onClick={() => navigate("/history")}
              style={{
                padding: "16px",
                background: T.surface2,
                border: "none",
                borderRadius: T.r,
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              📊 Histórico
            </button>
          </div>

          {todayScans.length > 0 && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.r, padding: "20px", boxShadow: T.shadow }}>
              <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Analisados Hoje</div>
              {todayScans.map((scan) => (
                <div key={scan.id} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: "24px", marginRight: "12px" }}>{scan.food_name ? "🍽️" : "❓"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>{scan.food_name}</div>
                    <div style={{ fontSize: "12px", color: T.text2 }}>{scan.calories} kcal • {scan.protein}g proteína</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
