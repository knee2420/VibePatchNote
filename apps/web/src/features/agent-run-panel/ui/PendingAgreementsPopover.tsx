import { useCallback, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Popover } from 'radix-ui';

import { usePendingAgreements } from '@/entities/agent-run';
import { requestLlmSettings } from '@/shared/lib/llmSettingsEvent';

const KIND_LABEL: Record<string, string> = {
  configure_google_api: 'AI 공급자 설정 필요',
  confirm_cost: '비용 발생 동의 필요',
  resume_run: '재개 승인 필요',
};

/**
 * 사람의 결정을 기다리는 항목을 보여 주고 처리합니다.
 *
 * 보류(`waiting_*`)는 실패가 아닙니다. 이 창구가 없으면 사용자는 "왜 분석이
 * 멈춰 있는지" 알 방법이 없고, 풀리지 않는 재시도만 반복하게 됩니다.
 *
 * 목록은 서버가 갖고 있어 새로고침이나 재시작을 넘어 남습니다.
 */
export function PendingAgreementsPopover() {
  const { agreements, isLoading, refresh, decide } = usePendingAgreements();
  const [isOpen, setIsOpen] = useState(false);

  // 열리는 순간에만 읽습니다. 보이지도 않는 패널이 요청을 만들지 않게 합니다.
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (open) void refresh();
    },
    [refresh]
  );

  const handleDecide = useCallback(
    async (agreementId: string, approved: boolean, kind: string) => {
      await decide(agreementId, approved);
      if (approved && kind === 'configure_google_api') requestLlmSettings();
    },
    [decide]
  );

  const count = agreements.length;

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          className="relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          title="사용자 결정 대기 항목"
        >
          <CircleAlert className="h-4 w-4" />
          {count > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-700">
              {count}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <p className="mb-2 text-xs font-semibold text-slate-700">사용자 결정 대기</p>

          {isLoading && <p className="py-3 text-center text-xs text-slate-400">불러오는 중...</p>}

          {!isLoading && count === 0 && (
            <p className="py-3 text-center text-xs text-slate-400">대기 중인 항목이 없습니다.</p>
          )}

          <ul className="flex flex-col gap-2">
            {agreements.map((agreement) => (
              <li
                key={agreement.agreement_id}
                className="rounded-lg border border-amber-100 bg-amber-50/60 p-2.5"
              >
                <p className="text-[11px] font-semibold text-amber-800">
                  {KIND_LABEL[agreement.kind] ?? agreement.kind}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-600">
                  {agreement.reason || '분석을 이어가려면 확인이 필요합니다.'}
                </p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() =>
                      void handleDecide(agreement.agreement_id, true, agreement.kind)
                    }
                    className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-slate-700"
                  >
                    설정하기
                  </button>
                  <button
                    onClick={() =>
                      void handleDecide(agreement.agreement_id, false, agreement.kind)
                    }
                    className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    나중에
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
