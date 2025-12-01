import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { htmlToJsx } from "@/lib/html-to-jsx";

interface ElementProps {
  text: string;
  color: string;
  backgroundColor: string;
  fontSize: string;
  fontWeight: string;
  padding: string;
  margin: string;
}

export interface EditorState {
  isLoadingComponent: boolean;
  loadError: string | null;

  isEditingCompleted: boolean;
  activeTab: "preview" | "code";

  saveStatus: "idle" | "saving" | "error";
  autosaveLabel: string;

  copiedCode: boolean;
  isCreatingRecord: boolean;

  componentId: string | null;
  customCode: string;
  generatedJsx: string;

  selectedRid: string | null;
  selectedElementPath: string | null;
  elementProps: ElementProps;
setGeneratedJsx: (v: string) => void;
  setCustomCode: (code: string) => void;
  setActiveTab: (v: "preview" | "code") => void;
  setCopiedCode: (v: boolean) => void;
  setElementProps: React.Dispatch<React.SetStateAction<ElementProps>>;

  handleCodeConfirmed: () => Promise<any>;
  captureSnapshot: (focus?: boolean) => Promise<string>;
  handleElementSelect: (data: any) => void;
}

export function useEditorState(previewRef: any): EditorState {
  const router = useRouter();
  const urlComponentId = useSearchParams()?.get("id");

  const [isLoadingComponent, setIsLoadingComponent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditingCompleted, setIsEditingCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [componentId, setComponentId] = useState<string | null>(null);

  const [customCode, setCustomCode] = useState("");
  const [generatedJsx, setGeneratedJsx] = useState("");

  const [lastSavedCode, setLastSavedCode] = useState("");

  const [selectedRid, setSelectedRid] = useState<string | null>(null);
  const [selectedElementPath, setSelectedElementPath] = useState<string | null>(null);

  const [elementProps, setElementProps] = useState<ElementProps>({
    text: "",
    color: "",
    backgroundColor: "",
    fontSize: "",
    fontWeight: "",
    padding: "",
    margin: "",
  });


  const captureSnapshot = useCallback(
    async (focus = false) => {
      if (!previewRef.current?.serialize) throw new Error("Preview not ready.");

      const html = await previewRef.current.serialize();
      const jsx = htmlToJsx(html);

      setGeneratedJsx(jsx); 
      
      if (focus) setActiveTab("code");

      return jsx;
    },
    [previewRef]
  );


  const handleCodeConfirmed = async () => {
    if (!customCode.trim()) {
      toast.error("Add some code first.");
      return;
    }

    if (componentId) {
      setIsEditingCompleted(true);
      return;
    }

    setIsCreatingRecord(true);

    try {
      const res = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: customCode }),
      });

      if (!res.ok) throw new Error();
      const created = await res.json();

      setComponentId(created.id);
      setLastSavedCode(created.code);

      router.replace(`/editor?id=${created.id}`, { scroll: false });

      toast.success("Component created.");
    } catch {
      toast.error("Failed to save.");
    } finally {
      setIsCreatingRecord(false);
      setIsEditingCompleted(true);
    }
  };

  const handleElementSelect = useCallback((data: any) => {
    setSelectedRid(data.rid);
    setSelectedElementPath(data.tag);

    setElementProps({
      text: data.text,
      color: data.color,
      backgroundColor: data.backgroundColor,
      fontSize: data.fontSize,
      fontWeight: data.fontWeight,
      padding: data.padding,
      margin: data.margin,
    });
  }, []);

  useEffect(() => {
    if (!urlComponentId || urlComponentId === componentId) return;

    setIsLoadingComponent(true);
    setLoadError(null);

    let cancelled = false;

    fetch(`/api/components/${urlComponentId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;

        setComponentId(urlComponentId);
        setCustomCode(data.code || "");
        setLastSavedCode(data.code || "");

        setIsEditingCompleted(!!data.code?.trim());
        setActiveTab("preview");
      })
      .catch(() => {
        if (!cancelled) setLoadError("Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingComponent(false);
      });

    return () => {
      cancelled = true;
    };
  }, [urlComponentId, componentId]);


  useEffect(() => {
    if (!componentId) return;

    const codeToSave = customCode.trim();
    if (!codeToSave || codeToSave === lastSavedCode) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setSaveStatus("saving");

      try {
        const res = await fetch(`/api/components/${componentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeToSave }),
          signal: controller.signal,
        });

        if (!res.ok) throw new Error();

        const updated = await res.json();
        setLastSavedCode(updated.code || codeToSave);

        setSaveStatus("idle");
        toast.success("Saved.");
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setSaveStatus("error");
          toast.error("Save failed.");
        }
      }
    }, 700);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [componentId, customCode, lastSavedCode]);

  useEffect(() => {
  if (!componentId) return;

  // prioritize visual edits if present
  const codeToSave = (generatedJsx?.trim() || customCode?.trim());

  if (!codeToSave || codeToSave === lastSavedCode) return;

  const controller = new AbortController();

  const timer = setTimeout(async () => {
    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/components/${componentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeToSave }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error();

      const updated = await res.json();

      // update last saved snapshot
      setLastSavedCode(updated.code || codeToSave);

      // if visual edits saved, sync them back to customCode
      if (generatedJsx) {
        setCustomCode(generatedJsx);
        setGeneratedJsx("");
      }

      setSaveStatus("idle");
      toast.success("Saved.");
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setSaveStatus("error");
        toast.error("Save failed.");
      }
    }
  }, 700);

  return () => {
    clearTimeout(timer);
    controller.abort();
  };
}, [componentId, customCode, generatedJsx, lastSavedCode]);

  const autosaveLabel =
    !componentId
      ? "Unsaved Component"
      : saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "error"
      ? "Save Failed"
      : "Saved";

  // ---------------------------------------------------
  // Final return
  // ---------------------------------------------------
  return {
    isLoadingComponent,
    loadError,
    isEditingCompleted,
    activeTab,
    saveStatus,
    autosaveLabel,
    copiedCode,
    isCreatingRecord,

    componentId,
    customCode,
    generatedJsx,
    setGeneratedJsx,

    selectedRid,
    selectedElementPath,
    elementProps,

    setCustomCode,
    setActiveTab,
    setCopiedCode,
    setElementProps,

    handleCodeConfirmed,
    captureSnapshot,
    handleElementSelect,
  };
}
