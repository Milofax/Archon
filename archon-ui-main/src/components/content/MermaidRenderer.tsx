import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

interface MermaidRendererProps {
  chart: string;
  id?: string;
  className?: string;
}

/**
 * Mermaid diagram renderer with glassmorphic styling
 * Supports dark/light theme with automatic detection
 */
export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  chart,
  id,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get theme from document
  const isDarkMode = document.documentElement.classList.contains("dark");

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !chart.trim()) return;

      setIsRendered(false);
      setError(null);

      try {
        // Initialize mermaid with theme
        mermaid.initialize({
          startOnLoad: false,
          theme: isDarkMode ? "dark" : "default",
          securityLevel: "loose",
          themeVariables: isDarkMode
            ? {
                // Dark theme - glassmorphic style
                primaryColor: "rgba(59, 130, 246, 0.15)",
                primaryTextColor: "#e0e7ff",
                primaryBorderColor: "rgba(59, 130, 246, 0.5)",
                lineColor: "rgba(96, 165, 250, 0.6)",
                secondaryColor: "rgba(147, 51, 234, 0.15)",
                tertiaryColor: "rgba(236, 72, 153, 0.15)",
                background: "rgba(17, 24, 39, 0.5)",
                mainBkg: "rgba(30, 41, 59, 0.8)",
                secondBkg: "rgba(51, 65, 85, 0.6)",
                tertiaryBkg: "rgba(71, 85, 105, 0.4)",
                secondaryBorderColor: "rgba(147, 51, 234, 0.5)",
                tertiaryBorderColor: "rgba(236, 72, 153, 0.5)",
                labelTextColor: "#e0e7ff",
                nodeTextColor: "#e0e7ff",
                textColor: "#cbd5e1",
                clusterBkg: "rgba(30, 41, 59, 0.3)",
                clusterBorder: "rgba(59, 130, 246, 0.4)",
                defaultLinkColor: "#60a5fa",
                edgeLabelBackground: "rgba(30, 41, 59, 0.9)",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
              }
            : {
                // Light theme - glassmorphic style
                primaryColor: "rgba(219, 234, 254, 0.8)",
                primaryTextColor: "#1e3a8a",
                primaryBorderColor: "rgba(59, 130, 246, 0.3)",
                lineColor: "rgba(59, 130, 246, 0.5)",
                secondaryColor: "rgba(237, 233, 254, 0.8)",
                tertiaryColor: "rgba(252, 231, 243, 0.8)",
                background: "rgba(255, 255, 255, 0.8)",
                mainBkg: "rgba(219, 234, 254, 0.6)",
                secondBkg: "rgba(237, 233, 254, 0.4)",
                tertiaryBkg: "rgba(252, 231, 243, 0.4)",
                secondaryBorderColor: "rgba(147, 51, 234, 0.3)",
                tertiaryBorderColor: "rgba(236, 72, 153, 0.3)",
                labelTextColor: "#1e3a8a",
                nodeTextColor: "#1e3a8a",
                textColor: "#334155",
                clusterBkg: "rgba(248, 250, 252, 0.8)",
                clusterBorder: "rgba(59, 130, 246, 0.2)",
                defaultLinkColor: "#3b82f6",
                edgeLabelBackground: "rgba(255, 255, 255, 0.95)",
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
              },
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: "basis",
          },
        });

        // Clean the chart content
        const cleanedChart = chart.replace(/<br\s*\/?>/gi, "\\n").trim();

        // Clear container
        containerRef.current.innerHTML = "";

        // Generate unique ID for this render
        const graphId = `mermaid-${id || Math.random().toString(36).substr(2, 9)}`;

        // Render the diagram
        const { svg } = await mermaid.render(graphId, cleanedChart);

        // Insert the SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }

        setIsRendered(true);
      } catch (err) {
        console.error("Mermaid render error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
        setIsRendered(true);
      }
    };

    renderDiagram();
  }, [chart, id, isDarkMode]);

  if (error) {
    return (
      <div className={`my-6 ${className}`}>
        <div className="relative backdrop-blur-md bg-gradient-to-b from-red-50/80 to-red-50/60 dark:from-red-500/10 dark:to-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-6">
          <div className="text-sm text-red-600 dark:text-red-400 mb-2">
            Diagram rendering failed:
          </div>
          <pre className="text-xs font-mono overflow-auto text-gray-700 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-800/50 p-3 rounded">
            {chart}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-6 ${className}`}>
      <div className="relative backdrop-blur-md bg-gradient-to-b from-white/80 to-white/60 dark:from-white/10 dark:to-black/30 border border-blue-200 dark:border-blue-500/30 rounded-xl p-6 shadow-[0_10px_30px_-15px_rgba(59,130,246,0.15)] dark:shadow-[0_10px_30px_-15px_rgba(59,130,246,0.5)] overflow-hidden">
        {/* Gradient overlay at top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-blue-100/50 to-transparent dark:from-blue-500/20 dark:to-transparent pointer-events-none" />

        {!isRendered && (
          <div className="text-center text-gray-500 dark:text-gray-400 relative z-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3" />
            <p className="text-sm">Rendering diagram...</p>
          </div>
        )}

        <div
          ref={containerRef}
          className="mermaid-container relative z-10 [&>svg]:max-w-full [&>svg]:mx-auto [&>svg]:drop-shadow-lg dark:[&>svg]:drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]"
          style={{ display: isRendered ? "block" : "none" }}
        />
      </div>
    </div>
  );
};

/**
 * Utility function to detect if content contains a mermaid diagram
 */
export const containsMermaidDiagram = (content: string): boolean => {
  const mermaidPatterns = [
    /```mermaid/i,
    /graph\s+(TB|BT|LR|RL|TD)/i,
    /flowchart\s+(TB|BT|LR|RL|TD)/i,
    /sequenceDiagram/i,
    /classDiagram/i,
    /stateDiagram/i,
    /erDiagram/i,
    /pie\s+title/i,
    /gantt/i,
  ];

  return mermaidPatterns.some((pattern) => pattern.test(content));
};

/**
 * Extract mermaid diagram from markdown code block
 */
export const extractMermaidDiagram = (
  content: string
): { diagram: string; rest: string } | null => {
  const mermaidBlockRegex = /```mermaid\s*([\s\S]*?)```/i;
  const match = content.match(mermaidBlockRegex);

  if (match) {
    return {
      diagram: match[1].trim(),
      rest: content.replace(match[0], "").trim(),
    };
  }

  return null;
};
