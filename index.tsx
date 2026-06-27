import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import "./index.css";

function showFatalError(msg: string) {
  document.body.style.background = "#0f172a";
  document.body.innerHTML = `<div style="color:white;padding:2rem;font-family:monospace;white-space:pre-wrap;font-size:13px"><span style="color:#f87171">FATAL ERROR (share with support):</span>\n\n${msg}</div>`;
}

window.addEventListener("error", (e) => showFatalError(e.message + "\n" + (e.error?.stack || "")));
window.addEventListener("unhandledrejection", (e) => showFatalError(String(e.reason?.message || e.reason) + "\n" + (e.reason?.stack || "")));

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  showFatalError("Missing VITE_CLERK_PUBLISHABLE_KEY");
  throw new Error("Missing Publishable Key");
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  showFatalError("Could not find #root element");
  throw new Error("Could not find root element to mount to");
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0f172a', color: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'monospace' }}>
          <p style={{ color: '#f87171', marginBottom: '1rem' }}>Crash — share with support:</p>
          <pre style={{ background: '#1e293b', padding: '1rem', borderRadius: '8px', maxWidth: '600px', overflow: 'auto', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{this.state.error.message}{"\n\n"}{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>
      <Analytics />
    </RootErrorBoundary>
  </React.StrictMode>,
);
