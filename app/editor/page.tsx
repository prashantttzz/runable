
import EditorComponent from '@/components/editor-component';
import { Suspense } from 'react';
export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading Editor...</div>}>
      <EditorComponent />
    </Suspense>
  );
}