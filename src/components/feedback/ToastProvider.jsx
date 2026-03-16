import React, { createContext, useContext, useCallback } from "react";

const ToastContext = createContext(null);

const T = {
  surface: "#FFFFFF",
  border: "#E5E5EA",
  text: "#1C1C1E",
  text2: "#636366",
  text3: "#AEAEB2",
  blue: "#007AFF",
  green: "#34C759",
  orange: "#FF9500",
  red: "#FF3B30",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
  r: "18px",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = React.useState([]);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);

        return () => clearTimeout(timer);
      }
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = {
    addToast,
    removeToast,
    success: (msg, duration) => addToast(msg, "success", duration),
    error: (msg, duration) => addToast(msg, "error", duration),
    info: (msg, duration) => addToast(msg, "info", duration),
    warning: (msg, duration) => addToast(msg, "warning", duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
      }}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const bgColor = {
    success: "#34C759",
    error: "#FF3B30",
    info: "#007AFF",
    warning: "#FF9500",
  }[toast.type] || T.blue;

  return (
    <div
      style={{
        background: bgColor,
        color: "white",
        padding: "14px 16px",
        borderRadius: "12px",
        boxShadow: T.shadow,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "14px",
        fontWeight: 500,
        animation: "slideIn 0.3s ease-out",
      }}
    >
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onRemove}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "none",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: 600,
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
