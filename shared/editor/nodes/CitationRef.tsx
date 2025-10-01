import { Token } from "markdown-it";
import { Node as PMNode, NodeSpec, NodeType } from "prosemirror-model";
import { InputRule } from "prosemirror-inputrules";
import { MarkdownSerializerState } from "prosemirror-markdown";
import styled from "styled-components";
import ReactNode from "./ReactNode";

const Sup = styled.sup`
  user-select: none;
  color: #6c757d;
  cursor: pointer;
  font-size: 0.8em;
  vertical-align: super;
  padding-left: 2px;
`;

export default class CitationRef extends ReactNode {
  get name() {
    return "citation_ref";
  }

  inputRules({ type }: { type: NodeType }) {
    const toNode =
      (id: string) => (state, _match, start: number, end: number) =>
        state.tr.replaceWith(start, end, type.create({ id }));

    const bracketRule = new InputRule(
      /\[\^(\d+)\]$/,
      (state, match, start, end) => toNode(match[1])(state, match, start, end)
    );
    const caretRule = new InputRule(
      /\^\[(\d+)\]\^$/,
      (state, match, start, end) => toNode(match[1])(state, match, start, end)
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

  component = ({ node }: { node: PMNode }) => {
    const id = node.attrs.id ?? "?";
    return (
      <Sup className="citation-ref" data-id={id}>
        [{id}]
      </Sup>
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
