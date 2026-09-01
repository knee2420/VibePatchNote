Title: Live Content

Description: Fetched live

Source: https://google.github.io/styleguide/tsguide.html

---

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Google TypeScript Style Guide</title>
<link rel="stylesheet" href="javaguide.css">
<script src="include/styleguide.js"></script>
<link rel="shortcut icon" href="/styleguide/favicon.ico">
<script src="include/jsguide.js"></script>
</head>
<body onload="initStyleGuide();">
<div id="content">
<h1>Google TypeScript Style Guide</h1>


<section>

<p>This guide is based on the internal Google TypeScript style guide, but it has
been slightly adjusted to remove Google-internal sections. Google's internal
environment has different constraints on TypeScript than you might find outside
of Google. The advice here is specifically useful for people authoring code they
intend to import into Google, but otherwise may not apply in your external
environment.</p>

<p>There is no automatic deployment process for this version as it's pushed
on-demand by volunteers.</p>

</section> 

<h2 id="introduction" class="numbered">Introduction</h2>

 

<h3 id="terminology-notes" class="numbered">Terminology notes</h3>

<p>This Style Guide uses <a href="https://tools.ietf.org/html/rfc2119">RFC 2119</a>
terminology when using the phrases <em>must</em>, <em>must not</em>, <em>should</em>, <em>should not</em>,
and <em>may</em>. The terms <em>prefer</em> and <em>avoid</em> correspond to <em>should</em> and <em>should
not</em>, respectively. Imperative and declarative statements are prescriptive and
correspond to <em>must</em>.</p>

<h3 id="guide-notes" class="numbered">Guide notes</h3>

<p>All examples given are <strong>non-normative</strong> and serve only to illustrate the
normative language of the style guide. That is, while the examples are in Google
Style, they may not illustrate the <em>only</em> stylish way to represent the code.
Optional formatting choices made in examples must not be enforced as rules.</p>

 

<h2 id="source-file-basics" class="numbered">Source file basics</h2>

 

 

<p><a id="file-encoding"></a></p>

<h3 id="file-encoding-utf-8" class="numbered">File encoding: UTF-8</h3>

<p>Source files are encoded in <strong>UTF-8</strong>.</p>

<p><a id="special-characters"></a></p>

<h4 id="whitespace-characters" class="numbered">Whitespace characters</h4>

<p>Aside from the line terminator sequence, the ASCII horizontal space character
(0x20) is the only whitespace character that appears anywhere in a source file.
This implies that all other whitespace characters in string literals are
escaped.</p>

<h4 id="special-escape-sequences" class="numbered">Special escape sequences</h4>

<p>For any character that has a special escape sequence (<code>\'</code>, <code>\"</code>, <code>\\</code>, <code>\b</code>,
<code>\f</code>, <code>\n</code>, <code>\r</code>, <code>\t</code>, <code>\v</code>), that sequence is used rather than the
corresponding numeric escape (e.g <code>\x0a</code>, <code>\u000a</code>, or <code>\u{a}</code>). Legacy octal
escapes are never used.</p>

<h4 id="non-ascii-characters" class="numbered">Non-ASCII characters</h4>

<p>For the remaining non-ASCII characters, use the actual Unicode character (e.g.
<code>∞</code>). For non-printable characters, the equivalent hex or Unicode escapes (e.g.
<code>\u221e</code>) can be used along with an explanatory comment.</p>

<pre><code class="language-ts good">// Perfectly clear, even without a comment.
const units = 'μs';

// Use escapes for non-printable characters.
const output = '\ufeff' + content;  // byte order mark
</code></pre>

<pre><code class="language-ts bad">// Hard to read and prone to mistakes, even with the comment.
const units = '\u03bcs'; // Greek letter mu, 's'

// The reader has no idea what this is.
const output = '\ufeff' + content;
</code></pre>

 

 

 

 

 

 

<p><a id="modules"></a>
<a id="source-organization"></a></p>

<h2 id="source-file-structure" class="numbered">Source file structure</h2>

<p>Files consist of the following, <strong>in order</strong>:</p>

<ol>
<li>Copyright information, if present</li>
<li>JSDoc with <code>@fileoverview</code>, if present</li>
<li>Imports, if present</li>
<li>The file’s implementation</li>
</ol>

<p><strong>Exactly one blank line</strong> separates each section that is present.</p>

 

<h3 id="file-copyright" class="numbered">Copyright information</h3>

 

<p>If license or copyright information is necessary in a file, add it in a JSDoc at
the top of the file. </p>

<p><a id="file-fileoverview"></a>
<a id="jsdoc-top-file-level-comments"></a></p>

<h3 id="fileoverview" class="numbered"><code>@fileoverview</code> JSDoc</h3>

<p>A file may have a top-level <code>@fileoverview</code> JSDoc. If present, it may provide a
description of the file's content, its uses, or information about its
dependencies. Wrapped lines are not indented.</p>

<p>Example:</p>

<pre><code class="language-ts good">/**
 * @fileoverview Description of file. Lorem ipsum dolor sit amet, consectetur
 * adipiscing elit, sed do eiusmod tempor incididunt.
 */
</code></pre>

 

<h3 id="imports" class="numbered">Imports</h3>

<p>There are four variants of import statements in ES6 and TypeScript:</p>

 

<section>

<table>
<thead>
<tr>
<th>Import type</th>
<th>Example</th>
<th>Use for</th>
</tr>
</thead>

<tbody>
<tr>
<td>module[<sup>module_import]</sup>
</td>
<td><code>import * as foo from
'...';</code></td>
<td>TypeScript imports
</td>
</tr>
<tr>
<td>named[<sup>destructuring_import]</sup>
</td>
<td><code>import {SomeThing}
from '...';</code></td>
<td>TypeScript imports
</td>
</tr>
<tr>
<td>default

</td>
<td><code>import SomeThing
from '...';</code>
</td>
<td>Only for other
external code that
requires them</td>
</tr>
<tr>
<td>side-effect



</td>
<td><code>import '...';</code>



</td>
<td>Only to import
libraries for their
side-effects on load
(such as custom
elements)</td>
</tr>
</tbody>
</table>

<pre><code class="language-ts good">// Good: choose between two options as appropriate (see below).
import * as ng from '@angular/core';
import {Foo} from './foo';

// Only when needed: default imports.
import Button from 'Button';

// Sometimes needed to import libraries for their side effects:
import 'jasmine';
import '@polymer/paper-button';
</code></pre>

</section> 

<h4 id="import-paths" class="numbered">Import paths</h4>

<p>TypeScript code <em>must</em> use paths to import other TypeScript code. Paths <em>may</em> be
relative, i.e. starting with <code>.</code> or <code>..</code>,
 or rooted at the base directory, e.g.
<code>root/path/to/file</code>.</p>

<p>Code <em>should</em> use relative imports (<code>./foo</code>) rather than absolute imports
<code>path/to/foo</code> when referring to files within the same (logical) project as this
allows to move the project around without introducing changes in these imports.</p>

<p>Consider limiting the number of parent steps (<code>../../../</code>) as those can make
module and path structures hard to understand.</p>

<pre><code class="language-ts good">import {Symbol1} from 'path/from/root';
import {Symbol2} from '../parent/file';
import {Symbol3} from './sibling';
</code></pre>

 

<p><a id="module-versus-destructuring-import"></a></p>

<h4 id="namespace-versus-named-imports" class="numbered">Namespace versus named imports</h4>

<p>Both namespace and named imports can be used.</p>

<p>Prefer named imports for symbols used frequently in a file or for symbols that
have clear names, for example Jasmine's <code>describe</code> and <code>it</code>. Named imports can
be aliased to clearer names as needed with <code>as</code>.</p>

<p>Prefer namespace imports when using many different symbols from large APIs. A
namespace import, despite using the <code>*</code> character, is not comparable to a
<q>wildcard</q> import as seen in other languages. Instead, namespace imports give a
name to all the exports of a module, and each exported symbol from the module
becomes a property on the module name. Namespace imports can aid readability for
exported symbols that have common names like <code>Model</code> or <code>Controller</code> without the
need to declare aliases.</p>

<pre><code class="language-ts bad">// Bad: overlong import statement of needlessly namespaced names.
import {Item as TableviewItem, Header as TableviewHeader, Row as TableviewRow,
  Model as TableviewModel, Renderer as TableviewRenderer} from './tableview';

let item: TableviewItem|undefined;
</code></pre>

<pre><code class="language-ts good">// Better: use the module for namespacing.
import * as tableview from './tableview';

let item: tableview.Item|undefined;
</code></pre>

<pre><code class="language-ts bad">import * as testing from './testing';

// Bad: The module name does not improve readability.
testing.describe('foo', () =&gt; {
  testing.it('bar', () =&gt; {
    testing.expect(null).toBeNull();
    testing.expect(undefined).toBeUndefined();
  });
});
</code></pre>

<pre><code class="language-ts good">// Better: give local names for these common functions.
import {describe, it, expect} from './testing';

describe('foo', () =&gt; {
  it('bar', () =&gt; {
    expect(null).toBeNull();
    expect(undefined).toBeUndefined();
  });
});
</code></pre>

<h5 id="jspb-import-by-path" class="numbered">Special case: Apps JSPB protos</h5>

<p>Apps JSPB protos must use named imports, even when it leads to long import
lines.</p>

<p>This rule exists to aid in build performance and dead code elimination since
often <code>.proto</code> files contain many <code>message</code>s that are not all needed together.
By leveraging destructured imports the build system can create finer grained
dependencies on Apps JSPB messages while preserving the ergonomics of path based
imports.</p>

<pre><code class="language-ts good">// Good: import the exact set of symbols you need from the proto file.
import {Foo, Bar} from './foo.proto';

function copyFooBar(foo: Foo, bar: Bar) {...}
</code></pre>

 

<h4 id="renaming-imports" class="numbered">Renaming imports</h4>

<p>Code <em>should</em> fix name collisions by using a namespace import or renaming the
exports themselves. Code <em>may</em> rename imports (<code>import {SomeThing as
SomeOtherThing}</code>) if needed.</p>

<p>Three examples where renaming can be helpful:</p>

<ol>
<li>If it's necessary to avoid collisions with other imported symbols.</li>
<li>If the imported symbol name is generated.</li>
<li>If importing symbols whose names are unclear by themselves, renaming can
improve code clarity. For example, when using RxJS the <code>from</code> function might
be more readable when renamed to <code>observableFrom</code>.</li>
</ol>

 

 

 

<h3 id="exports" class="numbered">Exports</h3>

<p>Use named exports in all code:</p>

<pre><code class="language-ts good">// Use named exports:
export class Foo { ... }
</code></pre>

<p>Do not use default exports. This ensures that all imports follow a uniform
pattern.</p>

<pre><code class="language-ts bad">// Do not use default exports:
export default class Foo { ... } // BAD!
</code></pre>

<section class="zippy">

<p>Why?</p>

<p>Default exports provide no canonical name, which makes central maintenance
difficult with relatively little benefit to code owners, including potentially
decreased readability:</p>

<pre><code class="language-ts bad">import Foo from './bar';  // Legal.
import Bar from './bar';  // Also legal.
</code></pre>

<p>Named exports have the benefit of erroring when import statements try to import
something that hasn't been declared. In <code>foo.ts</code>:</p>

<pre><code class="language-ts bad">const foo = 'blah';
export default foo;
</code></pre>

<p>And in <code>bar.ts</code>:</p>

<pre><code class="language-ts bad">import {fizz} from './foo';
</code></pre>

<p>Results in <code>error TS2614: Module '"./foo"' has no exported member 'fizz'.</code> While
<code>bar.ts</code>:</p>

<pre><code class="language-ts bad">import fizz from './foo';
</code></pre>

<p>Results in <code>fizz === foo</code>, which is probably unexpected and difficult to debug.</p>

<p>Additionally, default exports encourage people to put everything into one big
object to namespace it all together:</p>

<pre><code class="language-ts bad">export default class Foo {
  static SOME_CONSTANT = ...
  static someHelpfulFunction() { ... }
  ...
}
</code></pre>

<p>With the above pattern, we have file scope, which can be used as a namespace. We
also have a perhaps needless second scope (the class <code>Foo</code>) that can be
ambiguously used as both a type and a value in other files.</p>

<p>Instead, prefer use of file scope for namespacing, as well as named exports:</p>

<pre><code class="language-ts good">export const SOME_CONSTANT = ...
export function someHelpfulFunction()
export class Foo {
  // only class stuff here
}
</code></pre>

</section> 

<h4 id="export-visibility" class="numbered">Export visibility</h4>

<p>TypeScript does not support restricting the visibility for exported symbols.
Only export symbols that are used outside of the module. Generally minimize the
exported API surface of modules.</p>

 

<h4 id="mutable-exports" class="numbered">Mutable exports</h4>

 

<p>Regardless of technical support, mutable exports can create hard to understand
and debug code, in particular with re-exports across multiple modules. One way
to paraphrase this style point is that <code>export let</code> is not allowed.</p>

<section>

<pre><code class="language-ts bad">export let foo = 3;
// In pure ES6, foo is mutable and importers will observe the value change after a second.
// In TS, if foo is re-exported by a second file, importers will not see the value change.
window.setTimeout(() =&gt; {
  foo = 4;
}, 1000 /* ms */);
</code></pre>

</section> 

<p>If one needs to support externally accessible and mutable bindings, they
<em>should</em> instead use explicit getter functions.</p>

<pre><code class="language-ts good">let foo = 3;
window.setTimeout(() =&gt; {
  foo = 4;
}, 1000 /* ms */);
// Use an explicit getter to access the mutable export.
export function getFoo() { return foo; };
</code></pre>

<p>For the common pattern of conditionally exporting either of two values, first do
the conditional check, then the export. Make sure that all exports are final
after the module's body has executed.</p>

<pre><code class="language-ts good">function pickApi() {
  if (useOtherApi()) return OtherApi;
  return RegularApi;
}
export const SomeApi = pickApi();
</code></pre>

<p><a id="static-containers"></a></p>

<h4 id="container-classes" class="numbered">Container classes</h4>

<p>Do not create container classes with static methods or properties for the sake
of namespacing.</p>

<pre><code class="language-ts bad">export class Container {
  static FOO = 1;
  static bar() { return 1; }
}
</code></pre>

<p>Instead, export individual constants and functions:</p>

<pre><code class="language-ts good">export const FOO = 1;
export function bar() { return 1; }
</code></pre>

 

<h3 id="import-export-type" class="numbered">Import and export type</h3>

<h4 id="import-type" class="numbered">Import type</h4>

<p>You may use <code>import type {...}</code> when you use the imported symbol only as a type.
Use regular imports for values:</p>

<pre><code class="language-ts good">import type {Foo} from './foo';
import {Bar} from './foo';

import {type Foo, Bar} from './foo';
</code></pre>

<section class="zippy">

<p>Why?</p>

<p>The TypeScript compiler automatically handles the distinction and does not
insert runtime loads for type references. So why annotate type imports?</p>

<p>The TypeScript compiler can run in 2 modes:</p>

<ul>
<li>In development mode, we typically want quick iteration loops. The compiler
transpiles to JavaScript without full type information. This is much faster,
but requires <code>import type</code> in certain cases.</li>
<li>In production mode, we want correctness. The compiler type checks everything
and ensures <code>import type</code> is used correctly.</li>
</ul>

<p>Note: If you need to force a runtime load for side effects, use <code>import '...';</code>.
See </p>

</section> 

<h4 id="export-type" class="numbered">Export type</h4>

<p>Use <code>export type</code> when re-exporting a type, e.g.:</p>

<pre><code class="language-ts good">export type {AnInterface} from './foo';
</code></pre>

<section class="zippy">

<p>Why?</p>

<p><code>export type</code> is useful to allow type re-exports in file-by-file transpilation.
See
<a href="https://www.typescriptlang.org/tsconfig#exports-of-non-value-identifiers"><code>isolatedModules</code> docs</a>.</p>

<p><code>export type</code> might also seem useful to avoid ever exporting a value symbol for
an API. However it does not give guarantees, either: downstream code might still
import an API through a different path. A better way to split &amp; guarantee type
vs value usages of an API is to actually split the symbols into e.g.
<code>UserService</code> and <code>AjaxUserService</code>. This is less error prone and also better
communicates intent.</p>

</section> 

<p><a id="namespaces-vs-modules"></a></p>

<h4 id="use-modules-not-namespaces" class="numbered">Use modules not namespaces</h4>

<p>TypeScript supports two methods to organize code: <em>namespaces</em> and <em>modules</em>,
but namespaces are disallowed.  That
is, your code <em>must</em> refer to code in other files using imports and exports of
the form <code>import {foo} from 'bar';</code></p>

<p>Your code <em>must not</em> use the <code>namespace Foo { ... }</code> construct. <code>namespace</code>s
<em>may</em> only be used when required to interface with external, third party code.
To semantically namespace your code, use separate files.</p>

 

<p>Code <em>must not</em> use <code>require</code> (as in <code>import x = require('...');</code>) for imports.
Use ES6 module syntax.</p>

<pre><code class="language-ts bad">// Bad: do not use namespaces:
namespace Rocket {
  function launch() { ... }
}

// Bad: do not use &lt;reference&gt;
/// &lt;reference path="..."/&gt;

// Bad: do not use require()
import x = require('mydep');
</code></pre>

 

<blockquote>
<p>NB: TypeScript <code>namespace</code>s used to be called internal modules and used to use
the <code>module</code> keyword in the form <code>module Foo { ... }</code>. Don't use that either.
Always use ES6 imports.</p>
</blockquote>

<p><a id="language-rules"></a></p>

<h2 id="language-features" class="numbered">Language features</h2>

<p>This section delineates which features may or may not be used, and any
additional constraints on their use.</p>

<p>Language features which are not discussed in this style guide <em>may</em> be used with
no recommendations of their usage.</p>

<p><a id="features-local-variable-declarations"></a></p>

<h3 id="local-variable-declarations" class="numbered">Local variable declarations</h3>

<p><a id="variables"></a>
<a id="features-use-const-and-let"></a></p>

<h4 id="use-const-and-let" class="numbered">Use const and let</h4>

<p>Always use <code>const</code> or <code>let</code> to declare variables. Use <code>const</code> by default, unless
a variable needs to be reassigned. Never use <code>var</code>.</p>

<pre><code class="language-ts good">const foo = otherValue;  // Use if "foo" never changes.
let bar = someValue;     // Use if "bar" is ever assigned into later on.
</code></pre>

<p><code>const</code> and <code>let</code> are block scoped, like variables in most other languages.
<code>var</code> in JavaScript is function scoped, which can cause difficult to understand
bugs. Don't use it.</p>

<pre><code class="language-ts bad">var foo = someValue;     // Don't use - var scoping is complex and causes bugs.
</code></pre>

<p>Variables <em>must not</em> be used before their declaration.</p>

<p><a id="features-one-variable-per-declaration"></a></p>

<h4 id="one-variable-per-declaration" class="numbered">One variable per declaration</h4>

<p>Every local variable declaration declares only one variable: declarations such
as <code class="badcode">let a = 1, b = 2;</code> are not used.</p>

<p><a id="features-array-literals"></a></p>

<h3 id="array-literals" class="numbered">Array literals</h3>

<p><a id="features-arrays-ctor"></a></p>

<h4 id="array-constructor" class="numbered">Do not use the <code>Array</code> constructor</h4>

<p><em>Do not</em> use the <code>Array()</code> constructor, with or without <code>new</code>. It has confusing
and contradictory usage:</p>



<pre><code class="language-ts bad">const a = new Array(2); // [undefined, undefined]
const b = new Array(2, 3); // [2, 3];
</code></pre>



<p>Instead, always use bracket notation to initialize arrays, or <code>from</code> to
initialize an <code>Array</code> with a certain size:</p>

<pre><code class="language-ts good">const a = [2];
const b = [2, 3];

// Equivalent to Array(2):
const c = [];
c.length = 2;

// [0, 0, 0, 0, 0]
Array.from&lt;number&gt;({length: 5}).fill(0);
</code></pre>

 

<p><a id="features-arrays-non-numeric-properties"></a></p>

<h4 id="do-not-define-properties-on-arrays" class="numbered">Do not define properties on arrays</h4>

<p>Do not define or use non-numeric properties on an array (other than <code>length</code>).
Use a <code>Map</code> (or <code>Object</code>) instead.</p>

<p><a id="features-arrays-spread-operator"></a></p>

<h4 id="array-spread-syntax" class="numbered">Using spread syntax</h4>

<p>Using spread syntax <code>[...foo];</code> is a convenient shorthand for shallow-copying or
concatenating iterables.</p>

<pre><code class="language-ts good">const foo = [
  1,
];

const foo2 = [
  ...foo,
  6,
  7,
];

const foo3 = [
  5,
  ...foo,
];

foo2[1] === 6;
foo3[1] === 1;
</code></pre>

<p>When using spread syntax, the value being spread <em>must</em> match what is being
created. When creating an array, only spread iterables. Primitives (including
<code>null</code> and <code>undefined</code>) <em>must not</em> be spread.</p>

<pre><code class="language-ts bad">const foo = [7];
const bar = [5, ...(shouldUseFoo &amp;&amp; foo)]; // might be undefined

// Creates {0: 'a', 1: 'b', 2: 'c'} but has no length
const fooStrings = ['a', 'b', 'c'];
const ids = {...fooStrings};
</code></pre>

<pre><code class="language-ts good">const foo = shouldUseFoo ? [7] : [];
const bar = [5, ...foo];
const fooStrings = ['a', 'b', 'c'];
const ids = [...fooStrings, 'd', 'e'];
</code></pre>

<p><a id="features-arrays-destructuring"></a></p>

<h4 id="array-destructuring" class="numbered">Array destructuring</h4>

<p>Array literals may be used on the left-hand side of an assignment to perform
destructuring (such as when unpacking multiple values from a single array or
iterable). A final <q>rest</q> element may be included (with no space between the
<code>...</code> and the variable name). Elements should be omitted if they are unused.</p>

<pre><code class="language-ts good">const [a, b, c, ...rest] = generateResults();
let [, b,, d] = someArray;
</code></pre>

<p>Destructuring may also be used for function parameters. Always specify <code>[]</code> as
the default value if a destructured array parameter is optional, and provide
default values on the left hand side:</p>

<pre><code class="language-ts good">function destructured([a = 4, b = 2] = []) { … }
</code></pre>

<p>Disallowed:</p>

<pre><code class="language-ts bad">function badDestructuring([a, b] = [4, 2]) { … }
</code></pre>

<p>Tip: For (un)packing multiple values into a function’s parameter or return,
prefer object destructuring to array destructuring when possible, as it allows
naming the individual elements and specifying a different type for each.</p>

 

<p><a id="features-object-literals"></a></p>

<h3 id="object-literals" class="numbered">Object literals</h3>

<p><a id="features-objects-ctor"></a></p>

<h4 id="object-constructor" class="numbered">Do not use the <code>Object</code> constructor</h4>

<p>The <code>Object</code> constructor is disallowed. Use an object literal (<code>{}</code> or <code>{a: 0,
b: 1, c: 2}</code>) instead.</p>

<h4 id="iterating-objects" class="numbered">Iterating objects</h4>

<p>Iterating objects with <code>for (... in ...)</code> is error prone. It will include
enumerable properties from the prototype chain.</p>

<p>Do not use unfiltered <code>for (... in ...)</code> statements:</p>

<pre><code class="language-ts bad">for (const x in someObj) {
  // x could come from some parent prototype!
}
</code></pre>

<p>Either filter values explicitly with an <code>if</code> statement, or use <code>for (... of
Object.keys(...))</code>.</p>

<pre><code class="language-ts good">for (const x in someObj) {
  if (!someObj.hasOwnProperty(x)) continue;
  // now x was definitely defined on someObj
}
for (const x of Object.keys(someObj)) { // note: for _of_!
  // now x was definitely defined on someObj
}
for (const [key, value] of Object.entries(someObj)) { // note: for _of_!
  // now key was definitely defined on someObj
}
</code></pre>

<p><a id="using-the-spread-operator"></a></p>

<h4 id="object-spread-syntax" class="numbered">Using spread syntax</h4>

<p>Using spread syntax <code>{...bar}</code> is a convenient shorthand for creating a shallow
copy of an object. When using spread syntax in object initialization, later
values replace earlier values at the same key.</p>

<pre><code class="language-ts good">const foo = {
  num: 1,
};

const foo2 = {
  ...foo,
  num: 5,
};

const foo3 = {
  num: 5,
  ...foo,
}

foo2.num === 5;
foo3.num === 1;

</code></pre>

<p>When using spread syntax, the value being spread <em>must</em> match what is being
created. That is, when creating an object, only objects may be spread; arrays
and primitives (including <code>null</code> and <code>undefined</code>) <em>must not</em> be spread. Avoid
spreading objects that have prototypes other than the Object prototype (e.g.
class definitions, class instances, functions) as the behavior is unintuitive
(only enumerable non-prototype properties are shallow-copied).</p>

<pre><code class="language-ts bad">const foo = {num: 7};
const bar = {num: 5, ...(shouldUseFoo &amp;&amp; foo)}; // might be undefined

// Creates {0: 'a', 1: 'b', 2: 'c'} but has no length
const fooStrings = ['a', 'b', 'c'];
const ids = {...fooStrings};
</code></pre>

<pre><code class="language-ts good">const foo = shouldUseFoo ? {num: 7} : {};
const bar = {num: 5, ...foo};
</code></pre>

<p><a id="features-objects-computed-property-names"></a></p>

<h4 id="computed-property-names" class="numbered">Computed property names</h4>

<p>Computed property names (e.g. <code>{['key' + foo()]: 42}</code>) are allowed, and are
considered dict-style (quoted) keys (i.e., must not be mixed with non-quoted
keys) unless the computed property is a
<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol">symbol</a>
(e.g. <code>[Symbol.iterator]</code>).</p>

 

<p><a id="features-objects-destructuring"></a></p>

<h4 id="object-destructuring" class="numbered">Object destructuring</h4>

<p>Object destructuring patterns may be used on the left-hand side of an assignment
to perform destructuring and unpack multiple values from a single object.</p>

<p>Destructured objects may also be used as function parameters, but should be kept
as simple as possible: a single level of unquoted shorthand properties. Deeper
levels of nesting and computed properties may not be used in parameter
destructuring. Specify any default values in the left-hand-side of the
destructured parameter (<code>{str = 'some default'} = {}</code>, rather than
<code class="badcode">{str} = {str: 'some default'}</code>), and if a
destructured object is itself optional, it must default to <code>{}</code>.</p>

<p>Example:</p>

<pre><code class="language-ts good">interface Options {
  /** The number of times to do something. */
  num?: number;

  /** A string to do stuff to. */
  str?: string;
}

function destructured({num, str = 'default'}: Options = {}) {}
</code></pre>

<p>Disallowed:</p>

<pre><code class="language-ts bad">function nestedTooDeeply({x: {num, str}}: {x: Options}) {}
function nontrivialDefault({num, str}: Options = {num: 42, str: 'default'}) {}
</code></pre>

 

 

<p><a id="formatting-class-literals"></a>
<a id="features-classes"></a></p>

<h3 id="classes" class="numbered">Classes</h3>

<h4 id="class-declarations" class="numbered">Class declarations</h4>

<p>Class declarations <em>must not</em> be terminated with semicolons:</p>

<pre><code class="language-ts good">class Foo {
}
</code></pre>

<pre><code class="language-ts bad">class Foo {
}; // Unnecessary semicolon
</code></pre>

<p>In contrast, statements that contain class expressions <em>must</em> be terminated with
a semicolon:</p>

<pre><code class="language-ts good">export const Baz = class extends Bar {
  method(): number {
    return this.x;
  }
}; // Semicolon here as this is a statement, not a declaration
</code></pre>

<pre><code class="language-ts bad">exports const Baz = class extends Bar {
  method(): number {
    return this.x;
  }
}
</code></pre>

<p>It is neither encouraged nor discouraged to have blank lines separating class
declaration braces from other class content:</p>

<pre><code class="language-ts good">// No spaces around braces - fine.
class Baz {
  method(): number {
    return this.x;
  }
}

// A single space around both braces - also fine.
class Foo {

  method(): number {
    return this.x;
  }

}
</code></pre>

<h4 id="class-method-declarations" class="numbered">Class method declarations</h4>

<p>Class method declarations <em>must not</em> use a semicolon to separate individual
method declarations:</p>

<pre><code class="language-ts good">class Foo {
  doThing() {
    console.log("A");
  }
}
</code></pre>

<pre><code class="language-ts bad">class Foo {
  doThing() {
    console.log("A");
  }; // &lt;-- unnecessary
}
</code></pre>

<p>Method declarations should be separated from surrounding code by a single blank
line:</p>

<pre><code class="language-ts good">class Foo {
  doThing() {
    console.log("A");
  }

  getOtherThing(): number {
    return 4;
  }
}
</code></pre>

<pre><code class="language-ts bad">class Foo {
  doThing() {
    console.log("A");
  }
  getOtherThing(): number {
    return 4;
  }
}
</code></pre>

<p><a id="features-classes-overriding-tostring"></a></p>

<h5 id="overriding-tostring" class="numbered">Overriding toString</h5>

<p>The <code>toString</code> method may be overridden, but must always succeed and never have
visible side effects.</p>

<p>Tip: Beware, in particular, of calling other methods from toString, since
exceptional conditions could lead to infinite loops.</p>

<p><a id="features-classes-static-methods"></a></p>

<h4 id="static-methods" class="numbered">Static methods</h4>

<h5 id="avoid-private-static-methods" class="numbered">Avoid private static methods</h5>

<p>Where it does not interfere with readability, prefer module-local functions over
private static methods.</p>

<h5 id="avoid-static-method-dynamic-dispatch" class="numbered">Do not rely on dynamic dispatch</h5>

<p>Code <em>should not</em> rely on dynamic dispatch of static
methods. Static methods <em>should</em> only be called on the base class
itself (which defines it directly). Static methods <em>should not</em> be called on
variables containing a dynamic instance that may be either the constructor or a
subclass constructor (and <em>must</em> be defined with <code>@nocollapse</code> if this is done),
and <em>must not</em> be called directly on a subclass that doesn’t define the method
itself.</p>

<p>Disallowed:</p>

<pre><code class="language-ts bad">// Context for the examples below (this class is okay by itself)
class Base {
  /** @nocollapse */ static foo() {}
}
class Sub extends Base {}

// Discouraged: don't call static methods dynamically
function callFoo(cls: typeof Base) {
  cls.foo();
}

// Disallowed: don't call static methods on subclasses that don't define it themselves
Sub.foo();

// Disallowed: don't access this in static methods.
class MyClass {
  static foo() {
    return this.staticField;
  }
}
MyClass.staticField = 1;
</code></pre>

<h5 id="static-this" class="numbered">Avoid static <code>this</code> references</h5>

<p>Code <em>must not</em> use <code>this</code> in a static context.</p>

<p>JavaScript allows accessing static fields through <code>this</code>. Different from other
languages, static fields are also inherited.</p>

<pre><code class="bad">class ShoeStore {
  static storage: Storage = ...;

  static isAvailable(s: Shoe) {
    // Bad: do not use `this` in a static method.
    return this.storage.has(s.id);
  }
}

class EmptyShoeStore extends ShoeStore {
  static storage: Storage = EMPTY_STORE;  // overrides storage from ShoeStore
}
</code></pre>

<section class="zippy">

<p>Why?</p>

<p>This code is generally surprising: authors might not expect that static fields
can be accessed through the this pointer, and might be surprised to find that
they can be overridden - this feature is not commonly used.</p>

<p>This code also encourages an anti-pattern of having substantial static state,
which causes problems with testability.</p>

</section> 

<p><a id="disallowed-features-omitting-parents-with-new"></a>
<a id="features-classes-constructors"></a></p>

<h4 id="constructors" class="numbered">Constructors</h4>

<p>Constructor calls <em>must</em> use parentheses, even when no arguments are passed:</p>

<pre><code class="language-ts bad">const x = new Foo;
</code></pre>

<pre><code class="language-ts good">const x = new Foo();
</code></pre>

<p>Omitting parentheses can lead to subtle mistakes. These two lines are not
equivalent:</p>

<pre><code class="language-js good">new Foo().Bar();
new Foo.Bar();
</code></pre>

<p>It is unnecessary to provide an empty constructor or one that simply delegates
into its parent class because ES2015 provides a default class constructor if one
is not specified. However constructors with parameter properties, visibility
modifiers or parameter decorators <em>should not</em> be omitted even if the body of
the constructor is empty.</p>

<pre><code class="language-ts bad">class UnnecessaryConstructor {
  constructor() {}
}
</code></pre>

<pre><code class="language-ts bad">class UnnecessaryConstructorOverride extends Base {
    constructor(value: number) {
      super(value);
    }
}
</code></pre>

<pre><code class="language-ts good">class DefaultConstructor {
}

class ParameterProperties {
  constructor(private myService) {}
}

class ParameterDecorators {
  constructor(@SideEffectDecorator myService) {}
}

class NoInstantiation {
  private constructor() {}
}
</code></pre>

<p>The constructor should be separated from surrounding code both above and below
by a single blank line:</p>

<pre><code class="language-ts good">class Foo {
  myField = 10;

  constructor(private readonly ctorParam) {}

  doThing() {
    console.log(ctorParam.getThing() + myField);
  }
}
</code></pre>

<pre><code class="language-ts bad">class Foo {
  myField = 10;
  constructor(private readonly ctorParam) {}
  doThing() {
    console.log(ctorParam.getThing() + myField);
  }
}
</code></pre>

<h4 id="class-members" class="numbered">Class members</h4>

<h5 id="private-fields" class="numbered">No #private fields</h5>

<p>Do not use private fields (also known as private identifiers):</p>

<pre><code class="language-ts bad">class Clazz {
  #ident = 1;
}
</code></pre>

<p>Instead, use TypeScript's visibility annotations:</p>

<pre><code class="language-ts good">class Clazz {
  private ident = 1;
}
</code></pre>

<section class="zippy">

<p>Why?</p>

<p> Private identifiers cause substantial emit size and
performance regressions when down-leveled by TypeScript, and are unsupported
before ES2015. They can only be downleveled to ES2015, not lower. At the same
time, they do not offer substantial benefits when static type checking is used
to enforce visibility.</p>

</section> 

<h5 id="use-readonly" class="numbered">Use readonly</h5>

<p>Mark properties that are never reassigned outside of the constructor with the
<code>readonly</code> modifier (these need not be deeply immutable).</p>

<h5 id="parameter-properties" class="numbered">Parameter properties</h5>

<p>Rather than plumbing an obvious initializer through to a class member, use a
TypeScript
<a href="https://www.typescriptlang.org/docs/handbook/2/classes.html#parameter-properties">parameter property</a>.</p>

<pre><code class="language-ts bad">class Foo {
  private readonly barService: BarService;

  constructor(barService: BarService) {
    this.barService = barService;
  }
}
</code></pre>

<pre><code class="language-ts good">class Foo {
  constructor(private readonly barService: BarService) {}
}
</code></pre>

<p>If the parameter property needs documentation,
<a href="#parameter-property-comments">use an <code>@param</code> JSDoc tag</a>.</p>

<h5 id="field-initializers" class="numbered">Field initializers</h5>

<p>If a class member is not a parameter, initialize it where it's declared, which
sometimes lets you drop the constructor entirely.</p>

<pre><code class="language-ts bad">class Foo {
  private readonly userList: string[];

  constructor() {
    this.userList = [];
  }
}
</code></pre>

<pre><code class="language-ts good">class Foo {
  private readonly userList: string[] = [];
}
</code></pre>

<p>Tip: Properties should never be added to or removed from an instance after the
constructor is finished, since it significantly hinders VMs’ ability to optimize
classes' <q>shape</q>. Optional fields that may be filled in later should be
explicitly initialized to <code>undefined</code> to prevent later shape changes.</p>

<h5 id="properties-used-outside-of-class-lexical-scope" class="numbered">Properties used outside of class lexical scope</h5>

<p>Properties used from outside the lexical scope of their containing class, such
as an Angular component's properties used from a template, <em>must not</em> use
<code>private</code> visibility, as they are used outside of the lexical scope of their
containing class.</p>

<p>Use either <code>protected</code> or <code>public</code> as appropriate to the property in question.
Angular and AngularJS template properties should use <code>protected</code>, but Polymer
should use <code>public</code>.</p>

<p>TypeScript code <em>must not</em> use <code>obj['foo']</code> to bypass the visibility of a
property.</p>

<section class="zippy">

<p>Why?</p>

<p>When a property is <code>private</code>, you are declaring to both automated systems and
humans that the property accesses are scoped to the methods of the declaring
class, and they will rely on that. For example, a check for unused code will
flag a private property that appears to be unused, even if some other file
manages to bypass the visibility restriction.</p>

<p>Though it might appear that <code>obj['foo']</code> can bypass visibility in the TypeScript
compiler, this pattern can be broken by rearranging the build rules, and also
violates <a href="#optimization-compatibility">optimization compatibility</a>.</p>

</section> 

<p><a id="features-classes-getters-and-setters"></a></p>

<h5 id="classes-getters-and-setters" class="numbered">Getters and setters</h5>

 

<p>Getters and setters, also known as accessors, for class members <em>may</em> be used.
The getter method <em>must</em> be a
<a href="https://en.wikipedia.org/wiki/Pure_function">pure function</a> (i.e., result is
consistent and has no side effects: getters <em>must not</em> change observable state).
They are also useful as a means of restricting the visibility of internal or
verbose implementation details (shown below).</p>

<pre><code class="language-ts good">class Foo {
  constructor(private readonly someService: SomeService) {}

  get someMember(): string {
    return this.someService.someVariable;
  }

  set someMember(newValue: string) {
    this.someService.someVariable = newValue;
  }
}
</code></pre>

<pre><code class="language-ts bad">class Foo {
  nextId = 0;
  get next() {
    return this.nextId++; // Bad: getter changes observable state
  }
}
</code></pre>

<p>If an accessor is used to hide a class property, the hidden property <em>may</em> be
prefixed or suffixed with any whole word, like <code>internal</code> or <code>wrapped</code>. When
using these private properties, access the value through the accessor whenever
possible. At least one accessor for a property <em>must</em> be non-trivial: do not
define <q>pass-through</q> accessors only for the purpose of hiding a property.
Instead, make the property public (or consider making it <code>readonly</code> rather than
just defining a getter with no setter).</p>

<pre><code class="language-ts good">class Foo {
  private wrappedBar = '';
  get bar() {
    return this.wrappedBar || 'bar';
  }

  set bar(wrapped: string) {
    this.wrappedBar = wrapped.trim();
  }
}
</code></pre>

<pre><code class="language-ts bad">class Bar {
  private barInternal = '';
  // Neither of these accessors have logic, so just make bar public.
  get bar() {
    return this.barInternal;
  }

  set bar(value: string) {
    this.barInternal = value;
  }
}
</code></pre>

<p>Getters and setters <em>must not</em> be defined using <code>Object.defineProperty</code>, since
this interferes with property renaming.</p>

<p><a id="features-classes-computed-properties"></a></p>

<h5 id="class-computed-properties" class="numbered">Computed properties</h5>

<p>Computed properties may only be used in classes when the property is a symbol.
Dict-style properties (that is, quoted or computed non-symbol keys) are not
allowed (see
<a href="#features-objects-mixing-keys">rationale for not mixing key types</a>. A
<code>[Symbol.iterator]</code> method should be defined for any classes that are logically
iterable. Beyond this, <code>Symbol</code> should be used sparingly.</p>

<p>Tip: be careful of using any other built-in symbols (e.g.
<code>Symbol.isConcatSpreadable</code>) as they are not polyfilled by the compiler and will
therefore not work in older browsers.</p>

 

<h4 id="visibility" class="numbered">Visibility</h4>

<p>Restricting visibility of properties, methods, and entire types helps with
keeping code decoupled.</p>

<ul>
<li>Limit symbol visibility as much as possible.</li>
<li>Consider converting private methods to non-exported functions within the
same file but outside of any class, and moving private properties into a
separate, non-exported class.</li>
<li>TypeScript symbols are public by default. Never use the <code>public</code> modifier
except when declaring non-readonly public parameter properties (in
constructors).</li>
</ul>

<pre><code class="language-ts bad">class Foo {
  public bar = new Bar();  // BAD: 

