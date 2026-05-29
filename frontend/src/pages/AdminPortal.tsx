import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { FilePlus, UserPlus, Check, AlertTriangle, ShieldCheck } from "lucide-react";

const AdminPortal: React.FC = () => {
  const { isAdmin, contract, proposals, delegates, refreshState } = useWeb3();

  // Proposal form state
  const [propTitle, setPropTitle] = useState("");
  const [propDesc, setPropDesc] = useState("");
  const [creatingProp, setCreatingProp] = useState(false);

  // Delegate form state
  const [delWallet, setDelWallet] = useState("");
  const [delName, setDelName] = useState("");
  const [delProvince, setDelProvince] = useState("");
  const [addingDel, setAddingDel] = useState(false);

  // Action loadings
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !propTitle.trim() || !propDesc.trim()) return;

    try {
      setCreatingProp(true);
      const tx = await contract.createProposal(propTitle, propDesc);
      await tx.wait();
      alert("Successfully created new legislative bill!");
      setPropTitle("");
      setPropDesc("");
      await refreshState();
    } catch (error: any) {
      console.error("Error creating proposal:", error);
      alert("Error: " + (error?.reason || error?.message || "Unknown error occurred"));
    } finally {
      setCreatingProp(false);
    }
  };

  const handleAddDelegate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !delWallet.trim() || !delName.trim() || !delProvince.trim()) return;

    try {
      setAddingDel(true);
      const tx = await contract.addDelegate(delWallet, delName, delProvince);
      await tx.wait();
      alert("Successfully whitelisted delegate!");
      setDelWallet("");
      setDelName("");
      setDelProvince("");
      await refreshState();
    } catch (error: any) {
      console.error("Error adding delegate:", error);
      alert("Error: " + (error?.reason || error?.message || "Unknown error occurred"));
    } finally {
      setAddingDel(false);
    }
  };

  const handleToggleVoting = async (proposalId: number, currentPhase: "start" | "end") => {
    if (!contract) return;
    
    const loadingKey = `${currentPhase}-${proposalId}`;
    try {
      setActionLoadingId(loadingKey);
      if (currentPhase === "start") {
        const tx = await contract.startVoting(proposalId);
        await tx.wait();
        alert("Successfully opened voting phase!");
      } else {
        const tx = await contract.endVoting(proposalId);
        await tx.wait();
        alert("Successfully closed voting phase!");
      }
      await refreshState();
    } catch (error: any) {
      console.error("Error toggling voting phase:", error);
      alert("Error: " + (error?.reason || error?.message || "Unknown error occurred"));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveDelegate = async (walletAddress: string) => {
    if (!contract) return;
    
    const loadingKey = `remove-${walletAddress}`;
    if (!confirm(`Are you sure you want to deactivate delegate privileges for wallet: ${walletAddress}?`)) return;

    try {
      setActionLoadingId(loadingKey);
      const tx = await contract.removeDelegate(walletAddress);
      await tx.wait();
      alert("Successfully deactivated delegate!");
      await refreshState();
    } catch (error: any) {
      console.error("Error deactivating delegate:", error);
      alert("Error: " + (error?.reason || error?.message || "Unknown error occurred"));
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div>
        <div className="header-bar">
          <div className="page-title">
            <h2>Secretary Portal (Admin)</h2>
            <p>Administration area for managing proposals and delegates</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", border: "1px solid var(--color-danger)" }}>
          <AlertTriangle size={64} color="var(--color-danger)" style={{ marginBottom: "1.5rem" }} />
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-text-primary)" }}>Access Denied</h3>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto 1.5rem auto", lineHeight: "1.6" }}>
            This page is only available for the **Electoral Secretary (Admin)** address. 
            Please connect the authorized admin wallet to proceed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header-bar">
        <div className="page-title">
          <h2>Secretary Portal (Admin)</h2>
          <p>Draft legislative proposals, manage the Delegate Whitelist, and control voting lifecycles</p>
        </div>
        <div className="wallet-badge connected" style={{ background: "rgba(212,175,55,0.1)", color: "var(--accent-gold)", borderColor: "var(--glass-border-focus)" }}>
          <ShieldCheck size={16} /> Secretary (Admin)
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        
        {/* Form 1: Draft new bill */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <FilePlus color="var(--accent-gold)" />
            <h3 style={{ fontSize: "1.25rem" }}>Draft New Legislative Bill</h3>
          </div>
          <form onSubmit={handleCreateProposal}>
            <div className="form-group">
              <label className="form-label">Proposal Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Cybersecurity Law (Amended 2026)" 
                value={propTitle}
                onChange={(e) => setPropTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Summary Description</label>
              <textarea 
                className="form-input" 
                rows={4}
                placeholder="Key adjustments of the legislative draft..." 
                value={propDesc}
                onChange={(e) => setPropDesc(e.target.value)}
                style={{ resize: "vertical" }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={creatingProp}>
              {creatingProp ? "Sending transaction..." : "Publish New Bill"}
            </button>
          </form>
        </div>

        {/* Form 2: Whitelist Delegate */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <UserPlus color="var(--accent-gold)" />
            <h3 style={{ fontSize: "1.25rem" }}>Whitelist New Delegate</h3>
          </div>
          <form onSubmit={handleAddDelegate}>
            <div className="form-group">
              <label className="form-label">Delegate Wallet Address</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="0x..." 
                value={delWallet}
                onChange={(e) => setDelWallet(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Delegate Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Nguyen Van A" 
                value={delName}
                onChange={(e) => setDelName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Representing Delegation (Province/City)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g., Hanoi" 
                value={delProvince}
                onChange={(e) => setDelProvince(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={addingDel}>
              {addingDel ? "Sending transaction..." : "Grant Delegate Privileges"}
            </button>
          </form>
        </div>
      </div>

      {/* Control proposals */}
      <div className="glass-panel" style={{ padding: "2rem", marginBottom: "2rem" }}>
        <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>Manage Bill Voting Status</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID</th>
                <th>Proposal Title</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.title}</td>
                  <td>
                    {!p.votingStarted && <span className="status-badge created">Pending</span>}
                    {p.votingStarted && !p.votingEnded && <span className="status-badge active">Active</span>}
                    {p.votingEnded && <span className="status-badge ended">Closed</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {!p.votingStarted && (
                      <button 
                        className="btn-primary" 
                        style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex" }}
                        onClick={() => handleToggleVoting(p.id, "start")}
                        disabled={actionLoadingId === `start-${p.id}`}
                      >
                        {actionLoadingId === `start-${p.id}` ? "Processing..." : "Open Voting"}
                      </button>
                    )}
                    {p.votingStarted && !p.votingEnded && (
                      <button 
                        className="btn-danger" 
                        style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex" }}
                        onClick={() => handleToggleVoting(p.id, "end")}
                        disabled={actionLoadingId === `end-${p.id}`}
                      >
                        {actionLoadingId === `end-${p.id}` ? "Processing..." : "Close Voting"}
                      </button>
                    )}
                    {p.votingEnded && (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Voting Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Whitelisted Delegates List */}
      <div className="glass-panel" style={{ padding: "2rem" }}>
        <h3 style={{ fontSize: "1.25rem", marginBottom: "1.5rem" }}>National Assembly Delegate Whitelist</h3>
        <div style={{ overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Wallet Address</th>
                <th>Represented Delegation</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Suspend</th>
              </tr>
            </thead>
            <tbody>
              {delegates.map((d) => (
                <tr key={d.wallet}>
                  <td style={{ fontWeight: 500 }}>{d.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    {d.wallet}
                  </td>
                  <td>{d.province}</td>
                  <td>
                    {d.active ? (
                      <span style={{ color: "var(--color-success)", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem" }}>
                        <Check size={16} /> Active
                      </span>
                    ) : (
                      <span style={{ color: "var(--color-danger)", fontSize: "0.85rem" }}>Suspended</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {d.active ? (
                      <button 
                        className="btn-secondary" 
                        style={{ fontSize: "0.75rem", padding: "4px 8px", borderColor: "rgba(239,68,68,0.2)", color: "var(--color-danger)" }}
                        onClick={() => handleRemoveDelegate(d.wallet)}
                        disabled={actionLoadingId === `remove-${d.wallet}`}
                      >
                        {actionLoadingId === `remove-${d.wallet}` ? "Deactivating..." : "Deactivate"}
                      </button>
                    ) : (
                      <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>Deactivated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminPortal;
