import { useState } from 'react';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from '@/shared/ui';

const STACK_ITEMS = [
  { label: 'Vite + React TS', badge: 'v6 / v19', badgeClass: 'bg-sky-600 hover:bg-sky-500' },
  { label: 'Tailwind CSS', badge: 'v4', badgeClass: 'bg-teal-600 hover:bg-teal-500' },
  { label: 'ShadCN UI', badge: 'Configured', badgeClass: 'bg-purple-600 hover:bg-purple-500' },
];

export function FrontendStackCard() {
  const [testInput, setTestInput] = useState('');

  return (
    <Card className="bg-slate-900/80 border-slate-800 backdrop-blur text-slate-100 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <span className="text-sky-400">⚡</span> Frontend Stack
          </CardTitle>
          <Badge variant="outline" className="border-sky-500/30 text-sky-400 bg-sky-500/10">
            Client
          </Badge>
        </div>
        <CardDescription className="text-slate-400">
          Vite 기반 React 19 + TypeScript + ShadCN UI
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 text-sm text-slate-300">
        {STACK_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50"
          >
            <span>{item.label}</span>
            <Badge className={item.badgeClass}>{item.badge}</Badge>
          </div>
        ))}
      </CardContent>

      <CardFooter className="pt-2">
        <div className="w-full flex gap-2">
          <Input
            placeholder="컴포넌트 테스트 입력..."
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            className="bg-slate-950/60 border-slate-700 text-slate-100 focus-visible:ring-purple-500"
          />
          <Button
            variant="secondary"
            onClick={() => alert(`입력값: ${testInput || '(없음)'}`)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            확인
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
