import { BackendStatusCard } from './BackendStatusCard';
import { DashboardHero } from './DashboardHero';
import { FrontendStackCard } from './FrontendStackCard';
import { QuickStartGuide } from './QuickStartGuide';

/** 대시보드 페이지를 구성하는 개요 블록. */
export function ProjectDashboard() {
  return (
    <div className="max-w-4xl w-full space-y-8">
      <DashboardHero />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FrontendStackCard />
        <BackendStatusCard />
      </div>

      <QuickStartGuide />
    </div>
  );
}
