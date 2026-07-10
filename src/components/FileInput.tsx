import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "file" to pick a file, "folder" to pick a directory */
  mode?: "file" | "folder";
  /** File extension filters. E.g. [{ name: "Ejecutables", extensions: ["exe","bat","cmd"] }] */
  filters?: { name: string; extensions: string[] }[];
  style?: React.CSSProperties;
}

export function FileInput({
  value,
  onChange,
  placeholder = "Seleccionar archivo...",
  mode = "file",
  filters,
  style,
}: Props) {
  const handleBrowse = async () => {
    try {
      if (mode === "folder") {
        const selected = await open({
          directory: true,
          title: "Seleccionar carpeta",
        });
        if (selected) onChange(selected as string);
      } else {
        const selected = await open({
          multiple: false,
          title: "Seleccionar archivo",
          filters: filters ?? [{ name: "Todos los archivos", extensions: ["*"] }],
        });
        if (selected) onChange(selected as string);
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div style={{ display: "flex", gap: 4, alignItems: "stretch", marginTop: 4, ...style }}>
      <input
        style={{
          flex: 1,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: "6px 0 0 6px",
          color: "var(--text)",
          padding: "6px 10px",
          fontSize: 13,
          minWidth: 0,
        }}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        onClick={handleBrowse}
        title="Examinar..."
        style={{
          background: "var(--accent)",
          border: "none",
          borderRadius: "0 6px 6px 0",
          color: "white",
          padding: "0 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <FolderOpen size={14} />
      </button>
    </div>
  );
}
