import { Card, CardContent } from '@/shared/ui';

const STEPS = [
  {
    title: '1. 전체 개발 서버 (Turborepo):',
    titleClass: 'text-sky-400',
    commands: ['pnpm install', 'pnpm dev'],
  },
  {
    title: '2. 개별 실행:',
    titleClass: 'text-emerald-400',
    commands: ['pnpm --filter @vibe/web dev', 'pnpm --filter @vibe/api dev'],
  },
];

export function QuickStartGuide() {
  return (
    <Card className="bg-slate-900/50 border-slate-800 text-slate-300">
      <CardContent className="pt-6 space-y-2 text-sm">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <span>🚀</span> 프로젝트 시작 방법
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 font-mono text-xs">
          {STEPS.map((step) => (
            <div key={step.title} className="p-3 rounded bg-slate-950/60 border border-slate-800">
              <p className={`text-slate-400 mb-1 font-sans font-medium ${step.titleClass}`}>
                {step.title}
              </p>
              {step.commands.map((command) => (
                <div key={command}>
                  <code>{command}</code>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
