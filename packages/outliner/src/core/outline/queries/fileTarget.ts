/**
 * @file fileTarget.ts
 * @description 불릿에 딸린 파일의 주소(target)를 읽는 순수 함수
 *
 * 주소는 옵시디언 링크 주소 꼴(`폴더/파일.pdf#page=3`)이거나 웹 주소다.
 * 실제 파일을 찾고 여는 일은 호스트가 한다. 여기서는 글자만 본다.
 */

/** 웹 주소인가 (http·https) */
export function isWebTarget(target: string): boolean {
  return /^https?:\/\//i.test(target);
}

/** 주소에서 파일 경로만 (뒤의 `#위치` 를 뗀다). 웹 주소는 `?`·`#` 앞까지 */
export function getTargetPath(target: string): string {
  return target.split(isWebTarget(target) ? /[?#]/ : '#')[0];
}

/** 주소가 가리키는 파일의 확장자 (소문자, 점 없이). 없으면 빈 문자열 */
export function getTargetExtension(target: string): string {
  const name = getTargetPath(target).split('/').pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/** 화면에 보일 이름: 파일은 파일 이름, 웹 주소는 `호스트/경로` */
export function getTargetName(target: string): string {
  if (isWebTarget(target)) return target.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  return getTargetPath(target).split('/').pop() || target;
}
