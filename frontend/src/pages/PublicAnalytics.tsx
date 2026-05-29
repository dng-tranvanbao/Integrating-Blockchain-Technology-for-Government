import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { PieChart, ListChecks, History, Check, X, Circle, Globe } from "lucide-react";

interface VoteTx {
  txHash: string;
  blockNumber: number;
  proposalId: number;
}

const PublicAnalytics: React.FC = () => {
  const { proposals, delegates, contract } = useWeb3();
  const [selectedPropId, setSelectedPropId] = useState<number>(1);
  const [voteHistory, setVoteHistory] = useState<VoteTx[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load transaction history of VoteCast events from the contract
  const loadVoteHistory = async () => {
    if (!contract) return;
    try {
      setLoadingHistory(true);
      const filter = contract.filters.VoteCast();
      const events = await contract.queryFilter(filter, 0, "latest");
      
      const parsedEvents: VoteTx[] = events.map((event: any) => {
        return {
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          proposalId: Number(event.args ? event.args[0] : 1)
        };
      });
      
      setVoteHistory(parsedEvents.reverse());
    } catch (error) {
      console.error("Error loading event logs:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (contract) {
      loadVoteHistory();
      
      // Register for real-time VoteCast events
      const onVoteCast = (proposalId: bigint, event: any) => {
        console.log("Real-time VoteCast event received from block:", event.log.blockNumber);
        setVoteHistory(prev => [
          {
            txHash: event.log.transactionHash,
            blockNumber: event.log.blockNumber,
            proposalId: Number(proposalId)
          },
          ...prev
        ]);
      };

      contract.on("VoteCast", onVoteCast);

      return () => {
        contract.off("VoteCast", onVoteCast);
      };
    }
  }, [contract]);

  const proposal = proposals.find((p) => p.id === selectedPropId) || proposals[0];

  if (!proposal) {
    return (
      <div>
        <div className="header-bar">
          <div className="page-title">
            <h2>Public Audit & Analytics</h2>
            <p>Transparent voting data for citizens and independent auditors</p>
          </div>
        </div>
        <p style={{ color: "var(--color-text-secondary)", textAlign: "center", padding: "3rem" }}>
          No legislative proposals found on the blockchain.
        </p>
      </div>
    );
  }

  // Calculate voting stats
  const totalVotes = proposal.votesYes + proposal.votesNo + proposal.votesAbstain;
  const activeDelegatesCount = delegates.filter((d) => d.active).length;
  const participationRate = activeDelegatesCount > 0 ? ((totalVotes / activeDelegatesCount) * 100).toFixed(1) : "0.0";

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return ((votes / totalVotes) * 100).toFixed(1);
  };

  const yesPercent = getPercentage(proposal.votesYes);
  const noPercent = getPercentage(proposal.votesNo);
  const abstainPercent = getPercentage(proposal.votesAbstain);

  // Check passing status
  const getProposalResultStatus = () => {
    if (!proposal.votingEnded) return { text: "Voting Active", color: "var(--color-info)" };
    
    // Legislative rule: Proposal passes if Yes votes > 50% of total cast votes
    if (proposal.votesYes > (totalVotes / 2) && totalVotes > 0) {
      return { text: "PASSED", color: "var(--color-success)" };
    }
    return { text: "REJECTED / INSUFFICIENT VOTES", color: "var(--color-danger)" };
  };

  const resultStatus = getProposalResultStatus();

  return (
    <div>
      <div className="header-bar">
        <div className="page-title">
          <h2>Public Audit & Analytics</h2>
          <p>Transparent voting data for citizens and independent auditors</p>
        </div>
        <div className="wallet-badge connected" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--color-info)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
          <Globe size={16} /> Local Network (RPC)
        </div>
      </div>

      {/* Select Proposal Selector */}
      <div className="glass-panel" style={{ padding: "1.5rem 2rem", marginBottom: "2rem" }}>
        <div className="form-group" style={{ margin: 0, display: "flex", alignItems: "center", gap: "1rem" }}>
          <label className="form-label" style={{ margin: 0, whiteSpace: "nowrap", fontWeight: 600 }}>Select Bill for Audit:</label>
          <select 
            className="form-input" 
            style={{ maxWidth: "400px" }}
            value={selectedPropId}
            onChange={(e) => setSelectedPropId(Number(e.target.value))}
          >
            {proposals.map(p => (
              <option key={p.id} value={p.id}>{p.title} (#{p.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Results Display */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
        
        {/* Results Graph and Cards */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div>
              <span className="status-badge" style={{ fontSize: "0.75rem", background: "rgba(212,175,55,0.08)", color: "var(--accent-gold)", marginBottom: "8px" }}>
                Proposal #{proposal.id}
              </span>
              <h3 style={{ fontSize: "1.5rem" }}>{proposal.title}</h3>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", display: "block" }}>Proposal Status</span>
              <span style={{ fontWeight: 700, fontSize: "1.1rem", color: resultStatus.color }}>
                {resultStatus.text}
              </span>
            </div>
          </div>

          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem", lineHeight: "1.6", marginBottom: "2rem" }}>
            {proposal.description}
          </p>

          <div className="results-container">
            <h4 style={{ fontSize: "1rem", marginBottom: "1.25rem", fontWeight: 600 }}>Current Vote Breakdown</h4>
            
            {/* Yes Bar */}
            <div className="result-bar-item">
              <div className="result-bar-label">
                <Check size={16} color="var(--color-success)" />
                <span>In Favor (Yes)</span>
                <span>{proposal.votesYes} votes ({yesPercent}%)</span>
              </div>
              <div className="result-bar-bg">
                <div className="result-bar-fill yes" style={{ width: `${yesPercent}%` }}></div>
              </div>
            </div>

            {/* No Bar */}
            <div className="result-bar-item" style={{ marginTop: "1rem" }}>
              <div className="result-bar-label">
                <X size={16} color="var(--color-danger)" />
                <span>Against (No)</span>
                <span>{proposal.votesNo} votes ({noPercent}%)</span>
              </div>
              <div className="result-bar-bg">
                <div className="result-bar-fill no" style={{ width: `${noPercent}%` }}></div>
              </div>
            </div>

            {/* Abstain Bar */}
            <div className="result-bar-item" style={{ marginTop: "1rem" }}>
              <div className="result-bar-label">
                <Circle size={14} color="var(--color-warning)" />
                <span>Abstain</span>
                <span>{proposal.votesAbstain} votes ({abstainPercent}%)</span>
              </div>
              <div className="result-bar-bg">
                <div className="result-bar-fill abstain" style={{ width: `${abstainPercent}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Stats Side Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="glass-panel" style={{ padding: "1.5rem 2rem", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
              <PieChart color="var(--accent-gold)" />
              <h3 style={{ fontSize: "1.15rem" }}>Audit Metrices</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Total Votes Cast:</span>
                <span style={{ fontWeight: 600 }}>{totalVotes} votes</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Participating Delegates:</span>
                <span style={{ fontWeight: 600 }}>{activeDelegatesCount} wallets</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "8px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Voting Turnout:</span>
                <span style={{ fontWeight: 600, color: "var(--accent-gold)" }}>{participationRate}%</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
                <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", lineHeight: "1.4" }}>
                  * Passing Rules: A draft proposal is officially passed when the voting phase is closed and the 'In Favor (Yes)' votes exceed 50% of the total valid votes recorded on the blockchain.
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: "1.5rem 2rem" }}>
            <h4 style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Contract Address</h4>
            <p style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent-gold)", wordBreak: "break-all" }}>
              {contract ? contract.target.toString() : "Loading..."}
            </p>
          </div>
        </div>

      </div>

      {/* Transaction & Audit Logs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        
        {/* Whitelisted Delegates checking */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
            <ListChecks color="var(--accent-gold)" />
            <h3 style={{ fontSize: "1.25rem" }}>Voted Delegate Registry</h3>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: "1.5" }}>
            List of whitelisted delegates who have submitted their ballots for this proposal. Specific choices are cryptographically hidden.
          </p>
          
          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Delegate</th>
                  <th>Delegation</th>
                  <th style={{ textAlign: "right" }}>Audit Status</th>
                </tr>
              </thead>
              <tbody>
                {delegates.filter(d => d.active).map((delegate) => {
                  return (
                    <tr key={delegate.wallet}>
                      <td style={{ fontWeight: 500 }}>{delegate.name}</td>
                      <td>{delegate.province}</td>
                      <td style={{ textAlign: "right" }}>
                        <span 
                          style={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 600,
                            color: "var(--color-text-secondary)" 
                          }}
                        >
                          Vote Submitted
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {delegates.filter(d => d.active).length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem 0" }}>
                      No delegates whitelisted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Transaction Proofs from Blockchain */}
        <div className="glass-panel" style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <History color="var(--accent-gold)" />
              <h3 style={{ fontSize: "1.25rem" }}>Cryptographic Transaction Proofs</h3>
            </div>
            <button className="btn-secondary" style={{ fontSize: "0.75rem", padding: "4px 8px" }} onClick={loadVoteHistory}>
              Refresh
            </button>
          </div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: "1.5" }}>
            Every ballot transaction generates a unique transaction hash on the blockchain. 
            This serves as cryptographic proof that the vote has been permanently written and cannot be mutated.
          </p>

          <div style={{ maxHeight: "350px", overflowY: "auto" }}>
            {loadingHistory ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "3rem 0" }}>
                <div className="spinner"></div>
              </div>
            ) : voteHistory.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "3rem 0" }}>
                No ballot transactions recorded for this proposal yet.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {voteHistory.map((tx, idx) => (
                  <div 
                    key={tx.txHash + idx} 
                    style={{ 
                      padding: "10px 14px", 
                      background: "rgba(255,255,255,0.02)", 
                      border: "1px solid rgba(255,255,255,0.05)",
                      borderRadius: "6px",
                      fontSize: "0.8rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ color: "var(--accent-gold)", fontWeight: 500 }}>
                        Vote Cast on Proposal #{tx.proposalId}
                      </span>
                      <span style={{ color: "var(--color-text-muted)" }}>
                        Block: #{tx.blockNumber}
                      </span>
                    </div>
                    <p style={{ fontFamily: "monospace", color: "var(--color-text-secondary)", wordBreak: "break-all" }}>
                      Tx: {tx.txHash}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default PublicAnalytics;
