"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import clsx from "clsx";

interface DropZoneProps {
  onFile: (file: File) => void;
  file: File | null;
  onClear: () => void;
}

export function DropZone({ onFile, file, onClear }: DropZoneProps) {
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
    },
    [onFile]
  );

  if (file) {
    return (
      <div
        className={clsx(
          "relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-12 transition-premium",
          "border-foreground/15 bg-muted/20"
        )}
      >
        <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted/50 mb-1">
          <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <button
          aria-label="Remover arquivo"
          onClick={onClear}
          className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/40 hover:text-foreground transition-premium"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Arraste um arquivo ou clique para selecionar"
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv,.json,.txt";
          input.onchange = () => { if (input.files?.[0]) onFile(input.files[0]); };
          input.click();
        }
      }}
      onClick={() => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv,.json,.txt";
        input.onchange = () => { if (input.files?.[0]) onFile(input.files[0]); };
        input.click();
      }}
      className={clsx(
        "relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-12 cursor-pointer transition-premium",
        drag && "border-foreground/40 bg-muted/50 scale-[1.01]",
        "border-border hover:border-foreground/15 hover:bg-muted/20 dot-grid"
      )}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-muted/40 mb-1">
        <Upload className="h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Arraste um arquivo ou <span className="text-foreground underline underline-offset-4 decoration-border">selecione</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">CSV, JSON ou TXT</p>
      </div>
    </div>
  );
}
