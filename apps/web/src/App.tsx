import { BrowserRouter, Routes, Route } from "react-router-dom"
import { DashboardPage } from "@/pages/dashboard/ui/DashboardPage"
import { EditorPage } from "@/pages/editor/ui/EditorPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  )
}
