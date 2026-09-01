Title: Live Content

Description: Fetched live

Source: https://www.conventionalcommits.org/ko/v1.0.0/

---

<!DOCTYPE html>
<html class=""><head>
  
  <script async src="https://www.googletagmanager.com/gtag/js?id=UA-2173276-5"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'UA-2173276-5');
  </script>
  
  <link rel="stylesheet" href="/css/style.css">

  <title>Conventional Commits</title>
  <meta name="description" content="커밋 메시지에 사용자와 기계 모두가 이해할 수 있는 의미를 부여하기 위한 스펙"/>
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1,maximum-scale=1,user-scalable=no">

  
  <meta name="twitter:card" content="커밋 메시지에 사용자와 기계 모두가 이해할 수 있는 의미를 부여하기 위한 스펙">
  <meta name="twitter:title" content="Conventional Commits">
  <meta name="twitter:description" content="커밋 메시지에 사용자와 기계 모두가 이해할 수 있는 의미를 부여하기 위한 스펙">

  
  <meta property="og:title" content="Conventional Commits"/>
  <meta property="og:type" content="article"/>
  <meta property="og:url" content="/ko/v1.0.0/"/>
  <meta property="og:description" content="커밋 메시지에 사용자와 기계 모두가 이해할 수 있는 의미를 부여하기 위한 스펙"/>
  <meta property="og:site_name" content="Conventional Commits"/>
</head>
<body class="conventional-commits--loading"><header class="header">
  <div class="container">
    <a href="/">
      <div class="logo"></div>
    </a>
    <ul class="header__menu">
      <li class="header__menu-item dropdown">
        <button class="dropdown__label">Versions</button>
        <ul class="dropdown__options">
          
          <li class="dropdown__option"><a href="/ko/v1.0.0-beta.4">v1.0.0-beta.4</a></li>
          
        </ul>
      </li>
      <li class="header__menu-item dropdown">
        <button class="dropdown__label">Languages</button>
        <ul class="dropdown__options">
          
          <li class="dropdown__option"><a href="/en/">English</a></li>
          
          <li class="dropdown__option"><a href="/it/">Italian</a></li>
          
          <li class="dropdown__option"><a href="/pl/">Polish</a></li>
          
          <li class="dropdown__option"><a href="/zh-hans/">简体中文</a></li>
          
          <li class="dropdown__option"><a href="/zh-hant/">繁體中文</a></li>
          
          <li class="dropdown__option"><a href="/es/">Spanish</a></li>
          
          <li class="dropdown__option"><a href="/ru/">Русский</a></li>
          
          <li class="dropdown__option"><a href="/ja/">日本語</a></li>
          
          <li class="dropdown__option"><a href="/fr/">Français</a></li>
          
          <li class="dropdown__option"><a href="/ko/">한국어</a></li>
          
          <li class="dropdown__option"><a href="/hi/">हिन्दी</a></li>
          
          <li class="dropdown__option"><a href="/pt-br/">Português Brasileiro</a></li>
          
          <li class="dropdown__option"><a href="/id/">Indonesia</a></li>
          
          <li class="dropdown__option"><a href="/hy/">Հայերեն</a></li>
          
          <li class="dropdown__option"><a href="/de/">Deutsch</a></li>
          
          <li class="dropdown__option"><a href="/th/">ไทย</a></li>
          
          <li class="dropdown__option"><a href="/uk/">Ukrainian - Українська</a></li>
          
          <li class="dropdown__option"><a href="/be/">Belarusian - Беларуская</a></li>
          
          <li class="dropdown__option"><a href="/tr/">Türkçe</a></li>
          
          <li class="dropdown__option"><a href="/nl/">Nederlands</a></li>
          
          <li class="dropdown__option"><a href="/ta/">Tamil - தமிழ்</a></li>
          
          <li class="dropdown__option"><a href="/ml/">Malayalam - മലയാളം</a></li>
          
          <li class="dropdown__option"><a href="/ro/">Romanian</a></li>
          
          <li class="dropdown__option"><a href="/bn/">বাংলা (Bengali)</a></li>
          
          <li class="dropdown__option"><a href="/uz/">Uzbek (O&#39;zbekcha)</a></li>
          
          <li class="dropdown__option"><a href="/ar/">العربية</a></li>
          
          <li class="dropdown__option"><a href="/pr/">فارسی</a></li>
          
          <li class="dropdown__option"><a href="/gr/">Ελληνικά</a></li>
          
          <li class="dropdown__option"><a href="/sr/">Serbian - Srpski</a></li>
          
          <li class="dropdown__option"><a href="/si/">Sinhala</a></li>
          
        </ul>
      </li>
      <li class="header__menu-item dropdown">
        <button class="dropdown__label">
          <a href="/en/about" class="no-style-a">About</a>
        </button>
      </li>
    </ul>
  </div>
</header>
<section class="welcome">
  <div class="container">
    <h1 class="welcome__title">Conventional Commits</h1>
    <p class="welcome__description">커밋 메시지에 사용자와 기계 모두가 이해할 수 있는 의미를 부여하기 위한 스펙</p>
    
    <div class="welcome__actions">
      
      <a class="welcome__action" href="#%ea%b0%9c%ec%9a%94">요약</a>
      
      <a class="welcome__action" href="#%ea%b7%9c%ea%b2%a9">전체 스펙</a>
      
      <a class="welcome__action" href="https://github.com/conventional-commits/conventionalcommits.org">Github</a>
      
    </div>
    
    <figure class="welcome__image ">
      <img src='/img/git-flow--welcome.png'>
    </figure>
  </div>
</section>
<main>
  <article class="container markdown-body">
    <h1 id="conventional-commits-100">Conventional Commits 1.0.0</h1>
<h2 id="개요">개요</h2>
<p>Conventional Commits 스펙은 커밋 메시지에 곁들여진 가벼운 컨벤션으로 명확한 커밋 히스토리를 생성하기 위한 간단한 규칙을 제공합니다. 이렇게 만들어진 커밋 히스토리를 이용하여 더 쉽게 자동화된 도구를 만들 수 있습니다.
이 컨벤션은 커밋 메시지에 신규 기능 추가, 문제 수정, 커다란 변화가 있음을 기술함으로써 <a href="https://semver.org/lang/ko/">유의적 버전(Sementic Versioning)</a>과 일맥상통한 면이 있습니다.</p>
<p>커밋 메시지는 다음과 같은 구조가 되어야 합니다:</p>
<hr>
<pre><code>&lt;타입&gt;[적용 범위(선택 사항)]: &lt;설명&gt;

[본문(선택 사항)]

[꼬리말(선택 사항)]
</code></pre><hr>
<p><!-- raw HTML omitted --></p>
<p>커밋에는 라이브러리를 사용하는 사람들에게 의도를 전달하기 위해 다음과 같은 구조적 요소가 포함되어 있습니다.</p>
<ol>
<li><strong>fix:</strong> 코드베이스에서 버그를 패치하는 <code>fix</code> <em>타입</em> 의 커밋 (이는 유의적 버전에서의 <a href="http://semver.org/#summary"><code>PATCH</code></a>와 관련이 있습니다).</li>
<li><strong>feat:</strong> 코드베이스에서 새 기능이 추가되는 <code>feat</code> <em>타입</em> 의 커밋 (이는 유의적 버전에서의 <a href="http://semver.org/#summary"><code>MINOR</code></a>와 관련이 있습니다).</li>
<li><strong>BREAKING CHANGE:</strong> <code>BREAKING CHANGE:</code>이라는 꼬리말을 가지거나 타입/스코프 뒤에 !문자열을 붙인 커밋은 단절적 API 변경(breaking API change)이 있다는 것을 의미합니다 (이는 유의적 버전에서의 <a href="http://semver.org/#summary"><code>MAJOR</code></a>와 관련이 있습니다). 어떤 커밋 타입이라도 BREAKING CHANGE는 해당 커밋의 일부가 될 수 있습니다.</li>
<li><code>fix:</code>와 <code>feat:</code> 이외의 다른 <em>타입</em> 도 허용됩니다. 예를 들어 <a href="https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines">앵귤러 컨벤션</a>을 기반으로 하는 <a href="https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional">@commitlint/config-conventional</a>에서는 <code>build:</code>, <code>chore:</code>, <code>ci:</code>, <code>docs:</code>, <code>style:</code>, <code>refactor:</code>, <code>perf:</code>, <code>test:</code> 등의 타입을 사용할 것을 권고하고 있습니다.</li>
<li><code>BREAKING CHANGE:&lt;description&gt;</code> 이외의 <em>꼬리말</em> 을 규정 할 수 있으며 다음과 비슷한 컨벤션을 따를 수 있습니다. <a href="https://git-scm.com/docs/git-interpret-trailers">git trailer format</a>.</li>
</ol>
<p>추가 타입들은 컨벤션 커밋 규격에 의해 의무화되지 않으며, 유의적 버전에 잠재적인 영향을 주지 않습니다(그것이 BREAKING CHANGE를 포함하지 않는 한).
<!-- raw HTML omitted --><!-- raw HTML omitted -->
추가적인 문맥 정보를 제공하기 위한 목적으로 사용되는 적용 범위는 커밋의 타입에 덧붙여질 수 있는데 괄호 안에 포함됩니다, 예를 들면, <code>feat(parser): add ability to parse arrays</code>.
<!-- raw HTML omitted --></p>
<h2 id="예제">예제</h2>
<h3 id="설명과-breaking-change-꼬리말을-가지는-커밋-메시지">설명과 BREAKING CHANGE 꼬리말을 가지는 커밋 메시지</h3>
<pre><code>feat: allow provided config object to extend other configs

BREAKING CHANGE: `extends` key in config file is now used for extending other config files
</code></pre><h3 id="단절적-변경breaking-change에-주의를-주기-위해-를-포함한-커밋-메시지">단절적 변경(breaking change)에 주의를 주기 위해 <code>!</code>를 포함한 커밋 메시지</h3>
<pre><code>feat!: send an email to the customer when a product is shipped
</code></pre><h3 id="단절적-변경breaking-change에-주의를-주기-위해-적용-범위와--를-포함한-커밋-메시지">단절적 변경(breaking change)에 주의를 주기 위해 적용 범위와 <code>!</code> 를 포함한 커밋 메시지</h3>
<pre><code>feat(api)!: send an email to the customer when a product is shipped
</code></pre><h3 id="breaking-change-꼬리말과-를-함께-포함한-커밋-메시지">BREAKING CHANGE 꼬리말과 <code>!</code>를 함께 포함한 커밋 메시지</h3>
<pre><code>feat!: drop support for Node 6

BREAKING CHANGE: use JavaScript features not available in Node 6.
</code></pre><h3 id="본문이-없는-커밋-메시지">본문이 없는 커밋 메시지</h3>
<pre><code>docs: correct spelling of CHANGELOG
</code></pre><h3 id="적용-범위를-가지는-커밋-메시지">적용 범위를 가지는 커밋 메시지</h3>
<pre><code>feat(lang): add polish language
</code></pre><h3 id="다중-단락-본문과-다수의-꼬리말을-가진-커밋-메시지">다중-단락 본문과 다수의 꼬리말을 가진 커밋 메시지</h3>
<pre><code>fix: prevent racing of requests

Introduce a request id and a reference to latest request. Dismiss
incoming responses other than from latest request.

Remove timeouts which were used to mitigate the racing issue but are
obsolete now.

Reviewed-by: Z
Refs: #123
</code></pre><h2 id="규격">규격</h2>
<p>이 문서에서 언급되는 주요 단어들인 “MUST”, “MUST NOT”, “REQUIRED”, “SHALL”, “SHALL NOT”, “SHOULD”, “SHOULD NOT”, “RECOMMENDED”, “MAY”, 그리고 “OPTIONAL”는 <a href="https://www.ietf.org/rfc/rfc2119.txt">RFC 2119</a>에 기술된 그대로 해석해야 합니다.</p>
<ol>
<li>모든 커밋은 <code>feat</code>, <code>fix</code> 같은 명사로 된 접두어를 포함해야 하고 그 뒤로 선택 사항인 적용 범위, 선택 사항인 <code>!</code>, 그리고 필수인 <code>:</code>과 공백이 있어야 합니다.</li>
<li><code>feat</code> 타입은 커밋에 애플리케이션이나 라이브러리에 새로운 기능이 추가될 때 사용되어야 합니다.</li>
<li><code>fix</code> 타입은 커밋에 애플리케이션의 버그 수정을 하는 내용을 포함하는 경우에 사용되어야 합니다.</li>
<li>적용 범위는 타입 다음에 기술하는데 이는 코드베이스가 적용되는 영역을 기술하는 명사로 괄호로 감싸져야 합니다, 예를 들어, <code>fix(parser):</code></li>
<li>설명은 타입/적용 범위 접두어 뒤에 있는 콜론(:)과 공백 다음에 작성되어야 합니다. 설명은 코드 변경 사항에 대한 짧은 요약입니다, 예를 들어, <em>fix: array parsing issue when multiple spaces were contained in string.</em></li>
<li>더 긴 커밋 본문은 짧은 설명 다음에 위치할 수 있으며 코드 변경 사항에 대한 추가적인 문맥적인 정보를 제공합니다. 본문은 반드시 설명 다음에 빈 행으로 시작해야 합니다.</li>
<li>커밋 본문은 형식이 자유로우며 새 줄로 분리된 많은 수의 단락들로 구성 될 수 있습니다.</li>
<li>하나 또는 다수의 꼬리말들은 본문 다음 빈 행 다음에 위치합니다. 각각의 꼬리말은 반드시 단어 토큰, 그 뒤에 <code>:&lt;space&gt;</code> 또는 <code>&lt;space&gt;#</code> 구분자, 그 뒤에 문자열 값으로 구성되어야 합니다(이것은 다음에 영향을 받았습니다 <a href="https://git-scm.com/docs/git-interpret-trailers">git trailer convention</a>).</li>
<li>꼬리말의 토큰은 반드시 공백 문자 대신 <code>-</code> 를 사용해야 합니다. 예를 들면 <code>Acked-by</code> (이것은 다중-단락 본문과 꼬리말 섹션을 구분하는데 도움이 됩니다). <code>BREAKING CHANGE</code>는 예외적으로 토큰으로 사용될 수 있습니다.</li>
<li>꼬리말의 값은 공백이나 새 줄들을 포함할 수 있으며, 구문 분석기는 다음의 유효한 꼬리말 토큰/구분자 쌍을 관찰하면 반드시 종료해야 합니다.</li>
<li>단절적 변경은 반드시 커밋의 타입/적용범위 접두어에 표시하거나 꼬리말에 기입되어야 합니다.</li>
<li>꼬리말로 포함된 경우 단절적 변경은 반드시 대문자 문자열 BREAKING CHANGE과 뒤따르는 콜론(:), 공백, 그리고 설명으로 구성되어야 합니다. 예를 들면 <em>BREAKING CHANGE: environment variables now take precedence over config files.</em></li>
<li>타입/범위 접두어에 포함된 경우, 단절적 변경은 반드시 <code>:</code> 바로 앞의 <code>!</code> 를 명시해야 합니다. 만약 <code>!</code> 가 사용되면, <code>BREAKING CHANGE:</code> 는 꼬리말 섹션에서 생략할 수 있으며, 커밋 설명은 단절적 변경을 설명하기 위해 사용되어야 합니다.</li>
<li><code>feat</code>와 <code>fix</code> 이외의 타입이 커밋 메시지에 사용될 수 있습니다. 예: <em>docs: updated ref docs.</em></li>
<li>Conventional Commit을 구성하는 정보의 단위는 반드시 대문자여야 하는 BREAKING CHANGES를 제외하고 구현자에 의해 대소문자를 구분하는 것으로 처리되어서는 안됩니다.</li>
<li>BREAKING-CHANGE는 꼬리말에서 토큰으로 사용될 때 반드시 BREAKING CHANGE와 동의어야 합니다.</li>
</ol>
<h2 id="왜-conventional-commits를-사용할까요">왜 Conventional Commits를 사용할까요?</h2>
<ul>
<li>CHANGELOG를 자동으로 생성하기 위해서</li>
<li>(포함된 커밋의 타입에 기반하여) 유의적 버전을 자동으로 변경하기 위해서</li>
<li>팀 동료, 타인, 그리고 기타 이해당사자에게 변화의 본질을 전달하기 위해서</li>
<li>빌드와 배포 프로세스를 수행하기 위해서</li>
<li>더 구조화된 커밋 히스토리를 보여줘서 사람들이 프로젝트에 기여하기 더 쉽도록 하기 위해서</li>
</ul>
<h2 id="faq">FAQ</h2>
<h3 id="초기-개발-단계에서-커밋-메시지를-어떻게-다루어야-하나요">초기 개발 단계에서 커밋 메시지를 어떻게 다루어야 하나요?</h3>
<p>제품을 이미 출시한 것처럼 진행하세요. 일반적으로 <em>누군가</em> 는 여러분의 소프트웨어를 사용하고 있는데 그게 동료 개발자일 수도 있고 그들은 무엇이 고쳐졌는지, 무엇이 문제인지 등을 알고 싶어 할 것입니다.</p>
<h3 id="커밋-제목에서-타입은-대문자로-쓰나요-소문자로-쓰나요">커밋 제목에서 타입은 대문자로 쓰나요 소문자로 쓰나요?</h3>
<p>대소문자 구분은 없지만 일관되게 사용하는 것이 좋습니다.</p>
<h3 id="커밋이-커밋-타입-중-하나-이상에-해당하는-경우-어떻게-해야-하나요">커밋이 커밋 타입 중 하나 이상에 해당하는 경우 어떻게 해야 하나요?</h3>
<p>가능하면 돌아가서 여러 개의 커밋으로 쪼개세요. Conventional Commits의 이점 중 하나는 우리가 보다 조직화된 커밋과 PR을 만들도록 유도하는 능력입니다.</p>
<h3 id="conventional-commits가-빠른-개발과-빠른-반복을-방해하지-않나요">Conventional Commits가 빠른 개발과 빠른 반복을 방해하지 않나요?</h3>
<p>Conventional Commits는 무질서한 방법으로 빨리 움직이는 것을 지양하고 다양한 기여자들을 가진 여러 프로젝트에서 장기적으로 빠르게 이동할 수 있도록 도와줍니다.</p>
<h3 id="conventional-commits가-개발자들로-하여금-제공된-타입-안에서-생각하게-되기-때문에-그들이-만든-커밋의-타입을-제한하도록-유도할-수-있을까요">Conventional Commits가 개발자들로 하여금 제공된 타입 안에서 생각하게 되기 때문에 그들이 만든 커밋의 타입을 제한하도록 유도할 수 있을까요?</h3>
<p>Conventional Commits는 fix 같은 특정 종류의 커밋 타입을 더 많이 만들도록 장려하고 있습니다. 그 외에도, Conventional Commits의 유연성은 여러분의 팀이 그들만의 타입을 고안하고 시간이 지남에 따라 그 타입을 바꿀 수 있게 해줍니다.</p>
<h3 id="이것이-semver와-어떤-관련이-있나요">이것이 SemVer와 어떤 관련이 있나요?</h3>
<p><code>fix</code> 타입의 커밋은 <code>PATCH</code> 버전으로 번역해야 합니다. <code>feat</code> 형식 커밋은 <code>MINOR</code> 버전으로 번역해야 합니다. 타입과 관계없이 <code>BREAKING CHANGE</code>를 포함한 커밋은 <code>MAJOR</code>로 번역해야 합니다.</p>
<h3 id="conventional-commit-스펙을-개인적으로-확장한-형태의-버전을-어떻게-사용할-수-있을까요-예를-들어-jameswomackconventional-commit-spec">Conventional Commit 스펙을 개인적으로 확장한 형태의 버전을 어떻게 사용할 수 있을까요? 예를 들어, <code>@jameswomack/conventional-commit-spec</code></h3>
<p>SemVer를 사용해서 이 규격에 대한 사용자 자신의 확장판을 릴리즈할 것을 추천합니다. (그리고 이러한 확장판을 만드는 것을 권장합니다!)</p>
<h3 id="실수로-잘못된-커밋-타입을-사용하면-어떻게-해야-하나요">실수로 잘못된 커밋 타입을 사용하면 어떻게 해야 하나요?</h3>
<h4 id="스펙에-맞는-타입을-사용하고-있지만-올바른-타입이-아닌-경우-예를-들어-feat-대신-fix">스펙에 맞는 타입을 사용하고 있지만 올바른 타입이 아닌 경우, 예를 들어, <code>feat</code> 대신 <code>fix</code></h4>
<p>실수를 병합 또는 리베이스하기 전에, <code>git rebase -i</code>를 사용하여 커밋 히스토리를 편집할 것을 권장합니다. 릴리즈 후에는 사용하는 툴과 프로세스에 따라 정리하는 방법이 다를 수 있습니다.</p>
<h4 id="스펙에-맞지-않은-타입을-사용하는-경우-예를-들어-feat-대신-feet">스펙에 맞지 않은 타입을 사용하는 경우, 예를 들어, <code>feat</code> 대신 <code>feet</code></h4>
<p>최악의 경우, Conventional Commmit 규격을 충족하지 않는 커밋이 추가되었다고 해서 그것이 세계의 종말을 의미하지 않습니다. 이는 커밋이 단순히 규격을 기반으로 하는 툴에 의해 누락된다는 것을 의미합니다.</p>
<h3 id="모든-기여자가-conventional-commit-규격을-사용해야-하나요">모든 기여자가 Conventional Commit 규격을 사용해야 하나요?</h3>
<p>아니요! Git을 기반으로 스쿼시를 사용하는 경우, 리드 유지관리자는 커밋된 메시지를 병합할 때 정리할 수 있으므로 일반 커밋자에 작업량이 추가되지 않습니다.
이에 대한 일반적인 작업 흐름은 Git 시스템이 자동으로 풀 요청에서 커밋되도록 하고 리드 유지관리자가 병합에 대한 적절한 Git 커밋 메시지를 입력할 수 있는 양식을 제시하도록 하는 것입니다.</p>
<h3 id="conventional-commits은-revert-commits을-어떻게-다루어야-하나요">Conventional Commits은 revert commits을 어떻게 다루어야 하나요?</h3>
<p>코드를 되돌리는 것은 복잡해질 수 있습니다: 여러 개의 커밋을 되돌리고 있는가요? 기능을 되돌리는 경우 패치가 아니라 다음 릴리즈여야 하는가요?</p>
<p>Conventional Commits는 되돌리기 행동을 정의하기 위해 명확한 작업을 하지 않습니다. 툴 개발자에게 되돌리기를 다루는 로직 개발에 <em>타입</em> 과 <em>꼬리말</em> 의 유연함을 사용하도록 맡길 것입니다.</p>
<p>한 가지 권장 사항은 <code>revert</code> 타입과 되돌려지는 커밋들의 SHA들을 참조하는 꼬리말를 사용하는 것입니다:</p>
<pre><code>revert: let us never again speak of the noodle incident

Refs: 676104e, a215868
</code></pre>
  </article>
</main><footer class="footer">
  <div class="container">
    
    <div class="footer__license">
      
      <p>License</p>
      
      
      <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank">Creative Commons - CC BY 3.0</a>
      
    </div>
    <a href="https://www.netlify.com">
      <img src="https://www.netlify.com/img/global/badges/netlify-light.svg"/>
    </a>
    
    <div class="footer__logos">
      
      
      <a class="footer__logo" href="https://github.com/conventional-commits/conventionalcommits.org"><svg class="github" viewBox="0 0 128 128">
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M64 5.103c-33.347 0-60.388 27.035-60.388 60.388 0 26.682 17.303 49.317 41.297 57.303 3.017.56 4.125-1.31 4.125-2.905 0-1.44-.056-6.197-.082-11.243-16.8 3.653-20.345-7.125-20.345-7.125-2.747-6.98-6.705-8.836-6.705-8.836-5.48-3.748.413-3.67.413-3.67 6.063.425 9.257 6.223 9.257 6.223 5.386 9.23 14.127 6.562 17.573 5.02.542-3.903 2.107-6.568 3.834-8.076-13.413-1.525-27.514-6.704-27.514-29.843 0-6.593 2.36-11.98 6.223-16.21-.628-1.52-2.695-7.662.584-15.98 0 0 5.07-1.623 16.61 6.19C53.7 35 58.867 34.327 64 34.304c5.13.023 10.3.694 15.127 2.033 11.526-7.813 16.59-6.19 16.59-6.19 3.287 8.317 1.22 14.46.593 15.98 3.872 4.23 6.215 9.617 6.215 16.21 0 23.194-14.127 28.3-27.574 29.796 2.167 1.874 4.097 5.55 4.097 11.183 0 8.08-.07 14.583-.07 16.572 0 1.607 1.088 3.49 4.148 2.897 23.98-7.994 41.263-30.622 41.263-57.294C124.388 32.14 97.35 5.104 64 5.104z"></path>
  <path
    d="M26.484 91.806c-.133.3-.605.39-1.035.185-.44-.196-.685-.605-.543-.906.13-.31.603-.395 1.04-.188.44.197.69.61.537.91zm-.743-.55M28.93 94.535c-.287.267-.85.143-1.232-.28-.396-.42-.47-.983-.177-1.254.298-.266.844-.14 1.24.28.394.426.472.984.17 1.255zm-.575-.618M31.312 98.012c-.37.258-.976.017-1.35-.52-.37-.538-.37-1.183.01-1.44.373-.258.97-.025 1.35.507.368.545.368 1.19-.01 1.452zm0 0M34.573 101.373c-.33.365-1.036.267-1.552-.23-.527-.487-.674-1.18-.343-1.544.336-.366 1.045-.264 1.564.23.527.486.686 1.18.333 1.543zm0 0M39.073 103.324c-.147.473-.825.688-1.51.486-.683-.207-1.13-.76-.99-1.238.14-.477.823-.7 1.512-.485.683.206 1.13.756.988 1.237zm0 0M44.016 103.685c.017.498-.563.91-1.28.92-.723.017-1.308-.387-1.315-.877 0-.503.568-.91 1.29-.924.717-.013 1.306.387 1.306.88zm0 0M48.614 102.903c.086.485-.413.984-1.126 1.117-.7.13-1.35-.172-1.44-.653-.086-.498.422-.997 1.122-1.126.714-.123 1.354.17 1.444.663zm0 0"></path>
</svg>
</a>
      
      
    </div>
  </div>
</footer>
<script src="/js/bundle.js"></script>
</body>
</html>


