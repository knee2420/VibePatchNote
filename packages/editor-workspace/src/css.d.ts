/**
 * 사이드이펙트 CSS import 선언.
 *
 * 이 패키지는 번들러 없이 `tsc` 로 단독 타입체크된다. 그래서 번들러가 제공하는
 * CSS 모듈 선언(`vite/client` 등)에 기댈 수 없고, 여기서 직접 선언한다.
 */
declare module '*.css';
