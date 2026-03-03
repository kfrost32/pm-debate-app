import { AlertTriangle, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";

export function ApiKeyWarning() {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("api_key_warning_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("api_key_warning_dismissed", "true");
  };

  if (isDismissed) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-yellow-900 mb-1">
            Security Notice
          </h4>
          <p className="text-xs text-yellow-800 leading-relaxed">
            Your API key is stored in browser localStorage. For security, we recommend using a{" "}
            <a
              href="https://docs.anthropic.com/en/api/getting-started#api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-yellow-900"
            >
              restricted API key
            </a>
            {" "}with spending limits. Never use production keys with sensitive data access.
            Your key never leaves your browser - all API calls are made directly from your device.
          </p>
        </div>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="flex-shrink-0 h-8 w-8 p-0 text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
