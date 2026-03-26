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
          background: "var(--ns-accent-bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "var(--ns-shadow-lg)",
          border: "0.5px solid rgba(45,143,94,0.18)",
        }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <path d="M26 8C16 8 8 16.5 8 27c0 8 4.5 14.5 12 17 1.5-6.5 4.5-12.5 10-15.5-4 4.5-6 10.5-6 15.5C32 43 38 37 40 30c2-10.5-5-22-14-22z"
              fill="var(--ns-accent)" />
            <path d="M26 44c0-7 3-14.5 8-19"
              stroke="var(--ns-accent-dim)" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 style={{
          margin: "0 0 6px", fontSize: "var(--ns-text-2xl)", fontWeight: 700,
          letterSpacing: -0.8, color: "var(--ns-text-primary)",
        }}>Praxis Nutri</h1>
        <p style={{
          margin: 0, fontSize: "var(--ns-text-base)", color: "var(--ns-text-secondary)",
          fontWeight: "var(--ns-weight-medium)",
        }}>An&aacute;lise inteligente de alimentos</p>
      </div>
    </div>
  );
}
