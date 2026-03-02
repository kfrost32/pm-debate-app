import { X, Download, CheckCircle2, AlertCircle, ListChecks, Award } from "lucide-react";
import { Button } from "./ui/button";
import ReactMarkdown from "react-markdown";

interface SynthesisModalProps {
  synthesis: string;
  onClose: () => void;
  onExport: () => void;
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

export function SynthesisModal({
  synthesis,
  onClose,
  onExport,
}: SynthesisModalProps) {
  const sections = parseSynthesis(synthesis);

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="border-b bg-card/50 backdrop-blur-sm shadow-subtle">
        <div className="px-8 py-5 max-w-6xl mx-auto flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Debate Summary & Recommendations
          </h2>
          <div className="flex items-center gap-2">
            <Button onClick={onExport} size="sm" className="shadow-subtle">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="space-y-6">
            {sections.agreed && (
              <div className="bg-green-50 border border-green-200/50 rounded-lg p-5 shadow-subtle">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-green-900 mb-3">
                      Where the PMs Agreed
                    </h3>
                    <div className="prose max-w-none text-green-800">
                      <ReactMarkdown>{sections.agreed}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.disagreed && (
              <div className="bg-orange-50 border border-orange-200/50 rounded-lg p-5 shadow-subtle">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-orange-900 mb-3">
                      Where They Disagreed
                    </h3>
                    <div className="prose max-w-none text-orange-800">
                      <ReactMarkdown>{sections.disagreed}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.recommendations && (
              <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-5 shadow-subtle">
                <div className="flex items-start gap-3">
                  <ListChecks className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">
                      Recommended PRD Changes
                    </h3>
                    <div className="prose max-w-none text-blue-800">
                      <ReactMarkdown>{sections.recommendations}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sections.grade && (
              <div className="bg-purple-50 border border-purple-200/50 rounded-lg p-5 shadow-subtle">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-purple-900 mb-3">
                      Overall PRD Grade
                    </h3>
                    <div className="prose max-w-none text-purple-800">
                      <ReactMarkdown>{sections.grade}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
