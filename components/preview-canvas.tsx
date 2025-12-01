"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { initEsbuild, esbuild } from "@/lib/esbuild";

type SelectPayload = {
  type: "select";
  rid: string;
  tag: string;
  text: string;
  color: string;
  fontSize: string;
  backgroundColor: string;
  fontWeight: string;
  padding: string;
  margin: string;
};

type MutateArgs = {
  text?: string;
  style?: Record<string, string>;
};

export type PreviewHandle = {
  mutate: (rid: string, update: MutateArgs) => void;
  serialize: () => Promise<string>;
};

type PreviewProps = {
  customCode?: string | null;
  onSelect: (payload: Omit<SelectPayload, "type">) => void;
};

const PreviewCanvas = forwardRef<PreviewHandle, PreviewProps>(function PreviewCanvas(
  { customCode, onSelect },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serializePromiseRef = useRef<{
    resolve: ((html: string) => void) | null;
    reject: ((err: Error) => void) | null;
    timeoutId: ReturnType<typeof setTimeout> | null;
  }>({
    resolve: null,
    reject: null,
    timeoutId: null,
  });

  /* ------------------------------------------------------------
     expose functions to parent (mutate + serialize)
  ------------------------------------------------------------ */
  useImperativeHandle(ref, () => ({
    mutate: (rid, update) => {
      try {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        win.postMessage({ type: "mutate", rid, ...update }, "*");
      } catch (err) {
        console.warn("mutate failed:", err);
      }
    },

    serialize: () => {
      const win = iframeRef.current?.contentWindow;
      if (!win)
        return Promise.reject(new Error("Preview iframe not ready"));

      return new Promise<string>((resolve, reject) => {
        try {
          const current = serializePromiseRef.current;

          if (current.timeoutId) clearTimeout(current.timeoutId);

          serializePromiseRef.current = {
            resolve,
            reject,
            timeoutId: setTimeout(() => {
              serializePromiseRef.current = {
                resolve: null,
                reject: null,
                timeoutId: null,
              };
              reject(new Error("Serialization timeout"));
            }, 3000),
          };

          win.postMessage({ type: "serialize" }, "*");
        } catch (err: any) {
          reject(new Error(err?.message || "serialize failed"));
        }
      });
    },
  }));

  /* ------------------------------------------------------------
     Build + Inject iframe HTML whenever code changes
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!customCode || !customCode.trim()) return;
    compileAndInject(customCode);
  }, [customCode]);

  /* ------------------------------------------------------------
     Handle messages FROM iframe
  ------------------------------------------------------------ */
  useEffect(() => {
    function receive(e: MessageEvent) {
      if (!iframeRef.current) return;
      if (e.source !== iframeRef.current.contentWindow) return;

      const data = e.data;
      if (!data || typeof data !== "object") return;

      // element selected
      if (data.type === "select") {
        const payload = data as SelectPayload;
        onSelect({
          rid: payload.rid,
          tag: payload.tag,
          text: payload.text,
          color: payload.color,
          fontSize: payload.fontSize,
          backgroundColor: payload.backgroundColor,
          fontWeight: payload.fontWeight,
          padding: payload.padding,
          margin: payload.margin,
        });
      }

      // serialized HTML
      if (data.type === "serialized") {
        const current = serializePromiseRef.current;
        if (current.resolve) current.resolve(data.html);
        cleanupSerialize();
      }

      // iframe error
      if (data.type === "error") {
        setError(String(data.message || "iframe error"));
        const current = serializePromiseRef.current;
        if (current.reject) current.reject(new Error(String(data.message)));
        cleanupSerialize();
      }
    }

    function cleanupSerialize() {
      const current = serializePromiseRef.current;
      if (current.timeoutId) clearTimeout(current.timeoutId);
      serializePromiseRef.current = { resolve: null, reject: null, timeoutId: null };
    }

    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onSelect]);

  /* ------------------------------------------------------------
     Cleanup on unmount
  ------------------------------------------------------------ */
  useEffect(() => {
    return () => {
      const current = serializePromiseRef.current;
      if (current.reject) current.reject(new Error("Preview unmounted"));
      if (current.timeoutId) clearTimeout(current.timeoutId);
    };
  }, []);

  /* ------------------------------------------------------------
     Compile + Inject logic
  ------------------------------------------------------------ */
  async function compileAndInject(code: string) {
    try {
      await initEsbuild();

      const wrapped = `
(function(){
  let __result = null;

  const _React = Object.assign({}, React, {
    createElement: (...args) => {
      const el = React.createElement(...args);
      __result = el;
      return el;
    }
  });

  (function(React){
    ${code}
  })(_React);

  window.__USER_ELEMENT__ = __result;
  window.__USER_MOUNT__ = function() {
    const root = document.getElementById('root');
    if (!root) return;
    const r = window.ReactDOM.createRoot(root);
    r.render(window.__USER_ELEMENT__);
  };
})();
      `;

      const result = await esbuild.transform(wrapped, {
        loader: "tsx",
        jsx: "transform",
      });

      const html = buildIframeHTML(result.code);

      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(html);
      doc.close();

      setError(null);
    } catch (err: any) {
      setError(err.message || String(err));
      console.error("compile error:", err);
    }
  }

  function buildIframeHTML(js: string) {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  html,body { margin:0; height:100%; }
  #root { padding:20px; }
  #__selector_overlay {
    position:absolute;
    pointer-events:none;
    border:2px solid #3b82f6;
    border-radius:6px;
    display:none;
    z-index:999999;
  }
</style>
</head>
<body>
  <div id="root"></div>
  <div id="__selector_overlay"></div>

<script>
${js}
</script>

<script>
(function(){
  if (window.__USER_MOUNT__) window.__USER_MOUNT__();

  const overlay = document.getElementById("__selector_overlay");

  function ensureRid(el){
    if (!el.dataset.rid) el.dataset.rid = "rid_" + Math.random().toString(36).slice(2);
    return el.dataset.rid;
  }

  function highlight(el){
    const r = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = r.left + "px";
    overlay.style.top = r.top + "px";
    overlay.style.width = r.width + "px";
    overlay.style.height = r.height + "px";
  }

  document.addEventListener("click", function(ev){
    ev.preventDefault();
    ev.stopPropagation();

    const el = ev.target;
    if (!el || el === overlay) return;

    const rid = ensureRid(el);
    const cs = window.getComputedStyle(el);

    window.parent.postMessage({
      type: "select",
      rid,
      tag: el.tagName.toLowerCase(),
      text: el.textContent || "",
      color: cs.color,
      fontSize: cs.fontSize,
      backgroundColor: cs.backgroundColor,
      fontWeight: cs.fontWeight,
      padding: cs.padding,
      margin: cs.margin
    }, "*");

    highlight(el);
  }, true);

  // Listen for mutate calls
  window.addEventListener("message", (ev) => {
    const data = ev.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "mutate" && data.rid) {
      const el = document.querySelector('[data-rid="'+data.rid+'"]');
      if (!el) return;

      if (data.text !== undefined && el.children.length === 0) {
        el.textContent = data.text;
      }
      if (data.style) {
        Object.entries(data.style).forEach(([k,v]) => {
          el.style[k] = v;
        });
      }
      highlight(el);
    }

    if (data.type === "serialize") {
      try {
        const html = document.getElementById("root").innerHTML;
        window.parent.postMessage({ type: "serialized", html }, "*");
      } catch (err) {
        window.parent.postMessage({ type: "error", message: String(err) }, "*");
      }
    }
  });
})();
</script>

</body>
</html>`;
  }

  return (
    <div className="w-full h-screen flex flex-col flex-1 inspector-scroll">
        {error ? (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-300 text-red-800 p-4 rounded">
            <strong>Error:</strong>
            <pre className="text-xs mt-2 whitespace-pre-wrap">{error}</pre>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title="component-preview"
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full inspector-scroll"
          />
        )}
    </div>
  );
});

export default PreviewCanvas;
