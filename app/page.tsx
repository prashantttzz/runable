import Link from "next/link"
import { Plus, Zap, Code2, Calendar, Info } from "lucide-react"
import { listComponentsAction } from "@/lib/actions"
import { formatDistanceToNow } from "date-fns"
import { ComponentRecord } from "@/lib/component-store"

export default async function Home() {
  let components: ComponentRecord[] = []
  try {
    components = await listComponentsAction()
  } catch (error) {
    console.error("Failed to load components", error)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-[#0f0f0f] to-[#0a0a0a] text-white">
      
      {/* HEADER */}
      <header className="border-b border-white/10 sticky top-0 z-50 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Code2 className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Component Editor</h1>
          </div>

          <Link
            href="/editor"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg 
            bg-white text-black font-medium hover:bg-white/90 transition-colors active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            New Component
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="py-20 md:py-28 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
            Inspect and Edit Your React Components Visually
          </h2>

          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Paste any JSX component and tweak it visually. Works with plain React, Tailwind and inline styles.
          </p>

          <Link
            href="/editor"
            className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-white text-black 
            font-medium hover:bg-white/90 transition shadow-sm active:scale-[0.97]"
          >
            <Zap className="w-5 h-5" />
            Start Editing
          </Link>
        </div>
      </section>

      {/* SAVED COMPONENTS */}
      <section className="py-20 px-6 md:px-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-10">
            <h3 className="text-2xl font-semibold">Your Components</h3>
            <p className="text-gray-400">Browse and update your saved snippets</p>
          </div>

          {components.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {components.map((component) => (
                <Link
                  key={component.id}
                  href={`/editor?id=${component.id}`}
                  className="group rounded-xl border border-white/10 bg-black/40 
                  p-5 transition-all duration-300 cursor-pointer flex flex-col shadow-lg 
                  hover:-translate-y-1 hover:border-white/20 backdrop-blur-sm"
                >
                  <div className="h-36 rounded-md mb-4 bg-gradient-to-b from-[#161616] to-black 
                  border border-white/10 overflow-hidden">
                    <pre className="text-xs font-mono text-gray-400 p-3 overflow-hidden">
                      {component.code}
                    </pre>
                  </div>

                  <h4 className="font-semibold mb-2 line-clamp-1">
                    Component {component.id.slice(0, 8)}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-auto">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Updated {formatDistanceToNow(new Date(component.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 opacity-70">
              <Code2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-3">You don’t have any components saved yet.</p>
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white 
                border border-white/20 hover:bg-black/80 transition active:scale-[0.97]"
              >
                <Plus className="w-4 h-4" />
                Create Component
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6 md:px-12 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto space-y-14">

          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-blue-400" />
            <h2 className="text-3xl font-bold tracking-tight">How This Editor Works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 text-gray-300">

            {/* Left Column */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">What You Can Render</h3>
                <p>This editor supports lightweight React components that don’t depend on external libraries.</p>

                <ul className="list-disc list-inside mt-3 space-y-1 text-gray-400">
                  <li>Function components</li>
                  <li>Plain JSX markup</li>
                  <li>Tailwind CSS utility classes</li>
                  <li>Inline styles</li>
                  <li>Nested layout structures</li>
                </ul>

                <p className="mt-3 text-sm text-gray-500">
                  Components requiring Radix UI, framer-motion or NPM packages are not supported.
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-3">Workflow Overview</h3>

                <ol className="list-decimal list-inside space-y-3 text-gray-400">
                  <li>User pastes a React component.</li>
                  <li>esbuild (WASM) transforms JSX → JS in the browser.</li>
                  <li>Preview iframe renders the component with Tailwind.</li>
                  <li>User selects elements inside preview.</li>
                  <li>Inspector panel exposes editable properties.</li>
                  <li>Mutations are applied live inside the iframe.</li>
                  <li>DOM is serialized → converted back to JSX.</li>
                  <li>Auto-saved to backend using a debounced PUT.</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-3">Why This Architecture?</h3>
                <p className="text-gray-400 leading-relaxed">
                  The editor runs inside a fully sandboxed iframe. This avoids React tree conflicts,
                  CSS bleeding, and hydration issues. All communication uses postMessage, and all bundling
                  happens client-side through esbuild WASM for maximum speed.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  )
}
