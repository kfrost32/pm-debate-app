import { CheckCircle2, AlertCircle, ListChecks, Award } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SynthesisPanelProps {
  synthesis: string;
}

function parseSynthesis(text: string) {
  const sections = {
    agreed: "",
    disagreed: "",
    recommendations: "",
    grade: "",
  };

  const agreementMatch = text.match(/##?\s*(?:1\.\s*)?(?:\*\*)?Where the PMs agreed(?:\*\*)?([\s\S]*?)(?=##?\s*(?:2\.\s*)?(?:\*\*)?Where they disagreed|$)/i);
  const disagreementMatch = text.match(/##?\s*(?:2\.\s*)?(?:\*\*)?Where they disagreed(?:\*\*)?([\s\S]*?)(?=##?\s*(?:3\.\s*)?(?:\*\*)?Top recommended|$)/i);
  const recommendationsMatch = text.match(/##?\s*(?:3\.\s*)?(?:\*\*)?Top recommended PRD changes(?:\*\*)?([\s\S]*?)(?=##?\s*(?:4\.\s*)?(?:\*\*)?Overall PRD grade|$)/i);
  const gradeMatch = text.match(/##?\s*(?:4\.\s*)?(?:\*\*)?Overall PRD grade(?:\*\*)?([\s\S]*?)$/i);

  if (agreementMatch) sections.agreed = agreementMatch[1].trim();
  if (disagreementMatch) sections.disagreed = disagreementMatch[1].trim();
  if (recommendationsMatch) sections.recommendations = recommendationsMatch[1].trim();
  if (gradeMatch) sections.grade = gradeMatch[1].trim();

  return sections;
}

export function SynthesisPanel({ synthesis }: SynthesisPanelProps) {
  const sections = parseSynthesis(synthesis);

  return (
    <div className="flex-1 overflow-auto p-5">
        <div className="space-y-4">
          {sections.agreed && (
            <div className="rounded-lg p-5 bg-white border">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-foreground mb-3">
                    Where the PMs Agreed
                  </h4>
                  <div className="text-sm text-foreground/80">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {sections.agreed}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sections.disagreed && (
            <div className="rounded-lg p-5 bg-white border">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-foreground mb-3">
                    Where They Disagreed
                  </h4>
                  <div className="text-sm text-foreground/80">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {sections.disagreed}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sections.recommendations && (
            <div className="rounded-lg p-5 bg-white border">
              <div className="flex items-start gap-3">
                <ListChecks className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-foreground mb-3">
                    Recommended PRD Changes
                  </h4>
                  <div className="text-sm text-foreground/80">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {sections.recommendations}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}

          {sections.grade && (
            <div className="rounded-lg p-5 bg-white border">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-semibold text-foreground mb-3">
                    Overall PRD Grade
                  </h4>
                  <div className="text-sm text-foreground/80">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {sections.grade}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
