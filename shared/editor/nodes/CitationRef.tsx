import { Token } from "markdown-it";
import { Node as PMNode, NodeSpec, NodeType } from "prosemirror-model";
import { InputRule } from "prosemirror-inputrules";
import { MarkdownSerializerState } from "prosemirror-markdown";
import styled from "styled-components";
import { s } from "@shared/styles";
import Tooltip from "~/components/Tooltip";
import ReactNode from "./ReactNode";

const Sup = styled.sup`
  user-select: none;
  color: ${s("textSecondary")};
  cursor: var(--pointer);
  font-size: 0.8em;
  vertical-align: super;
  padding-left: 2px;
`;

export default class CitationRef extends ReactNode {
  get name() {
    return "citation_ref";
  }

  inputRules({ type }: { type: NodeType }) {
    const toNode = (id: string) => (state, _match, start: number, end: number) => {
      return state.tr.replaceWith(start, end, type.create({ id }));
    };

    const bracketRule = new InputRule(/\[\^(\d+)\]$/, (state, match, start, end) =>
      toNode(match[1])(state, match, start, end)
    );
    const caretRule = new InputRule(/\^\[(\d+)\]\^$/, (state, match, start, end) =>
      toNode(match[1])(state, match, start, end)
    );

    return [bracketRule, caretRule];
  }

  get schema(): NodeSpec {
    return {
      attrs: {
        id: { default: null },
      },
      inline: true,
      group: "inline",
      atom: true,
      selectable: false,
      parseDOM: [
        {
          tag: "sup.citation-ref",
          getAttrs: (dom: HTMLElement) => ({ id: dom.dataset.id ?? null }),
        },
      ],
      toDOM: (node) => [
        "sup",
        { class: "citation-ref", "data-id": node.attrs.id },
        `[${node.attrs.id}]`,
      ],
    };
  }

  component = ({ node }: any) => {
    const id = node.attrs.id ?? "?";
    const viewDoc = this.editor?.view?.state?.doc as PMNode | undefined;
    const source = viewDoc ? findSourceForId(viewDoc, String(id)) : undefined;
    const tooltip = source ? (
      <span>
        Source [{id}]: <a href={source.href} target="_blank" rel="noopener noreferrer">{source.title || source.href}</a>
      </span>
    ) : (
      `Source [${id}]`
    );

    return (
      <Tooltip content={tooltip} side="top" sideOffset={6}>
        <Sup className="citation-ref" data-id={id}>[{id}]</Sup>
      </Tooltip>
    );
  };

  toMarkdown(state: MarkdownSerializerState, node: PMNode) {
    // Emit as Markdown footnote-style inline marker
    const id = node.attrs.id ?? "?";
    state.write(`[^${id}]`);
  }

  parseMarkdown() {
    return {
      node: this.name,
      getAttrs: (tok: Token) => ({ id: tok.attrGet("id") }),
    };
  }
}

function findSourceForId(doc: PMNode, id: string): { href: string; title?: string } | undefined {
  // Heuristic: look for a heading titled "Sources" or "References" followed by an ordered_list,
  // then pick the nth item and extract the first link href and its text as title
  let headingIndex = -1;
  for (let i = 0; i < doc.childCount; i++) {
    const node = doc.child(i);
    if (node.type.name === "heading") {
      const text = node.textContent.trim().toLowerCase();
      if (text === "sources" || text === "references") {
        headingIndex = i;
      }
    }
    if (headingIndex >= 0 && i > headingIndex) {
      const next = node;
      if (next.type.name === "ordered_list") {
        const idx = parseInt(id, 10) - 1;
        const item = next.child(idx);
        if (item) {
          let href: string | undefined;
          let title: string | undefined;
          item.descendants((n) => {
            if (n.marks) {
              for (const mark of n.marks) {
                if (mark.type.name === "link" && mark.attrs.href && !href) {
                  href = mark.attrs.href;
                  title = n.text || mark.attrs.href;
                }
              }
            }
            return true;
          });
          if (href) {
            return { href, title };
          }
        }
        return undefined;
      }
    }
  }
  return undefined;
}


