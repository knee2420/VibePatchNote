import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { HybridEditorBoard } from "@/widgets/hybrid-editor-board/ui/HybridEditorBoard"

export function EditorPage() {
  const navigate = useNavigate()

  return (
    <div className="w-full h-screen bg-slate-50">
      <div className="absolute top-4 right-4 z-50">
        <Button onClick={() => navigate("/")} variant="outline" className="shadow-sm">
          대시보드로 돌아가기
        </Button>
      </div>
      <HybridEditorBoard />
    </div>
  )
}
