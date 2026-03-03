import { useState, useEffect, useRef } from "react";
import { SplitView } from "./components/SplitView";
import { PrdPanel } from "./components/PrdPanel";
import { RightPanel } from "./components/RightPanel";
import { SettingsBar } from "./components/SettingsBar";
import { AboutModal } from "./components/AboutModal";
import { DebateOrchestrator, type DebateEventType } from "./lib/debate";
import { DEFAULT_AGENTS, type DepthLevel } from "./lib/agents";

interface Message {
  agentId: string;
  content: string;
  round: number;
}

function App() {
  const [apiKey, setApiKey] = useState("");
  const [prdText, setPrdText] = useState("");
  const [rounds, setRounds] = useState(2);
  const [depth, setDepth] = useState<DepthLevel>("brief");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(DEFAULT_AGENTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("debate");
  const [error, setError] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [hasCompletedDebate, setHasCompletedDebate] = useState(false);

  const currentMessageRef = useRef<Message | null>(null);
  const orchestratorRef = useRef<DebateOrchestrator | null>(null);

  useEffect(() => {
    // Check for environment variable first, then fall back to localStorage
    const envKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    const saved = localStorage.getItem("anthropic_api_key");

    if (envKey) {
      setApiKey(envKey);
    } else if (saved) {
      setApiKey(saved);
    }

    // Show about modal on first visit
    const hasVisited = localStorage.getItem("pm_debate_has_visited");
    if (!hasVisited) {
      setShowAboutModal(true);
      localStorage.setItem("pm_debate_has_visited", "true");
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("anthropic_api_key", apiKey);
    }
  }, [apiKey]);

  const handleDebateEvent = (event: DebateEventType) => {
    switch (event.type) {
      case "agent_start":
        setIsTyping(true);
        setCurrentAgentId(event.agentId);
        setCurrentRound(event.round);
        currentMessageRef.current = {
          agentId: event.agentId,
          content: "",
          round: event.round,
        };
        break;

      case "agent_chunk":
        if (currentMessageRef.current) {
          currentMessageRef.current.content += event.chunk;
        }
        break;

      case "agent_complete":
        if (currentMessageRef.current && currentMessageRef.current.content.trim()) {
          const completedMessage = { ...currentMessageRef.current };
          setMessages((prev) => [...prev, completedMessage]);
        }
        setIsTyping(false);
        setCurrentAgentId(null);
        setCurrentRound(0);
        currentMessageRef.current = null;
        break;

      case "synthesis_start":
        setIsTyping(true);
        setCurrentAgentId("synthesis");
        setSynthesis("");
        break;

      case "synthesis_chunk":
        setSynthesis((prev) => (prev || "") + event.chunk);
        break;

      case "synthesis_complete":
        setIsTyping(false);
        setCurrentAgentId(null);
        setSynthesis(event.content);
        setActiveTab("synthesis");
        break;

      case "debate_complete":
        setIsRunning(false);
        setHasCompletedDebate(true);
        orchestratorRef.current = null;
        break;

      case "debate_cancelled":
        setIsRunning(false);
        setIsTyping(false);
        setCurrentAgentId(null);
        orchestratorRef.current = null;
        break;

      case "error":
        setError(event.error);
        setIsRunning(false);
        setIsTyping(false);
        setCurrentAgentId(null);
        break;
    }
  };

  const startDebate = async () => {
    if (!apiKey || !prdText.trim()) {
      setError("Please provide both an API key and a PRD");
      return;
    }

    setMessages([]);
    setSynthesis(null);
    setError(null);
    setIsRunning(true);
    setActiveTab("debate");

    const orchestrator = new DebateOrchestrator(apiKey, handleDebateEvent);
    orchestratorRef.current = orchestrator;
    await orchestrator.runDebate(prdText, rounds, selectedAgents, depth);
  };

  const stopDebate = () => {
    if (orchestratorRef.current) {
      orchestratorRef.current.cancelDebate();
    }
  };

  const clearDebate = () => {
    setMessages([]);
    setSynthesis(null);
    setError(null);
    setActiveTab("debate");
    setHasCompletedDebate(false);
  };

  const canStart = !isRunning && apiKey.trim() !== "" && prdText.trim() !== "";

  return (
    <div className="h-screen flex flex-col">
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />

      <SettingsBar
        rounds={rounds}
        onRoundsChange={setRounds}
        depth={depth}
        onDepthChange={setDepth}
        selectedAgents={selectedAgents}
        onAgentsChange={setSelectedAgents}
        onStart={startDebate}
        onStop={stopDebate}
        onClear={clearDebate}
        disabled={isRunning}
        canStart={canStart}
        isRunning={isRunning}
        onShowAbout={() => setShowAboutModal(true)}
        hasCompletedDebate={hasCompletedDebate}
      />

      {error && (
        <div className="bg-destructive/10 border-l-4 border-destructive px-4 py-3">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <SplitView
        left={
          <PrdPanel
            value={prdText}
            onChange={setPrdText}
            disabled={isRunning}
          />
        }
        right={
          <RightPanel
            messages={messages}
            isTyping={isTyping}
            currentAgentId={currentAgentId}
            currentRound={currentRound}
            synthesis={synthesis}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalRounds={rounds}
          />
        }
      />
    </div>
  );
}

export default App;
