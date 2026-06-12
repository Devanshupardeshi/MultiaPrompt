"use client";

import { useState, useCallback } from "react";

interface OutputDisplayProps {
  json: string | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  hasImage?: boolean;
}

function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "json-number";
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = "json-key";
        } else {
          cls = "json-string";
        }
      } else if (/true|false/.test(match)) {
        cls = "json-boolean";
      } else if (/null/.test(match)) {
        cls = "json-null";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

export function OutputDisplay({
  json,
  isLoading,
  error,
  onRegenerate,
  hasImage,
}: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!json) return;
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = json;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [json]);

  const handleDownload = useCallback(() => {
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [json]);

  if (!json && !isLoading && !error) {
    return (
      <section className="px-6 py-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center">
            <div className="text-white/15 mb-3">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="mx-auto"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <p className="text-sm text-white/20 font-body">
              Your generated JSON prompt will appear here
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 py-8">
      <div className="max-w-[1200px] mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-white/20" />
          <span className="text-xs text-white/30 font-body uppercase tracking-[0.2em]">
            Generated Prompt
          </span>
        </div>

        {/* Error state */}
        {error && (
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-5 mb-4">
            <p className="text-sm text-red-400 font-body">{error}</p>
            <button
              onClick={onRegenerate}
              className="btn-multia btn-multia-sm mt-3"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="code-block">
            <div className="code-block-header">
              <span className="text-xs text-white/30 font-mono">
                prompt.json
              </span>
              <span className="text-[11px] text-white/20">generating...</span>
            </div>
            <div className="code-block-body space-y-2">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton-pulse h-4 rounded"
                  style={{
                    width: `${Math.random() * 40 + 40}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reference Image Reminder */}
        {hasImage && json && !isLoading && (
          <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-4 mb-4 flex gap-3 items-start">
            <span className="text-yellow-500/80 text-lg leading-none">💡</span>
            <div>
              <p className="text-sm text-yellow-500/80 font-body font-medium mb-1">Remember Your Reference Image!</p>
              <p className="text-[13px] text-yellow-500/60 font-body">
                Be sure to provide the same reference image to the final AI generation tool along with this prompt to get the best result.
              </p>
            </div>
          </div>
        )}

        {/* JSON output */}
        {json && !isLoading && (
          <div className="code-block">
            <div className="code-block-header">
              <span className="text-xs text-white/40 font-mono">
                prompt.json
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5"
                  id="copy-button"
                >
                  {copied ? (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                        />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5"
                  id="download-button"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            <div className="code-block-body custom-scrollbar max-h-[500px] overflow-y-auto">
              <pre>
                <code
                  dangerouslySetInnerHTML={{
                    __html: syntaxHighlight(
                      JSON.stringify(JSON.parse(json), null, 2)
                    ),
                  }}
                />
              </pre>
            </div>

            {/* Actions below */}
            <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-white/15 font-body">
                {JSON.stringify(JSON.parse(json)).length} bytes
              </span>
              <button
                onClick={onRegenerate}
                className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5"
                id="regenerate-button"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Regenerate
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
