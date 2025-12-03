/**
 * Summary Viewer Component
 * Displays the AI-generated summary for a knowledge item
 */

import { Check, Copy, Edit3, Eye, FileText, Loader2, RefreshCw, Save, X } from "lucide-react";
import Prism from "prismjs";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { MermaidRenderer } from "@/components/content/MermaidRenderer";
import { copyToClipboard } from "../../../shared/utils/clipboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../ui/primitives/alert-dialog";
import { cn } from "../../../ui/primitives/styles";
import { useRegenerateSummary, useUpdateKnowledgeItem } from "../../hooks";
import type { KnowledgeItem } from "../../types";

// Import Prism theme and languages for code blocks in summaries
import "prismjs/themes/prism-tomorrow.css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";

interface SummaryViewerProps {
  item: KnowledgeItem;
}

// Highlight code with Prism (from ContentViewer pattern)
const highlightCode = (code: string, language?: string): string => {
  try {
    const lang = language?.toLowerCase() || "javascript";
    const grammar = Prism.languages[lang] || Prism.languages.javascript;
    return Prism.highlight(code, grammar, lang);
  } catch (error) {
    console.error("Prism highlighting failed:", error);
    return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
};

export const SummaryViewer: React.FC<SummaryViewerProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);
  const [localSummary, setLocalSummary] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");
  const [editedSummary, setEditedSummary] = useState<string>("");
  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);
  const regenerateMutation = useRegenerateSummary();
  const updateMutation = useUpdateKnowledgeItem();

  const handleCopy = async () => {
    const summaryText = localSummary || item.summary;
    if (!summaryText) return;
    const result = await copyToClipboard(summaryText);
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateClick = () => {
    // If user has edited the summary, show warning first
    if (localSummary) {
      setShowRegenerateWarning(true);
    } else {
      performRegenerate();
    }
  };

  const performRegenerate = async () => {
    setShowRegenerateWarning(false);
    const result = await regenerateMutation.mutateAsync(item.source_id);
    if (result.summary) {
      setLocalSummary(result.summary);
    }
  };

  const handleEditStart = () => {
    setEditedSummary(displaySummary || "");
    setViewMode("edit");
  };

  const handleEditCancel = () => {
    setViewMode("view");
    setEditedSummary("");
  };

  const handleEditSave = async () => {
    try {
      await updateMutation.mutateAsync({
        sourceId: item.source_id,
        updates: { summary: editedSummary },
      });
      setLocalSummary(editedSummary);
      setViewMode("view");
    } catch (error) {
      // Error handling is done by the mutation hook (shows toast)
      console.error("Failed to save summary:", error);
    }
  };

  const displaySummary = localSummary || item.summary;
  const hasSummary = displaySummary && displaySummary.trim().length > 0;

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Summary</h3>
              <p className="text-sm text-gray-400">AI-generated overview of this knowledge source</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("view")}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  viewMode === "view"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Eye className="w-4 h-4" />
                Beautiful
              </button>
              <button
                type="button"
                onClick={handleEditStart}
                disabled={!hasSummary}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  viewMode === "edit"
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-gray-400 hover:text-white",
                  !hasSummary && "opacity-50 cursor-not-allowed"
                )}
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
            </div>

            {/* Copy Button (only in view mode) */}
            {hasSummary && viewMode === "view" && (
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  copied
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                )}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Summary Content */}
        {viewMode === "edit" ? (
          /* Edit Mode: Textarea with Live Preview */
          <div className="space-y-4">
            {/* Editor */}
            <div className="rounded-xl border border-purple-500/30 bg-black/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-purple-500/20 bg-purple-500/5">
                <span className="text-xs text-purple-400 font-medium">Markdown Editor</span>
              </div>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="w-full h-64 p-4 bg-transparent text-gray-200 font-mono text-sm resize-none focus:outline-none placeholder-gray-500"
                placeholder="Enter your summary in Markdown format..."
              />
            </div>

            {/* Live Preview */}
            <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
              <div className="px-4 py-2 border-b border-white/10 bg-white/5">
                <span className="text-xs text-gray-400 font-medium">Live Preview</span>
              </div>
              <div className="p-4 max-h-64 overflow-auto">
                {editedSummary.trim() ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-headings:text-cyan-400 prose-a:text-cyan-400 prose-code:text-purple-400 prose-strong:text-white prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-200">{children}</p>,
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-6 text-cyan-400">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-5 text-cyan-400">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-4 text-cyan-400">{children}</h3>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-200">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-200">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                        code: ({ className, children, ...props }) => {
                          const match = /language-(\w+)/.exec(className || "");
                          const language = match ? match[1] : "";
                          if (language === "mermaid" && typeof children === "string") {
                            return <MermaidRenderer chart={children} />;
                          }
                          if (!className) {
                            return <code className="px-1.5 py-0.5 rounded bg-black/30 text-purple-400" {...props}>{children}</code>;
                          }
                          const code = String(children).replace(/\n$/, "");
                          return (
                            <pre className="bg-black/30 border border-white/10 rounded-lg p-4 overflow-x-auto my-4">
                              <code
                                className={`language-${language} font-mono text-sm`}
                                dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
                              />
                            </pre>
                          );
                        },
                      }}
                    >
                      {editedSummary}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Start typing to see preview...</p>
                )}
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleEditCancel}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={updateMutation.isPending || !editedSummary.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                  "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
                  "hover:bg-cyan-500/30 hover:border-cyan-500/40",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode: Beautiful Markdown Rendering */
          <div
            className={cn(
              "rounded-xl border p-6",
              hasSummary
                ? "bg-black/20 border-white/10"
                : "bg-black/10 border-white/5",
              regenerateMutation.isPending && "opacity-50"
            )}
          >
            {regenerateMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span className="ml-3 text-gray-400">Generating detailed summary...</span>
              </div>
            ) : hasSummary ? (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-cyan-400 prose-a:text-cyan-400 prose-code:text-purple-400 prose-strong:text-white prose-pre:bg-black/30 prose-pre:border prose-pre:border-white/10">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-200">{children}</p>,
                    h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-6 text-cyan-400">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-bold mb-3 mt-5 text-cyan-400">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-4 text-cyan-400">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-gray-200">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-200">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const language = match ? match[1] : "";

                      // Render mermaid diagrams
                      if (language === "mermaid" && typeof children === "string") {
                        return <MermaidRenderer chart={children} />;
                      }

                      // Inline code (no language class)
                      if (!className) {
                        return <code className="px-1.5 py-0.5 rounded bg-black/30 text-purple-400" {...props}>{children}</code>;
                      }

                      // Code block with syntax highlighting
                      const code = String(children).replace(/\n$/, "");
                      return (
                        <pre className="bg-black/30 border border-white/10 rounded-lg p-4 overflow-x-auto my-4">
                          <code
                            className={`language-${language} font-mono text-sm`}
                            dangerouslySetInnerHTML={{
                              __html: highlightCode(code, language),
                            }}
                          />
                        </pre>
                      );
                    },
                  }}
                >
                  {displaySummary}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No summary available</p>
                <p className="text-sm text-gray-500">
                  This knowledge source doesn't have an AI-generated summary yet.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer with metadata and regenerate button (only in view mode) */}
        {viewMode === "view" && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {hasSummary && (
                <>
                  <span>{displaySummary?.length || 0} characters</span>
                  <span className="mx-2">•</span>
                  <span>{localSummary ? "Regenerated" : "Generated during crawl/upload"}</span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={handleRegenerateClick}
              disabled={regenerateMutation.isPending}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
                "hover:bg-cyan-500/20 hover:border-cyan-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {regenerateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Regenerate Summary
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Regenerate Warning Dialog */}
      <AlertDialog open={showRegenerateWarning} onOpenChange={setShowRegenerateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Overwrite Manual Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have manually edited this summary. Regenerating will replace your changes with a new AI-generated summary.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={cn(
                "px-4 py-2 rounded-lg text-sm",
                "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white",
                "transition-colors"
              )}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performRegenerate}
              className={cn(
                "px-4 py-2 rounded-lg text-sm",
                "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
                "hover:bg-cyan-500/30 hover:border-cyan-500/40",
                "transition-colors"
              )}
            >
              Regenerate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
