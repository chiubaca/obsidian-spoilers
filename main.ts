import { Plugin } from "obsidian";
import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

// Regex to match ||text|| but not |||
const MASK_REGEX = /\|\|(?!\|)(.*?)\|\|/g;

// ── Reading Mode (Markdown Post-Processor) ──────────────────────────

function processTextNodes(el: HTMLElement) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.nodeValue && MASK_REGEX.test(node.nodeValue)) {
      textNodes.push(node);
    }
    MASK_REGEX.lastIndex = 0;
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue!;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    MASK_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = MASK_REGEX.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex, match.index))
        );
      }

      // Create the masked span
      const masked = createMaskedSpan(match[1]);
      fragment.appendChild(masked);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
  }
}

function createMaskedSpan(content: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "spoiler-mask";
  span.dataset.content = content;
  span.textContent = "•".repeat(Math.max(content.length, 4));
  span.setAttribute("aria-label", "Click to reveal spoiler");

  span.addEventListener("click", (e) => {
    e.stopPropagation();
    const isRevealed = span.classList.toggle("spoiler-mask--revealed");
    span.textContent = isRevealed
      ? content
      : "•".repeat(Math.max(content.length, 4));
  });

  return span;
}

// ── Live Preview (CodeMirror 6 Extension) ───────────────────────────

class MaskWidget extends WidgetType {
  constructor(
    readonly content: string,
    readonly fullMatch: string
  ) {
    super();
  }

  toDOM(): HTMLElement {
    return createMaskedSpan(this.content);
  }

  eq(other: MaskWidget): boolean {
    return this.content === other.content;
  }
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc;

  for (let i = 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    const lineText = line.text;

    MASK_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = MASK_REGEX.exec(lineText)) !== null) {
      const from = line.from + match.index;
      const to = from + match[0].length;

      // Don't decorate if the cursor is inside this range
      const cursorInside = view.state.selection.ranges.some(
        (r) => r.from >= from && r.to <= to
      );

      if (!cursorInside) {
        builder.add(
          from,
          to,
          Decoration.replace({
            widget: new MaskWidget(match[1], match[0]),
          })
        );
      }
    }
  }

  return builder.finish();
}

const maskViewPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.selectionSet ||
        update.viewportChanged
      ) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// ── Plugin ──────────────────────────────────────────────────────────

export default class SpoilersPlugin extends Plugin {
  async onload() {
    // Reading mode
    this.registerMarkdownPostProcessor((el: HTMLElement) => {
      processTextNodes(el);
    });

    // Live preview mode
    this.registerEditorExtension(maskViewPlugin);
  }
}
