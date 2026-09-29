import { Suspense } from 'react'
import { EditorShell } from '@/components/editor/editor-shell'

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading editor…</p>
          </div>
        </div>
      }
    >
      <EditorShell />
    </Suspense>
  )
}
