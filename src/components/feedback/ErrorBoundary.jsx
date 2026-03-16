import React from "react";
import { analytics } from "../../lib/analytics";
import { logger } from "../../lib/logger";

const T = {
  bg: "#F2F2F7",
  surface: "#FFFFFF",
  border: "#E5E5EA",
  text: "#1C1C1E",
  red: "#FF3B30",
  orange: "#FF9500",
  shadow: "0 2px 24px rgba(0,0,0,0.07)",
  r: "18px",
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    // Log to error tracking service (Sentry)
    logger.error("ErrorBoundary caught", {
      error: error.toString(),
      componentStack: errorInfo.componentStack.substring(0, 200),
    });
    analytics.trackErrorBoundary(errorInfo.componentStack);
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            maxWidth: "600px",
            margin: "0 auto",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: T.bg,
          }}
        >
          <div
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: T.r,
              padding: "30px",
              textAlign: "center",
              boxShadow: T.shadow,
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h1 style={{ margin: "0 0 12px 0", color: T.red }}>Algo deu errado</h1>
            <p style={{ color: "#636366", marginBottom: "20px" }}>
              Desculpe, encontramos um erro inesperado. Tente recarregar a página.
            </p>

            {process.env.NODE_ENV === "development" && (
              <details
                style={{
                  margin: "20px 0",
                  padding: "12px",
                  background: T.border + "30",
                  borderRadius: "8px",
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#636366",
                  fontFamily: "monospace",
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                  Detalhes (Development Only)
                </summary>
                <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", marginTop: "12px" }}>
                  {this.state.error?.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "12px 24px",
                background: T.red,
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
