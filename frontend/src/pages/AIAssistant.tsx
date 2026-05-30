import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import { 
  Sparkles, 
  BrainCircuit, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Settings, 
  Eye, 
  EyeOff, 
  Save, 
  AlertTriangle 
} from "lucide-react";

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
  
  // Configuration Settings States
  const [showSettings, setShowSettings] = useState(false);
  const [provider, setProvider] = useState<string>(() => {
    return import.meta.env.VITE_AI_PROVIDER || localStorage.getItem("ai_provider") || "github";
  });
  const [apiKey, setApiKey] = useState<string>(() => {
    return import.meta.env.VITE_AI_API_KEY || localStorage.getItem("ai_api_key") || "";
  });
  const [model, setModel] = useState<string>(() => {
    return import.meta.env.VITE_AI_MODEL || localStorage.getItem("ai_model") || "gpt-4o-mini";
  });
  const [showKey, setShowKey] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const proposal = proposals.find((p) => p.id === selectedPropId) || proposals[0];

  // Adjust model automatically when provider changes
  useEffect(() => {
    const githubModels = ["gpt-4o-mini", "gpt-4o", "meta-llama-3.1-405b-instruct", "cohere-command-r-plus", "phi-3-medium-instruct"];
    const geminiModels = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"];
    const openaiModels = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];

    if (provider === "github") {
      if (!githubModels.includes(model)) setModel("gpt-4o-mini");
    } else if (provider === "gemini") {
      if (!geminiModels.includes(model)) setModel("gemini-2.5-flash");
    } else if (provider === "openai") {
      if (!openaiModels.includes(model)) setModel("gpt-4o-mini");
    }
  }, [provider]);

  // Clear summaries when proposal selection changes
  useEffect(() => {
    setAiSummary(null);
    setErrorMessage(null);
  }, [selectedPropId]);

  const handleSaveSettings = () => {
    localStorage.setItem("ai_provider", provider);
    localStorage.setItem("ai_api_key", apiKey);
    localStorage.setItem("ai_model", model);
    setSaveSuccess(true);
    setErrorMessage(null);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearSettings = () => {
    localStorage.removeItem("ai_provider");
    localStorage.removeItem("ai_api_key");
    localStorage.removeItem("ai_model");
    setApiKey("");
    setProvider("github");
    setModel("gpt-4o-mini");
    setSaveSuccess(true);
    setErrorMessage(null);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleStartAnalysis = async () => {
    if (!proposal) return;
    if (!apiKey) {
      setErrorMessage("Please configure your API Key or Personal Access Token in the settings panel above.");
      setShowSettings(true);
      return;
    }

    setIsAnalyzing(true);
    setAiSummary(null);
    setErrorMessage(null);

    const systemPrompt = `You are an expert AI Legislative Auditor and Legal Analyst. Your job is to analyze legislative proposals and generate structured summaries and assessments.
You must return your analysis as a valid, raw JSON object matching this schema:
{
  "title": "The exact title of the legislative proposal",
  "summary": "A comprehensive summary of the legislative proposal, explaining its core purpose, background, and scope in 3-4 clear sentences.",
  "keyPoints": [
    "Key provision 1 explaining what changes are mandated",
    "Key provision 2 explaining compliance standards or regulatory bodies established",
    "Key provision 3 explaining enforcement timelines or legal penalties",
    "Key provision 4 explaining other significant measures"
  ],
  "impact": "A detailed 2-sentence assessment of the social, economic, legal, and operational impact of this bill.",
  "status": "A clear compliance and recommendation status (e.g., 'Highly recommended', 'Recommended with minor revisions', 'Pending legal review')."
}
Ensure you do NOT wrap the response in markdown blocks like \`\`\`json or any other formatting. Return only the raw JSON string.`;

    try {
      setAnalysisProgress("Preparing legislative proposal details...");
      await new Promise((resolve) => setTimeout(resolve, 600));

      setAnalysisProgress(`Connecting to AI Provider: ${provider === 'github' ? 'GitHub Models' : provider === 'gemini' ? 'Gemini API' : 'OpenAI API'}...`);
      await new Promise((resolve) => setTimeout(resolve, 600));

      setAnalysisProgress("Awaiting analysis response from model...");

      let textResult = "";
      if (provider === "github") {
        const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Please analyze this legislative bill:\nTitle: ${proposal.title}\nDescription: ${proposal.description}` }
            ],
            model: model,
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        textResult = data.choices?.[0]?.message?.content || "";

      } else if (provider === "gemini") {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: `${systemPrompt}\n\nPlease analyze this legislative bill:\nTitle: ${proposal.title}\nDescription: ${proposal.description}` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      } else if (provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Please analyze this legislative bill:\nTitle: ${proposal.title}\nDescription: ${proposal.description}` }
            ],
            model: model,
            response_format: { type: "json_object" },
            temperature: 0.2
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        textResult = data.choices?.[0]?.message?.content || "";
      }

      setAnalysisProgress("Parsing and formatting audit report...");
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (!textResult) {
        throw new Error("Received empty response from the AI provider.");
      }

      // Robust clean formatting for LLM returns
      let cleanJson = textResult.trim();
      if (cleanJson.startsWith("```")) {
        const firstNewline = cleanJson.indexOf("\n");
        if (firstNewline !== -1) {
          cleanJson = cleanJson.slice(firstNewline).trim();
        } else {
          cleanJson = cleanJson.slice(3).trim();
        }
      }
      if (cleanJson.endsWith("```")) {
        cleanJson = cleanJson.slice(0, -3).trim();
      }
      if (cleanJson.startsWith("json")) {
        cleanJson = cleanJson.slice(4).trim();
      }

      const parsed: AISummary = JSON.parse(cleanJson);
      setAiSummary(parsed);
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      setErrorMessage(err.message || "An unexpected error occurred during AI analysis. Please double-check your credentials and connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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

      {/* Settings Panel */}
      <div className="glass-panel" style={{ padding: "1.25rem 1.75rem", marginBottom: "2rem" }}>
        <div 
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} 
          onClick={() => setShowSettings(!showSettings)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Settings size={20} style={{ color: "var(--accent-gold)" }} />
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0, color: "var(--color-text-primary)" }}>AI Configuration Settings</h3>
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            {showSettings ? "Hide Settings ▲" : "Show Settings ▼"}
          </span>
        </div>

        {showSettings && (
          <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.25rem" }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>AI Provider</label>
                <select className="form-input" value={provider} onChange={(e) => setProvider(e.target.value)}>
                  <option value="github">GitHub Models (Free with GitHub token)</option>
                  <option value="gemini">Google Gemini API (Studio key)</option>
                  <option value="openai">OpenAI API</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>AI Model</label>
                <select className="form-input" value={model} onChange={(e) => setModel(e.target.value)}>
                  {provider === "github" && (
                    <>
                      <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="meta-llama-3.1-405b-instruct">Llama 3.1 405B</option>
                      <option value="cohere-command-r-plus">Cohere Command R+</option>
                      <option value="phi-3-medium-instruct">Phi-3 Medium</option>
                    </>
                  )}
                  {provider === "gemini" && (
                    <>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                      <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    </>
                  )}
                  {provider === "openai" && (
                    <>
                      <option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label className="form-label" style={{ fontWeight: 600 }}>API Key / Access Token</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showKey ? "text" : "password"} 
                  className="form-input" 
                  style={{ paddingRight: "40px" }}
                  placeholder={
                    provider === "github" 
                      ? "Paste GitHub Personal Access Token (ghp_...)" 
                      : provider === "gemini" 
                      ? "Paste Google AI Studio API Key" 
                      : "Paste OpenAI API Key (sk-...)"
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small style={{ display: "block", color: "var(--color-text-muted)", marginTop: "6px", fontSize: "0.8rem" }}>
                {provider === "github" ? (
                  <span>
                    No scopes needed! Create a classic token in{" "}
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-gold)", textDecoration: "underline" }}>
                      GitHub settings
                    </a>.
                  </span>
                ) : provider === "gemini" ? (
                  <span>
                    Generate your key in{" "}
                    <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-gold)", textDecoration: "underline" }}>
                      Google AI Studio
                    </a>.
                  </span>
                ) : (
                  <span>
                    Manage keys in your{" "}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-gold)", textDecoration: "underline" }}>
                      OpenAI dashboard
                    </a>.
                  </span>
                )}
              </small>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button className="btn-primary" onClick={handleSaveSettings}>
                <Save size={16} /> Save Settings
              </button>
              <button className="btn-secondary" onClick={handleClearSettings}>
                Clear Credentials
              </button>
              {saveSuccess && (
                <span style={{ color: "var(--color-success)", fontSize: "0.9rem", marginLeft: "10px" }}>
                  ✓ Settings saved successfully!
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="notification-banner warning" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2rem" }}>
          <AlertTriangle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

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
            <div className="glass-panel" style={{ padding: "3rem 2rem", textAlign: "center" }}>
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
                  {aiSummary.keyPoints && aiSummary.keyPoints.map((point, idx) => (
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
