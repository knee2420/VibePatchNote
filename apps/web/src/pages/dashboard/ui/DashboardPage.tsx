import { ProjectDashboard } from '@/widgets/project-dashboard';

export function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 antialiased selection:bg-purple-500 selection:text-white">
      <ProjectDashboard />
    </div>
  );
}
