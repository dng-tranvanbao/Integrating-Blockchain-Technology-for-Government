import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { ThumbsUp, ThumbsDown, Circle, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

const DelegatePortal: React.FC = () => {
  const { isDelegate, delegateProfile, proposals, userVotes, contract, refreshState } = useWeb3();
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const handleVote = async (proposalId: number, choice: number) => {
    if (!contract) return;
    
    try {
      setSubmittingId(proposalId);
      console.log(`Initiating vote for proposal #${proposalId} with choice: ${choice}`);
      
      const tx = await contract.vote(proposalId, choice);
      console.log("Transaction processing...", tx.hash);
      
      await tx.wait();
      console.log("Voting successful!");
      alert("Your anonymous vote has been successfully recorded on the Blockchain!");
      await refreshState();
    } catch (error: any) {
      console.error("Voting error:", error);
      let errorMsg = "Transaction failed.";
      if (error?.reason) {
        errorMsg = error.reason;
      } else if (error?.data?.message) {
        errorMsg = error.data.message;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      alert("Error: " + errorMsg);
    } finally {
      setSubmittingId(null);
    }
  };

  if (!isDelegate) {
    return (
      <div>
        <div className="header-bar">
          <div className="page-title">
            <h2>Delegate Voting Portal</h2>
            <p>Exclusive portal for whitelisted National Assembly delegates to vote</p>
          </div>
        </div>
        
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", border: "1px solid var(--color-danger)" }}>
          <AlertCircle size={64} color="var(--color-danger)" style={{ marginBottom: "1.5rem" }} />
          <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "var(--color-text-primary)" }}>Access Denied</h3>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: "600px", margin: "0 auto 1.5rem auto", lineHeight: "1.6" }}>
            Your currently connected wallet address is not on the National Assembly Whitelist. 
            To cast a vote, please switch to a whitelisted wallet or contact the Secretary to request access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header-bar">
        <div className="page-title">
          <h2>Delegate Voting Portal</h2>
          <p>Welcome, Delegate: <strong>{delegateProfile?.name}</strong> (Delegation: <strong>{delegateProfile?.province}</strong>)</p>
        </div>
        <div className="wallet-badge connected">
          <ShieldCheck size={16} /> Whitelisted Account
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem 2rem", marginBottom: "2rem", borderLeft: "4px solid var(--accent-gold)" }}>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6" }}>
          💡 **Privacy Principle:** To protect voting freedom, this system implements a **Voter Privacy Design**. 
          Your voting transaction marks your wallet as 'voted' (to prevent double voting), 
          but your specific choice is directly incremented into the public total tally, completely decoupling your wallet from your choice. 
          There is no cryptographic way to trace how you voted from the blockchain data.
        </p>
      </div>

      <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>Legislative Proposals</h3>

      {proposals.length === 0 ? (
        <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "3rem" }}>
          No legislative proposals in the list.
        </p>
      ) : (
        proposals.map((proposal) => {
          const hasVotedThis = userVotes[proposal.id];
          const isVotingActive = proposal.votingStarted && !proposal.votingEnded;
          const isVotingNotStarted = !proposal.votingStarted;
          const isVotingEnded = proposal.votingEnded;

          return (
            <div key={proposal.id} className="glass-panel proposal-card">
              <div className="proposal-header">
                <span className="status-badge" style={{ fontSize: "0.75rem", background: "rgba(212,175,55,0.08)", color: "var(--accent-gold)" }}>
                  Proposal ID: #{proposal.id}
                </span>
                
                {isVotingActive && <span className="status-badge active">Voting Open</span>}
                {isVotingNotStarted && <span className="status-badge created">Pending</span>}
                {isVotingEnded && <span className="status-badge ended">Closed</span>}
              </div>

              <h4 className="proposal-title" style={{ marginBottom: "12px" }}>{proposal.title}</h4>
              <p className="proposal-desc">{proposal.description}</p>

              {/* Voting State Notifications / Forms */}
              <div style={{ marginTop: "1.5rem" }}>
                {isVotingNotStarted && (
                  <div className="notification-banner info">
                    <AlertCircle size={20} /> The Secretary has not activated the voting phase for this proposal yet.
                  </div>
                )}

                {isVotingEnded && (
                  <div className="notification-banner warning">
                    <CheckCircle2 size={20} /> The voting phase has ended. The final aggregated results are stored permanently on the blockchain ledger.
                  </div>
                )}

                {isVotingActive && hasVotedThis && (
                  <div className="notification-banner" style={{ background: "rgba(16, 185, 129, 0.08)", color: "var(--color-success)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <CheckCircle2 size={20} /> **You have successfully cast your vote on this proposal.** 
                    Your choice has been anonymized.
                  </div>
                )}

                {isVotingActive && !hasVotedThis && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
                    <p style={{ fontWeight: 600, marginBottom: "1rem", fontSize: "1rem" }}>
                      Please select one of the following voting options:
                    </p>
                    
                    {submittingId === proposal.id ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div className="spinner"></div>
                        <p style={{ color: "var(--color-text-secondary)" }}>Submitting transaction to MetaMask for signature confirmation...</p>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        <button 
                          className="btn-success" 
                          onClick={() => handleVote(proposal.id, 1)}
                        >
                          <ThumbsUp size={18} /> In Favor (Yes)
                        </button>
                        
                        <button 
                          className="btn-danger" 
                          onClick={() => handleVote(proposal.id, 2)}
                        >
                          <ThumbsDown size={18} /> Against (No)
                        </button>
                        
                        <button 
                          className="btn-warning" 
                          onClick={() => handleVote(proposal.id, 3)}
                        >
                          <Circle size={18} /> Abstain
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default DelegatePortal;
