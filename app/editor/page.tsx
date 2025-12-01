"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import InspectorPanel from "@/components/inspector-panel";
import PreviewCanvas from "@/components/preview-canvas";
import CodeEditor from "@/components/code-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useEditorState } from "@/hooks/use-editor";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function EditorPage() {
  const previewRef = useRef<any>(null);
  const state = useEditorState(previewRef);

  const handleCopyCode = async () => {
    try {
      const codeToCopy = state.generatedJsx || state.customCode;
      if (!codeToCopy) return;

      await navigator.clipboard.writeText(codeToCopy);
      state.setCopiedCode(true);
      setTimeout(() => state.setCopiedCode(false), 1200);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-border px-6 py-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {!state.isEditingCompleted ? (
          <div className="flex-1 flex items-center justify-center px-6 relative">
            {state.isLoadingComponent ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : state.loadError ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-red-500">❌ {state.loadError}</p>
                <Button onClick={() => window.location.replace("/editor")}>
                  Start New
                </Button>
              </div>
            ) : (
              <CodeEditor
                code={state.customCode}
                setCode={state.setCustomCode}
                onConfirm={state.handleCodeConfirmed}
                isSaving={state.isCreatingRecord}
              />
            )}
          </div>
        ) : (
          <>
            <InspectorPanel
              selectedElement={state.selectedElementPath}
              selectedRid={state.selectedRid}
              previewRef={previewRef}
              elementProps={state.elementProps}
              setElementProps={state.setElementProps}
              onElementMutated={() => {
                setTimeout(async () => {
                  try {
                    await state.captureSnapshot(false);
                  } catch (e) {}
                }, 350);
              }}
            />
            <div className="flex-1 flex flex-col border-l border-border bg-card">
              <Tabs
                value={state.activeTab}
                onValueChange={(v) => state.setActiveTab(v as any)}
                className="flex-1 flex flex-col"
              >
                <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/80">
                  <TabsList className="grid grid-cols-2 w-48 bg-muted/60">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Code</TabsTrigger>
                  </TabsList>
                  <div>
                    <Badge
                      className={`  
    ${
      state.autosaveLabel === "Saving…"
        ? "animate-pulse text-blue-500 bg-blue-100"
        : ""
    }
    ${state.autosaveLabel === "Saved" ? "text-green-500 bg-green-100" : ""}
    ${state.autosaveLabel === "Save Failed" ? "text-red-500" : ""}`}
                    >
                      {" "}
                      {state.autosaveLabel}
                    </Badge>{" "}
                  </div>
                </div>
                <TabsContent value="preview" className="flex-1 m-0 ">
                  <div
                    className={
                      state.saveStatus === "saving"
                        ? "animate-pulse ring-2 ring-blue-400"
                        : ""
                    }
                  >
                    <PreviewCanvas
                      ref={previewRef}
                      customCode={state.customCode}
                      onSelect={state.handleElementSelect}
                    />
                  </div>
                </TabsContent>
                <TabsContent value="code" className="flex-1 m-0">
                  <div className="flex-1 px-6 py-4 w-full h-full **flex flex-col**">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-foreground">
                        {state.generatedJsx
                          ? "Serialized JSX"
                          : "Original Code"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!state.customCode && !state.generatedJsx}
                          onClick={handleCopyCode}
                        >
                          {state.copiedCode ? "Copied! 🎉" : "Copy"}
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto h-screen inspector-scroll rounded-lg bg-muted/80">
                    <textarea
  value={state.generatedJsx || state.customCode}
  onChange={(e) => {
    state.setCustomCode(e.target.value); 
    state.setGeneratedJsx("");           
  }}
  className="flex-1 w-full h-full p-4 bg-muted/80 text-xs font-mono inspector-scroll 
             rounded-lg focus:outline-none resize-none"
/>

                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
