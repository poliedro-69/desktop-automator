import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
}

const STORAGE_KEY = "desktopautomator-panel-width";

function getStoredWidth(defaultVal: number): number {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v) return Math.max(280, Math.min(800, Number(v)));
  } catch {}
  return defaultVal;
}

export function ResizablePanels({
  left,
  right,
  defaultLeftWidth = 420,
  minLeftWidth = 280,
  maxLeftWidth = 700,
}: Props) {
  const [leftWidth, setLeftWidth] = useState(() => getStoredWidth(defaultLeftWidth));
  const dragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clamped = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));
      setLeftWidth(clamped);
    };

    const onMouseUp = () => {
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Persist
        try { localStorage.setItem(STORAGE_KEY, String(leftWidth)); } catch {}
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [leftWidth, minLeftWidth, maxLeftWidth]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left panel */}
      <div
        style={{
          width: leftWidth,
          minWidth: minLeftWidth,
          maxWidth: maxLeftWidth,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {left}
      </div>

      {/* Divider / drag handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: 5,
          cursor: "col-resize",
          background: "var(--border)",
          position: "relative",
          flexShrink: 0,
          transition: "background 0.12s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent)")}
        onMouseLeave={(e) => {
          if (!dragging.current) e.currentTarget.style.background = "var(--border)";
        }}
      >
        {/* Visual grip dots */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            opacity: 0.5,
          }}
        >
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)" }} />
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)" }} />
          <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)" }} />
        </div>
      </div>

      {/* Right panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {right}
      </div>
    </div>
  );
}
