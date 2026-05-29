import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { Sparkles, BrainCircuit, FileText, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

interface AISummary {
  title: string;
  summary: string;
  keyPoints: string[];
  impact: string;
  status: string;
}

const AIAssistant: React.FC = () => {
  const { proposals } = useWeb3();
  const [selectedPropId, setSelectedPropId] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);

  const proposal = proposals.find((p) => p.id === selectedPropId) || proposals[0];

  // Detailed mock AI summaries tailored for legislative proposals
  const generateMockAnalysis = (title: string, description: string): AISummary => {
    // Custom responses based on known proposals, fall back to dynamic generation
    if (title.toLowerCase().includes("cybersecurity")) {
      return {
        title: title,
        summary: "This draft legislation aims to establish a comprehensive legal framework to safeguard national digital sovereignty. It defines legal parameters for protecting critical national information infrastructures (CNII), details state requirements for data localization, and outlines strict measures for combating cyber-terrorism, digital espionage, and high-tech criminal behaviors.",
        keyPoints: [
          "Establishes strict compliance standards for critical infrastructure providers (energy, finance, telecommunications, government services).",
          "Mandates local data storage requirements for personal identification data of citizens collected by multinational digital platforms.",
          "Defines official response mechanisms for cyber emergency response teams (CERT) during coordinated national security incidents.",
          "Clarifies legal penalties for spreading malware, hacking governmental nodes, or coordinating distributed denial of service (DDoS) attacks."
        ],
        impact: "Improves national defensive cyber posture by 45% within the first fiscal year, but increases compliance costs for private enterprise and requires substantial governmental coordination across ministries.",
        status: "Highly recommended for ratification due to urgent security vulnerabilities in current legal frameworks."
      };
    } else if (title.toLowerCase().includes("land")) {
      return {
        title: title,
        summary: "An expansive reform bill modifying land usage, ownership valuation models, and public reclamation guidelines. It seeks to resolve local disputes, streamline national infrastructure acquisition processes, and introduce digital registry mechanisms to prevent ownership fraud and optimize agrarian land resource allocation.",
        keyPoints: [
          "Standardizes land pricing models to match market values, reducing discrepancies during public interest reclamation.",
          "Establishes electronic, tamper-proof land registration records (ideally prepared for blockchain metadata integration).",
          "Strengthens rights for agricultural workers, extending lease options to promote long-term domestic farming investments.",
          "Simplifies zoning regulations to expedite municipal commercial developments and public utility construction."
        ],
        impact: "Reduces administrative land transfer overheads by 30%, mitigates municipal legal disputes, and provides a stable framework for international real estate developers.",
        status: "Passes constitutional compliance checks. Recommended to proceed with minor revisions in zoning sections."
      };
    } else {
      // Dynamic fallback for any custom proposals created by the user
      return {
        title: title,
        summary: `This AI agent has analyzed the draft legislation titled '${title}'. The core objective of this bill is to address administrative bottlenecks and introduce legal reforms as described: ${description}. It establishes regulatory protocols to govern this domain under public interest guidelines.`,
        keyPoints: [
          "Proposes structural changes to current administrative procedures within this specific sector.",
          "Details verification and auditing standards to prevent abuse or resource mismanagement.",
          "Establishes reporting guidelines for key public stakeholders and municipal authorities.",
          "Defines legal penalties for non-compliance and outlines transition timelines for enforcement."
        ],
        impact: "Increases operational efficiency, ensures higher transparency, and sets up a robust oversight framework.",
        status: "Structurally sound. Recommended for active voting phase to gauge assembly consensus."
      };
    }
  };

  const handleStartAnalysis = () => {
    if (!proposal) return;
    
    setIsAnalyzing(true);
    setAiSummary(null);
    
    // Simulate multi-stage AI reasoning process
    const stages = [
      "Initializing AI Legislative Auditor...",
      "Reading smart contract variables and historical blocks...",
      "Parsing proposal title and description texts...",
      "Cross-referencing constitutional precedents and legal frameworks...",
      "Evaluating legislative impact and drafting summary report..."
    ];

    let currentStage = 0;
    setAnalysisProgress(stages[0]);

    const interval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setAnalysisProgress(stages[currentStage]);
      } else {
        clearInterval(interval);
        setAiSummary(generateMockAnalysis(proposal.title, proposal.description));
        setIsAnalyzing(false);
      }
    }, 900);
  };

  useEffect(() => {
    // Clear old summaries when proposal selection changes
    setAiSummary(null);
  }, [selectedPropId]);

  return (
    <div>
      <div className="header-bar">
        <div className="page-title">
          <h2>AI Legislative Explainer</h2>
          <p>Get instant, structured AI-driven analysis on active draft bills to assist voting decisions</p>
        </div>
        <div className="wallet-badge connected" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#a78bfa", borderColor: "rgba(139, 92, 246, 0.3)" }}>
          <Sparkles size={16} /> AI Auditor Active
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
          <FileText size={48} style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }} />
          <p style={{ color: "var(--color-text-secondary)" }}>
            No legislative proposals available on the blockchain for AI analysis.
          </p>
        </div>
      ) : (
        <div>
          {/* Proposal Selector Card */}
          <div className="glass-panel" style={{ padding: "1.75rem 2rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "280px" }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Select Bill for AI Analysis:</label>
                <select 
                  className="form-input" 
                  value={selectedPropId}
                  onChange={(e) => setSelectedPropId(Number(e.target.value))}
                >
                  {proposals.map(p => (
                    <option key={p.id} value={p.id}>{p.title} (#{p.id})</option>
                  ))}
                </select>
              </div>
              <button 
                className="btn-primary" 
                style={{ height: "45px", marginTop: "24px", display: "flex", alignItems: "center", gap: "8px", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", border: "none" }}
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="spinner" size={18} />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit size={18} />
                    <span>Analyze Bill with AI</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Loader */}
          {isAnalyzing && (
            <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "center", animation: "pulse 2s infinite" }}>
              <div className="spinner" style={{ width: "40px", height: "40px", borderTopColor: "#7c3aed", margin: "0 auto 1.5rem auto" }}></div>
              <p style={{ color: "var(--accent-gold)", fontWeight: 500, fontSize: "1.05rem" }}>{analysisProgress}</p>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: "8px" }}>This might take a few seconds...</p>
            </div>
          )}

          {/* Result Presentation */}
          {aiSummary && !isAnalyzing && (
            <div className="glass-panel" style={{ padding: "2rem", borderLeft: "4px solid #7c3aed" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                <Sparkles color="#a78bfa" size={24} />
                <h3 style={{ fontSize: "1.35rem", fontWeight: 600 }}>AI Audit Report: {aiSummary.title}</h3>
              </div>

              {/* Summary Section */}
              <div style={{ marginBottom: "1.75rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Executive Summary</h4>
                <p style={{ color: "var(--color-text-secondary)", lineHeight: "1.6", fontSize: "0.95rem" }}>{aiSummary.summary}</p>
              </div>

              {/* Key Provisions */}
              <div style={{ marginBottom: "1.75rem" }}>
                <h4 style={{ fontSize: "0.95rem", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Key Provisions & Measures</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {aiSummary.keyPoints.map((point, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <ArrowRight size={16} style={{ color: "var(--accent-gold)", marginTop: "4px", flexShrink: 0 }} />
                      <p style={{ color: "var(--color-text-secondary)", margin: 0, fontSize: "0.92rem", lineHeight: "1.5" }}>{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grid of details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.5rem" }}>
                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Impact Assessment</h4>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>{aiSummary.impact}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Compliance Status</h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck color="var(--color-success)" size={20} />
                    <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: 500, margin: 0 }}>{aiSummary.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Initial Prompt State */}
          {!aiSummary && !isAnalyzing && (
            <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <BrainCircuit size={48} style={{ color: "rgba(255,255,255,0.15)", marginBottom: "1rem" }} />
              <h4 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>AI Explainer Ready</h4>
              <p style={{ color: "var(--color-text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
                Select a draft bill in the box above and click the "Analyze Bill with AI" button to parse its objectives, provisions, and socio-economic impact.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
