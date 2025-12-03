/**
 * Summary Viewer Component
 * Displays the AI-generated summary for a knowledge item
 */

import { Check, Copy, FileText } from "lucide-react";
import { useState } from "react";
import { copyToClipboard } from "../../../shared/utils/clipboard";
import { cn } from "../../../ui/primitives/styles";
import type { KnowledgeItem } from "../../types";

interface SummaryViewerProps {
  item: KnowledgeItem;
}

export const SummaryViewer: React.FC<SummaryViewerProps> = ({ item }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!item.summary) return;
    const result = await copyToClipboard(item.summary);
    if (result.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasSummary = item.summary && item.summary.trim().length > 0;

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
          {hasSummary && (
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

        {/* Summary Content */}
        <div
          className={cn(
            "rounded-xl border p-6",
            hasSummary
              ? "bg-black/20 border-white/10"
              : "bg-black/10 border-white/5"
          )}
        >
          {hasSummary ? (
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {item.summary}
            </p>
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

        {/* Metadata */}
        {hasSummary && (
          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>{item.summary?.length || 0} characters</span>
            <span>Generated during crawl/upload</span>
          </div>
        )}
      </div>
    </div>
  );
};
