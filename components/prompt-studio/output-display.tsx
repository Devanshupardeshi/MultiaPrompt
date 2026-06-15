"use client";

import { useState, useCallback } from "react";

import { GenerationMode } from "./input-form";

interface OutputDisplayProps {
  json: string | null;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  hasImage?: boolean;
  mode?: GenerationMode;
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
  mode,
}: OutputDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [activeLayer, setActiveLayer] = useState(0);

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

        {/* JSON output — standard modes */}
        {json && !isLoading && mode !== "3d_website" && (
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

        {/* 3D Website — 5-Layer Creative Brief output */}
        {json && !isLoading && mode === "3d_website" && (() => {
          let parsed: any = {};
          try { parsed = JSON.parse(json); } catch { parsed = {}; }
          const layers = [
            { key: "layer_1_fonts", label: "01 — Fonts", icon: "Aa" },
            { key: "layer_2_color", label: "02 — Color", icon: "🎨" },
            { key: "layer_3_glass", label: "03 — Glass", icon: "✨" },
            { key: "layer_4_layout", label: "04 — Layout", icon: "📐" },
            { key: "layer_5_motion", label: "05 — Motion", icon: "🎬" },
            { key: "full_prompt", label: "Full Prompt", icon: "📋" },
          ];

          const handleCopyLayer = async (text: string) => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              const ta = document.createElement("textarea");
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          };

          return (
            <div className="space-y-4">
              {/* Layer tabs */}
              <div className="flex flex-wrap gap-2 p-1 bg-white/5 rounded-lg border border-white/10">
                {layers.map((layer, i) => (
                  <button
                    key={layer.key}
                    onClick={() => setActiveLayer(i)}
                    className={`px-3 py-2 text-xs font-body uppercase tracking-wider rounded transition-colors flex items-center gap-1.5 ${
                      activeLayer === i ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                  >
                    <span>{layer.icon}</span>
                    {layer.label}
                  </button>
                ))}
              </div>

              {/* Active layer content */}
              <div className="code-block">
                <div className="code-block-header">
                  <span className="text-xs text-white/40 font-mono">
                    {layers[activeLayer].label}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLayer(parsed[layers[activeLayer].key] || "")}
                      className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5"
                    >
                      {copied ? "Copied!" : "Copy Layer"}
                    </button>
                    <button
                      onClick={() => handleCopyLayer(parsed.full_prompt || "")}
                      className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 border border-white/10"
                    >
                      📋 Copy Full Prompt
                    </button>
                  </div>
                </div>

                <div className="code-block-body custom-scrollbar max-h-[600px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed font-body">
                    {parsed[layers[activeLayer].key] || "No content generated for this layer."}
                  </pre>
                </div>

                <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-white/15 font-body">
                    Layer {activeLayer + 1} of {layers.length}
                  </span>
                  <button
                    onClick={onRegenerate}
                    className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Deep Research — 10-Section Research output */}
        {json && !isLoading && mode === "deep_research" && (() => {
          let parsed: any = {};
          try { parsed = JSON.parse(json); } catch { parsed = {}; }
          const sections = [
            { key: "section_01_executive_summary", label: "Executive Summary",  },
            { key: "section_02_market_landscape", label: "Market Landscape", },
            { key: "section_03_competitor_deep_dive", label: "Competitor Deep Dive", },
            { key: "section_04_brand_strategy", label: "Brand Strategy", },
            { key: "section_05_visual_identity", label: "Visual Identity",  },
            { key: "section_06_messaging_content", label: "Messaging & Content", },
            { key: "section_07_website_strategy", label: "Website Strategy", },
            { key: "section_08_website_sitemap", label: "Website Sitemap",  },
            { key: "section_09_design_system", label: "Design System", },
            { key: "section_10_action_plan", label: "Action Plan", },
            { key: "full_report", label: "Full Report",  },
          ];

          const handleCopySection = async (text: string) => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              const ta = document.createElement("textarea");
              ta.value = text;
              document.body.appendChild(ta);
              ta.select();
              document.execCommand("copy");
              document.body.removeChild(ta);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }
          };

          const handleDownloadReport = () => {
            const reportText = parsed.full_report || Object.entries(parsed)
              .filter(([k]) => k.startsWith("section_"))
              .map(([, v]) => v)
              .join("\n\n---\n\n");
            const blob = new Blob([reportText], { type: "text/markdown" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `research-report-${Date.now()}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          };

          return (
            <div className="space-y-4">
              {/* Section tabs — scrollable */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-lg border border-white/10">
                {sections.map((section, i) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveLayer(i)}
                    className={`px-2.5 py-2 text-[10px] font-body uppercase tracking-wider rounded transition-colors flex items-center gap-1 ${
                      activeLayer === i ? "bg-white text-black" : "text-white/50 hover:text-white"
                    }`}
                  >
                    <span className="text-xs">{section.icon}</span>
                    <span className="hidden sm:inline">{section.label}</span>
                    <span className="sm:hidden">{section.label.split(" ")[0]}</span>
                  </button>
                ))}
              </div>

              {/* Active section content */}
              <div className="code-block">
                <div className="code-block-header">
                  <span className="text-xs text-white/40 font-body flex items-center gap-2">
                    <span>{sections[activeLayer]?.icon}</span>
                    {sections[activeLayer]?.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopySection(parsed[sections[activeLayer]?.key] || "")}
                      className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5"
                    >
                      {copied ? "Copied!" : "Copy Section"}
                    </button>
                    <button
                      onClick={() => handleCopySection(parsed.full_report || "")}
                      className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 border border-white/10"
                    >
                      📄 Copy Full Report
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 border border-white/10"
                    >
                      ⬇ Download .md
                    </button>
                  </div>
                </div>

                <div className="code-block-body custom-scrollbar max-h-[700px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed font-body">
                    {parsed[sections[activeLayer]?.key] || "No content generated for this section."}
                  </pre>
                </div>

                <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-white/15 font-body">
                    Section {activeLayer + 1} of {sections.length}
                    {parsed[sections[activeLayer]?.key] && (
                      <> · {parsed[sections[activeLayer]?.key].length.toLocaleString()} chars</>
                    )}
                  </span>
                  <button
                    onClick={onRegenerate}
                    className="text-[11px] text-white/30 hover:text-white/70 transition-colors font-body uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
