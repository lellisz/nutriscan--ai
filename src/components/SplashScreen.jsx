import React, { useState, useEffect } from "react";

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1800);
    const t2 = setTimeout(() => onFinish(), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <div className={`ns-splash ${fadeOut ? "ns-splash-fade-out" : ""}`}>
      <div className="ns-flex-col ns-items-center ns-gap-3 animate-scale-in">
        <div style={{
          width: 96, height: 96, borderRadius: "var(--ns-radius-xl)",
          background: "linear-gradient(135deg, var(--ns-text-secondary), var(--ns-text-muted))",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "var(--ns-shadow-lg)",
        }}>
          <span style={{ fontSize: 48 }}>{"\u{1F34E}"}</span>
        </div>
        <h1 style={{
          margin: "0 0 6px", fontSize: "var(--ns-text-2xl)", fontWeight: 900,
          letterSpacing: -0.8, color: "var(--ns-text-primary)",
        }}>NutriScan</h1>
        <p style={{
          margin: 0, fontSize: "var(--ns-text-base)", color: "var(--ns-text-secondary)",
          fontWeight: "var(--ns-weight-medium)",
        }}>An&aacute;lise inteligente de alimentos</p>
      </div>
    </div>
  );
}
