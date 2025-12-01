  "use client";

  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { rgbToHex } from "@/lib/utils";

  interface ElementProps {
    text: string;
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    padding: string;
    margin: string;
  }

  interface InspectorPanelProps {
    selectedElement: string | null;
    selectedRid: string | null;
    previewRef: React.RefObject<any>;
    elementProps: ElementProps;
    setElementProps: React.Dispatch<React.SetStateAction<ElementProps>>;
    onElementMutated?: () => void;
  }

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-3 ">
      <h3 className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-primary"></span>
        {title}
      </h3>
      <div className="space-y-1 glass bg-card border border-border/50 rounded-lg p-1 shadow-sm">
        {children}
      </div>
    </div>
  );

  const textTags = [
    "p",
    "span",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "button",
    "label",
    "strong",
    "em",
    "small",
    "li",
  ];

  const InspectorPanel = ({
    selectedElement,
    selectedRid,
    previewRef,
    elementProps,
    setElementProps,
    onElementMutated,
  }: InspectorPanelProps) => {
    const isTextElement = selectedElement
      ? textTags.includes(selectedElement.toLowerCase())
      : false;

    const mutate = (update: any) => {
      if (!selectedRid || !previewRef.current?.mutate) return;
      previewRef.current.mutate(selectedRid, update);
      onElementMutated?.();
    };

    const updateElementProps = (partial: Partial<ElementProps>) => {
      setElementProps((prev) => ({ ...prev, ...partial }));
    };

    return (
      <div className="w-80 border-r border-border bg-card flex flex-col h-full select-none">
        <div className="px-6 py-5 border-b border-border backdrop-blur-sm">
          <h2 className="text-xl font-bold text-foreground mb-1">Inspector</h2>
          <p className="text-xs text-muted-foreground">
            Edit properties and preview
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 inspector-scroll">
          <Section title="Selected Element">
            <div className="text-sm font-mono px-4 py-3 rounded-lg y text-foreground font-semibold shadow-inner">
              &lt;{selectedElement || "none"}&gt;
            </div>
          </Section>

          <Section title="Text Content">
            <textarea
              disabled={!isTextElement}
              value={elementProps.text}
              onChange={(e) => {
                const val = e.target.value;
                updateElementProps({ text: val });
                if (isTextElement) mutate({ text: val });
              }}
              className="w-full px-3 py-2.5 rounded-lg text-white text-sm resize-none focus:ring-2 focus:ring-primary/50 disabled:opacity-40"
              rows={3}
              placeholder="Enter text…"
            />
          </Section>
          <Section title="Text Color">
            <div className="flex gap-2">
              <input
                disabled={!isTextElement}
                type="color"
                value={rgbToHex(elementProps.color)}
                onChange={(e) => {
                  const val = e.target.value;
                  updateElementProps({ color: val });
                  if (isTextElement) mutate({ style: { color: val } });
                }}
                className="w-10 h-10  border border-border rounded cursor-pointer disabled:opacity-40"
              />
              <input
                disabled={!isTextElement}
                type="text"
                value={elementProps.color}
                onChange={(e) => {
                  const val = e.target.value;
                  updateElementProps({ color: val });
                  if (isTextElement) mutate({ style: { color: val } });
                }}
                className="flex-1 px-3 py-2 text-white bg-background border border-border rounded text-xs font-mono disabled:opacity-40"
                placeholder="#000000"
              />
            </div>
          </Section>
          <Section title="Background Color">
            <div className="flex gap-2 ">
              <input
                type="color"
                value={rgbToHex(elementProps.backgroundColor)}
                onChange={(e) => {
                  const val = e.target.value;
                  updateElementProps({ backgroundColor: val });
                  mutate({ style: { backgroundColor: val } });
                }}
                className="w-10 h-10 border border-border rounded cursor-pointer"
              />
              <input
                type="text"
                value={elementProps.backgroundColor}
                onChange={(e) => {
                  const val = e.target.value;
                  updateElementProps({ backgroundColor: val });
                  mutate({ style: { backgroundColor: val } });
                }}
                className="flex-1 px-3 text-white py-2 bg-background border border-border rounded text-xs font-mono"
                placeholder="#ffffff"
              />
            </div>
          </Section>
          <Section title="Typography">
            <div className="flex gap-10 p-2">
              <div className="flex-1">
                <label className="text-[11px] block mb-1 text-muted-foreground">
                  Font Size
                </label>
                <div className="flex items-center gap-2">
                  <input
                    disabled={!isTextElement}
                    type="number"
                    value={parseInt(elementProps.fontSize) || ""}
                    onChange={(e) => {
                      const px = e.target.value + "px";
                      updateElementProps({ fontSize: px });
                      if (isTextElement) mutate({ style: { fontSize: px } });
                    }}
                    className="w-full px-3 py-2 text-white bg-background border border-border rounded text-sm disabled:opacity-40"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>

              <div className="flex-1">
                <label className="text-[11px] block mb-1 text-muted-foreground">
                  Padding
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={parseInt(elementProps.padding) || ""}
                    onChange={(e) => {
                      const px = e.target.value + "px";
                      updateElementProps({ padding: px });
                      mutate({ style: { padding: px } });
                    }}
                    className="w-full px-3 py-2 text-white bg-background border border-border rounded text-sm"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Font Weight">
            <Select
              disabled={!isTextElement}
              value={elementProps.fontWeight}
              onValueChange={(value) => {
                updateElementProps({ fontWeight: value });
                if (isTextElement) {
                  const map: Record<string, string> = {
                    Normal: "400",
                    Medium: "500",
                    "Semi Bold": "600",
                    Bold: "700",
                  };
                  mutate({ style: { fontWeight: map[value] } });
                }
              }}
            >
              <SelectTrigger className=" bg-transparent! border-none! w-full! text-white disabled:opacity-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Semi Bold">Semi Bold</SelectItem>
                <SelectItem value="Bold">Bold</SelectItem>
              </SelectContent>
            </Select>
          </Section>
        </div>
      </div>
    );
  };

  export default InspectorPanel;
