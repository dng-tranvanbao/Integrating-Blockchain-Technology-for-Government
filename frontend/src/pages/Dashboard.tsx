import React from "react";
import { useWeb3 } from "../context/Web3Context";
import { Users, FileText, Vote, CheckCircle } from "lucide-react";

const Dashboard: React.FC = () => {
  const { account, isAdmin, isDelegate, delegateProfile, proposals, delegates } = useWeb3();

  // Calculate statistics
  const activeProposals = proposals.filter((p) => p.votingStarted && !p.votingEnded);
  const endedProposals = proposals.filter((p) => p.votingEnded);
  const activeDelegates = delegates.filter((d) => d.active);

  const getRoleLabel = () => {
    if (isAdmin) return { label: "Electoral Secretary (Admin)", class: "admin" };
    if (isDelegate) return { label: `NA Delegate (${delegateProfile?.province})`, class: "delegate" };
    return { label: "Public / Independent Auditor", class: "citizen" };
  };

  const role = getRoleLabel();

  return (
    <div>
      <div className="header-bar">
        <div className="page-title">
          <h2>Dashboard</h2>
          <p>Transparent real-time voting monitoring system</p>
        </div>
        <div className="glass-panel" style={{ padding: "8px 16px", borderRadius: "50px", border: "1px solid var(--glass-border)" }}>
          <span className={`role-tag ${role.class}`}>{role.label}</span>
        </div>
      </div>

      {/* Greeting Banner */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.75rem", marginBottom: "8px" }}>
          {isAdmin 
            ? "Welcome, Electoral Secretary" 
            : isDelegate 
            ? `Welcome, Delegate ${delegateProfile?.name}` 
            : "Welcome, Respected Citizens & Auditors"}
        </h3>
        <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
          {isAdmin
            ? "The system is operating securely. You have administrative privileges to manage the whitelisted National Assembly delegates and control the voting phases for draft bills."
            : isDelegate
            ? `Your wallet address is whitelisted as a National Assembly delegate representing **${delegateProfile?.province}**. Please access the Delegate Portal to execute your anonymous voting rights.`
            : "This is the public portal. Citizens and independent audit bodies can inspect the live bill voting tallies and verify transaction finality on the immutable blockchain."}
        </p>
        {account && (
          <p style={{ marginTop: "16px", fontSize: "0.85rem", color: "var(--accent-gold)" }}>
            <strong>Connected Wallet Address:</strong> {account}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid">
        <div className="glass-panel info-card">
          <div className="info-card-icon">
            <Users />
          </div>
          <div className="info-card-details">
            <h4>Whitelisted Delegates</h4>
            <p>{activeDelegates.length} <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--color-text-muted)" }}>/ {delegates.length} total</span></p>
          </div>
        </div>

        <div className="glass-panel info-card">
          <div className="info-card-icon">
            <FileText />
          </div>
          <div className="info-card-details">
            <h4>Total Proposals</h4>
            <p>{proposals.length}</p>
          </div>
        </div>

        <div className="glass-panel info-card">
          <div className="info-card-icon">
            <Vote />
          </div>
          <div className="info-card-details">
            <h4>Active Voting</h4>
            <p>{activeProposals.length}</p>
          </div>
        </div>

        <div className="glass-panel info-card">
          <div className="info-card-icon">
            <CheckCircle />
          </div>
          <div className="info-card-details">
            <h4>Completed</h4>
            <p>{endedProposals.length}</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
        {/* Active bills list */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
            Active Bills Under Voting
          </h3>
          {activeProposals.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "2rem 0" }}>
              There are currently no proposals active for voting.
            </p>
          ) : (
            activeProposals.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div>
                  <h4 style={{ color: "var(--color-text-primary)", fontSize: "1.05rem" }}>{p.title}</h4>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Proposal ID: #{p.id}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="status-badge active">Active</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Whitelist view */}
        <div className="glass-panel" style={{ padding: "1.75rem" }}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.5rem" }}>
            Assembly Delegates
          </h3>
          {activeDelegates.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "2rem 0" }}>
              No delegates are whitelisted yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto" }}>
              {activeDelegates.slice(0, 5).map((d) => (
                <div key={d.wallet} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: 500, fontSize: "0.95rem" }}>{d.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {d.wallet.slice(0, 6)}...{d.wallet.slice(-4)}
                    </p>
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--accent-gold)", background: "rgba(212,175,55,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                    {d.province}
                  </span>
                </div>
              ))}
              {activeDelegates.length > 5 && (
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", textAlign: "center", marginTop: "8px" }}>
                  And {activeDelegates.length - 5} other delegates...
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
