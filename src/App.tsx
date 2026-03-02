import { useState, useEffect, useRef } from "react";
import { SplitView } from "./components/SplitView";
import { PrdPanel } from "./components/PrdPanel";
import { DebatePanel } from "./components/DebatePanel";
import { SettingsBar } from "./components/SettingsBar";
import { SynthesisModal } from "./components/SynthesisModal";
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
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentMessageRef = useRef<Message | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("anthropic_api_key");
    if (saved) {
      setApiKey(saved);
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
        currentMessageRef.current = {
          agentId: event.agentId,
          content: "",
          round: event.round,
        };
        // Add the initial empty message immediately
        setMessages((prev) => [
          ...prev,
          {
            agentId: event.agentId,
            content: "",
            round: event.round,
          },
        ]);
        break;

      case "agent_chunk":
        if (currentMessageRef.current) {
          currentMessageRef.current.content += event.chunk;
          // Update only the last message with accumulated content
          setMessages((prev) => {
            if (prev.length === 0) return prev;
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              ...newMessages[newMessages.length - 1],
              content: currentMessageRef.current!.content,
            };
            return newMessages;
          });
        }
        break;

      case "agent_complete":
        setIsTyping(false);
        setCurrentAgentId(null);
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
        setShowSynthesis(true);
        break;

      case "debate_complete":
        setIsRunning(false);
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
    setShowSynthesis(false);

    const orchestrator = new DebateOrchestrator(apiKey, handleDebateEvent);
    await orchestrator.runDebate(prdText, rounds, selectedAgents, depth);
  };

  const exportDebate = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    let content = `# PM Debate — PRD Evaluation\n\n`;
    content += `**Date:** ${timestamp}\n`;
    content += `**Rounds:** ${rounds}\n`;
    content += `**Agents:** ${selectedAgents.join(", ").toUpperCase()}\n\n`;
    content += `---\n\n`;
    content += `## Original PRD\n\n${prdText}\n\n`;
    content += `---\n\n## Debate Transcript\n\n`;

    messages.forEach((msg) => {
      content += `### ${msg.agentId.toUpperCase()} - Round ${msg.round}\n\n`;
      content += `${msg.content}\n\n---\n\n`;
    });

    if (synthesis) {
      content += `## Synthesis & Recommendations\n\n${synthesis}\n`;
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pm-debate-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canStart = !isRunning && apiKey.trim() !== "" && prdText.trim() !== "";

  return (
    <div className="h-screen flex flex-col">
      <SettingsBar
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        rounds={rounds}
        onRoundsChange={setRounds}
        depth={depth}
        onDepthChange={setDepth}
        selectedAgents={selectedAgents}
        onAgentsChange={setSelectedAgents}
        onStart={startDebate}
        disabled={isRunning}
        canStart={canStart}
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
          <DebatePanel
            messages={messages}
            isTyping={isTyping}
            currentAgentId={currentAgentId}
            synthesis={synthesis}
            onShowSynthesis={() => setShowSynthesis(true)}
          />
        }
      />

      {showSynthesis && synthesis && (
        <SynthesisModal
          synthesis={synthesis}
          onClose={() => setShowSynthesis(false)}
          onExport={exportDebate}
        />
      )}
    </div>
  );
}

export default App;
