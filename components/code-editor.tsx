"use client";

import { X } from "lucide-react";

interface CodeEditorProps {
  code: string;
  setCode: (val: string) => void;
  onClose?: () => void;
  onConfirm?: () => void; 
  isSaving?: boolean;     
}

const CodeEditor = ({ code, setCode, onClose, onConfirm, isSaving }: CodeEditorProps) => {
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"></div>
      <div
        className="relative w-[90%] max-w-3xl h-[80%] bg-card rounded-2xl shadow-2xl border 
        border-border animate-dialog-in overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-card/70 backdrop-blur-md flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Component Code</h2>
            <p className="text-xs text-muted-foreground">This is the current JSX/TSX of your component.</p>
          </div>

          {onClose && (
            <button onClick={onClose} className="p-2 rounded-md hover:bg-muted/30 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="flex-1 p-6 ">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full px-4 py-3 inspector-scroll bg-muted/60 border border-white/20
            rounded-lg text-sm font-mono text-foreground resize-none focus:outline-none"
            placeholder="Your JSX code appears here..."
          />
        </div>

        <div className="px-6 py-4 border-t border-border bg-card/70 backdrop-blur-md flex justify-end">
          <button
            onClick={onConfirm}
            disabled={isSaving || !code.trim()}
            className="px-5 py-2 rounded-lg bg-white text-black font-semibold 
            hover:bg-white/80 transition active:scale-[0.97] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
