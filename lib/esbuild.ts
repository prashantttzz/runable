"use client";
import * as esbuild from "esbuild-wasm";

let initPromise: Promise<void> | null = null;

export function initEsbuild() {
  if (!initPromise) {
    initPromise = esbuild.initialize({
      wasmURL: "/esbuild.wasm",
    });
  }
  return initPromise;
}

export { esbuild };
