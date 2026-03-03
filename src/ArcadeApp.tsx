import { useState, useEffect, useRef } from "react";
import { CharacterSelect, BattleArena, RoundTransition } from "./components/arcade";
import { PrdPanel } from "./components/PrdPanel";
import { SynthesisModal } from "./components/SynthesisModal";
import { DebateOrchestrator, type DebateEventType } from "./lib/debate";
import { BattleSystem, type BattleEventType } from "./lib/battle";
import type { BattleStats } from "./lib/health";
import { calculateDamage } from "./lib/damage-calculator";
import { DEFAULT_AGENTS, type DepthLevel } from "./lib/agents";
import { cn } from "./lib/utils";

interface Message {
  agentId: string;
  content: string;
  round: number;
}

type GamePhase = 'attract' | 'prd-input' | 'character-select' | 'battle' | 'synthesis';

function ArcadeApp() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('attract');
  const [apiKey, setApiKey] = useState("");
  const [prdText, setPrdText] = useState("");
  const [rounds, setRounds] = useState(2);
  const [depth] = useState<DepthLevel>("brief");
  const [selectedAgents, setSelectedAgents] = useState<string[]>(DEFAULT_AGENTS);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [battleStats, setBattleStats] = useState<BattleStats | null>(null);
  const [showRoundTransition, setShowRoundTransition] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);

  const currentMessageRef = useRef<Message | null>(null);
  const battleSystemRef = useRef<BattleSystem | null>(null);

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

  const handleBattleEvent = (event: BattleEventType) => {
    if (event.type === 'battle_init') {
      setBattleStats(event.stats);
    } else if (event.type === 'prd_damaged') {
      setBattleStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          prdBoss: {
            ...prev.prdBoss,
            currentHp: event.newHp,
            isKnockedOut: event.newHp === 0,
          },
        };
      });
    } else if (event.type === 'round_start') {
      setCurrentRound(event.roundNumber);
      setShowRoundTransition(true);
    }
  };

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

        if (currentMessageRef.current && battleSystemRef.current) {
          calculateDamage(currentMessageRef.current.content);
          battleSystemRef.current.processAgentAttack(
            currentMessageRef.current.agentId,
            currentMessageRef.current.content
          );
        }

        currentMessageRef.current = null;
        break;

      case "synthesis_start":
        setIsTyping(true);
        setCurrentAgentId("synthesis");
        setSynthesis("");
        setGamePhase('synthesis');
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

  const startBattle = async () => {
    if (!apiKey || !prdText.trim()) {
      setError("Please provide both an API key and a PRD");
      return;
    }

    setMessages([]);
    setSynthesis(null);
    setError(null);
    setIsRunning(true);
    setShowSynthesis(false);
    setGamePhase('battle');

    battleSystemRef.current = new BattleSystem(selectedAgents, handleBattleEvent);

    const orchestrator = new DebateOrchestrator(apiKey, handleDebateEvent);
    await orchestrator.runDebate(prdText, rounds, selectedAgents, depth);
  };

  const exportDebate = () => {
    const timestamp = new Date().toISOString().split("T")[0];
    let content = `# PM FIGHT — Battle Report\n\n`;
    content += `**Date:** ${timestamp}\n`;
    content += `**Rounds:** ${rounds}\n`;
    content += `**Fighters:** ${selectedAgents.join(", ").toUpperCase()}\n\n`;
    content += `---\n\n`;
    content += `## PRD Boss Stats\n\n`;
    if (battleStats) {
      content += `Final HP: ${battleStats.prdBoss.currentHp} / ${battleStats.prdBoss.maxHp}\n\n`;
    }
    content += `## Original PRD\n\n${prdText}\n\n`;
    content += `---\n\n## Battle Log\n\n`;

    messages.forEach((msg) => {
      content += `### ${msg.agentId.toUpperCase()} - Round ${msg.round}\n\n`;
      content += `${msg.content}\n\n---\n\n`;
    });

    if (synthesis) {
      content += `## Final Synthesis\n\n${synthesis}\n`;
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pm-fight-${timestamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Attract Mode Screen
  if (gamePhase === 'attract') {
    return (
      <div className="crt-screen min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="scanlines absolute inset-0 pointer-events-none" />

        <div className="text-center relative z-10">
          <h1
            className="arcade-font text-8xl mb-8 arcade-cyan pixel-fade-in"
            style={{
              textShadow: `
                6px 6px 0 #000,
                -6px -6px 0 #000,
                6px -6px 0 #000,
                -6px 6px 0 #000,
                0 0 30px currentColor
              `,
            }}
          >
            PM FIGHT
          </h1>

          <p className="arcade-font text-xl text-white/80 mb-12 arcade-yellow">
            The Ultimate PRD Battle Arena
          </p>

          <div className="blink mb-8">
            <button
              onClick={() => setGamePhase('prd-input')}
              className="arcade-button bg-yellow-500 text-black px-16 py-6 text-lg"
            >
              INSERT COIN
            </button>
          </div>

          <div className="arcade-font text-xs text-white/40 max-w-md mx-auto">
            Test your PRDs against expert PM fighters!
          </div>
        </div>
      </div>
    );
  }

  // PRD Input Screen
  if (gamePhase === 'prd-input') {
    return (
      <div className="crt-screen min-h-screen bg-black flex flex-col">
        <div className="scanlines absolute inset-0 pointer-events-none" />

        <div className="p-8 relative z-10">
          <h2 className="arcade-font text-3xl arcade-cyan mb-6">ENTER PRD</h2>

          {/* API Key Input */}
          <div className="mb-6 max-w-2xl">
            <label className="arcade-font text-xs text-white/80 block mb-2">
              API KEY
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full bg-black border-4 border-cyan-500 p-4 text-white arcade-font text-sm"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* PRD Input */}
          <div className="mb-6">
            <PrdPanel
              value={prdText}
              onChange={setPrdText}
              disabled={false}
            />
          </div>

          {/* Settings */}
          <div className="flex gap-4 mb-6 max-w-2xl">
            <div>
              <label className="arcade-font text-xs text-white/80 block mb-2">
                ROUNDS
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRounds(num)}
                    className={cn(
                      'arcade-font text-sm px-4 py-2 border-2',
                      rounds === num
                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400'
                        : 'border-white/40 text-white/60 hover:border-white/80'
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setGamePhase('character-select')}
            disabled={!apiKey || !prdText.trim()}
            className="arcade-button bg-green-500 text-white px-12 py-4"
          >
            CONTINUE
          </button>
        </div>
      </div>
    );
  }

  // Character Select Screen
  if (gamePhase === 'character-select') {
    return (
      <CharacterSelect
        selectedAgents={selectedAgents}
        onAgentsChange={setSelectedAgents}
        onConfirm={startBattle}
        disabled={isRunning}
      />
    );
  }

  // Battle Phase
  return (
    <div className="h-screen flex flex-col">
      {error && (
        <div className="bg-red-900 border-l-4 border-red-500 px-4 py-3 arcade-font text-xs text-white z-50">
          ERROR: {error}
        </div>
      )}

      {showRoundTransition && (
        <RoundTransition
          roundNumber={currentRound}
          type="start"
          onComplete={() => setShowRoundTransition(false)}
        />
      )}

      <BattleArena
        messages={messages}
        isTyping={isTyping}
        currentAgentId={currentAgentId}
        battleStats={battleStats}
        selectedAgents={selectedAgents}
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

export default ArcadeApp;
