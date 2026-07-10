import { useState } from "react";
import { Minus, Square, X, Maximize2 } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = async () => {
    const isMax = await appWindow.isMaximized();
    if (isMax) {
      await appWindow.unmaximize();
      setMaximized(false);
    } else {
      await appWindow.maximize();
      setMaximized(true);
    }
  };
  const handleClose = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      style={{
        display: "flex",
        alignItems: "center",
        height: 32,
        background: "var(--bg)",
        borderBottom: "1px solid var(--border)",
        userSelect: "none",
        WebkitUserSelect: "none",
        position: "relative",
        zIndex: 100,
      }}
    >
      {/* App icon + title (draggable area) */}
      <div
        data-tauri-drag-region
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: 12,
          height: "100%",
        }}
      >
        <img
          src="/robot.png"
          alt=""
          style={{ width: 16, height: 16, borderRadius: 3, pointerEvents: "none" }}
          data-tauri-drag-region
        />
        <span
          data-tauri-drag-region
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            fontWeight: 500,
            pointerEvents: "none",
          }}
        >
          Desktop Automator
        </span>
      </div>

      {/* Window controls */}
      <div style={{ display: "flex", height: "100%" }}>
        <WindowButton onClick={handleMinimize} hoverBg="var(--surface2)">
          <Minus size={14} />
        </WindowButton>
        <WindowButton onClick={handleMaximize} hoverBg="var(--surface2)">
          {maximized ? <Square size={11} /> : <Maximize2 size={12} />}
        </WindowButton>
        <WindowButton onClick={handleClose} hoverBg="#e81123" hoverColor="white" isClose>
          <X size={14} />
        </WindowButton>
      </div>
    </div>
  );
}

function WindowButton({
  children,
  onClick,
  hoverBg,
  hoverColor,
  isClose,
}: {
  children: React.ReactNode;
  onClick: () => void;
  hoverBg: string;
  hoverColor?: string;
  isClose?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isClose ? 46 : 46,
        height: "100%",
        background: hovered ? hoverBg : "transparent",
        border: "none",
        cursor: "pointer",
        color: hovered && hoverColor ? hoverColor : "var(--text-muted)",
        transition: "background 0.1s, color 0.1s",
        borderRadius: 0,
      }}
    >
      {children}
    </button>
  );
}
