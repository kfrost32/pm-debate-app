import { X } from "lucide-react";
import { Button } from "./ui/button";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card rounded-lg shadow-elevated max-w-lg w-full mx-4 p-6 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              About PM Debate
            </h2>
            <p className="text-sm text-muted-foreground">
              A multi-agent debate tool for PRD evaluation
            </p>
          </div>

          <div className="space-y-3 text-sm text-foreground/90">
            <p>
              This app uses multiple AI agents, each with different product management focuses and biases, to debate your PRD across rounds. They have separate context about the PRD and respond to each other, push back on ideas, and hopefully uncover things a single pass would miss.
            </p>

            <p>
              Ideally, the collision of perspectives surfaces additional tensions and edge cases. After the agents debate, you'll get a final summary of where they agreed/disagreed and actionable recommendations.
            </p>

            <p className="text-xs text-muted-foreground pt-2">
              Built by{" "}
              <a
                href="https://kylefrost.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Kyle Frost
              </a>
              {" "}• Powered by Claude 3.5 Sonnet
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={onClose} size="sm" className="w-full">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
