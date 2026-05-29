import React, { useState } from "react";
import { useWeb3 } from "./context/Web3Context";
import Dashboard from "./pages/Dashboard";
import DelegatePortal from "./pages/DelegatePortal";
import AdminPortal from "./pages/AdminPortal";
import PublicAnalytics from "./pages/PublicAnalytics";
import { 
  LayoutDashboard, 
  Vote, 
  ShieldAlert, 
  BarChart3, 
  Wallet, 
  RefreshCw 
} from "lucide-react";

const App: React.FC = () => {
  const { account, connectWallet, refreshState, loading, isAdmin, wrongNetwork, currentChainId } = useWeb3();
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  const renderActivePage = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "delegate":
        return <DelegatePortal />;
      case "admin":
        return <AdminPortal />;
      case "analytics":
        return <PublicAnalytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">🏛️</div>
          <div className="brand-text">
            <h1>National Assembly</h1>
            <p>Blockchain Voting System</p>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <ul className="menu-list">
            <li>
              <button 
                className={`menu-item ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            
            <li>
              <button 
                className={`menu-item ${activeTab === "delegate" ? "active" : ""}`}
                onClick={() => setActiveTab("delegate")}
              >
                <Vote size={20} />
                <span>Delegate Portal</span>
              </button>
            </li>

            {isAdmin && (
              <li>
                <button 
                  className={`menu-item ${activeTab === "admin" ? "active" : ""}`}
                  onClick={() => setActiveTab("admin")}
                >
                  <ShieldAlert size={20} />
                  <span>Secretary Portal</span>
                </button>
              </li>
            )}

            <li>
              <button 
                className={`menu-item ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart3 size={20} />
                <span>Public Analytics</span>
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem", marginTop: "auto" }}>
          {account ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div 
                className="wallet-badge connected" 
                style={{ justifyContent: "center", width: "100%" }}
                title={account}
              >
                <span className="spinner" style={{ width: "8px", height: "8px", borderWidth: "1px", borderTopColor: "white", display: loading ? "block" : "none" }}></span>
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
              <button 
                className="btn-secondary" 
                style={{ width: "100%", fontSize: "0.8rem", padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={refreshState}
                disabled={loading}
              >
                <RefreshCw size={12} className={loading ? "spinner" : ""} />
                Refresh Wallet
              </button>
            </div>
          ) : (
            <button 
              className="wallet-badge disconnected" 
              style={{ width: "100%", justifyContent: "center" }}
              onClick={connectWallet}
              disabled={loading}
            >
              <Wallet size={16} />
              <span>Connect MetaMask</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main content body */}
      <main className="main-content">
        {wrongNetwork && (
          <div className="glass-panel" style={{ padding: "1.5rem 2rem", marginBottom: "1.5rem", border: "1px solid var(--color-danger)", background: "rgba(239, 68, 68, 0.05)" }}>
            <h3 style={{ color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "10px", margin: "0 0 8px 0", fontSize: "1.2rem", fontWeight: 600 }}>
              ⚠️ Network Connection Error
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0, lineHeight: "1.5" }}>
              Your MetaMask wallet is connected to a network with Chain ID: **{currentChainId !== null ? currentChainId : "Loading..."}** instead of **31337**. 
              Please click the Network selection dropdown in your MetaMask extension and switch to **Hardhat Local** (Chain ID: **31337**).
            </p>
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "80vh", gap: "1rem" }}>
            <div className="spinner" style={{ width: "48px", height: "48px", borderWidth: "4px" }}></div>
            <p style={{ color: "var(--color-text-secondary)" }}>Synchronizing blockchain ledger...</p>
          </div>
        ) : (
          renderActivePage()
        )}
      </main>
    </div>
  );
};

export default App;
