import { httpClient } from '@/shared/api';

import type { ScaffoldArchiveMeta, ScaffoldSlot } from '../model/types';

const BASE_PATH = '/api/v1/scaffolds';

/** `GET /api/v1/scaffolds/{id}` 응답. 서식 본문의 단일 진실 공급원(SSOT)입니다. */
export interface ScaffoldArchiveDetail extends ScaffoldArchiveMeta {
  /** 현재 본문. 사용자가 편집한 작업본이 있으면 그것, 없으면 엔진 원본. */
  htmlContent: string;
  markdownContent: string;
  /** 엔진 조립 원본. 편집으로 덮이지 않는 회귀 추적 기준선. */
  originHtmlContent: string;
  originMarkdownContent: string;
  promptSpecMd: string;
  slots: ScaffoldSlot[];
}

/** 스캐폴드 아카이브(서식 보관함) 통신 단일 진입점. */
export const scaffoldArchiveApi = {
  get: (scaffoldId: string) =>
    httpClient.get<ScaffoldArchiveDetail>(`${BASE_PATH}/${encodeURIComponent(scaffoldId)}`),

  /** 재구성된 서식 화면의 스냅샷 PNG 를 아카이브에 보관합니다. */
  saveRenderImage: (scaffoldId: string, png: Blob) => {
    const formData = new FormData();
    formData.append('file', png, 'render_p1.png');
    return httpClient.postFormData<ScaffoldArchiveMeta>(
      `${BASE_PATH}/${encodeURIComponent(scaffoldId)}/render/image`,
      formData
    );
  },

  /** 편집된 작업본을 아카이브에 되씁니다. 엔진 원본은 보존됩니다. */
  saveRender: (scaffoldId: string, htmlContent: string, markdownContent?: string) => {
    // `undefined` 는 JSON.stringify 시 조용히 빠져 `{}` 요청이 된다. 호출 경계에서
    // 바로 실패시켜 서버의 422와 원인 불명의 저장 실패를 막는다.
    if (typeof htmlContent !== 'string') {
      return Promise.reject(
        new TypeError('Scaffold render HTML must be a string before it can be saved.')
      );
    }

    const payload: { htmlContent: string; markdownContent?: string } = { htmlContent };
    if (typeof markdownContent === 'string') {
      payload.markdownContent = markdownContent;
    }

    return httpClient.put<ScaffoldArchiveMeta>(
      `${BASE_PATH}/${encodeURIComponent(scaffoldId)}/render`,
      payload
    );
  },
};
