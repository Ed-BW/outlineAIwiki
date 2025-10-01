import { NodeSpec, Node as ProsemirrorNode } from "prosemirror-model";
import { MarkdownSerializerState } from "../lib/markdown/serializer";
import htmlblock from "../rules/htmlblock";
import Node from "./Node";

/**
 * HTMLBlock node allows preservation of HTML div elements with classes
 * like infobox for Wikipedia-style floating boxes.
 */
export default class HTMLBlock extends Node {
  get name() {
    return "html_block";
  }

  get schema(): NodeSpec {
    return {
      content: "block+",
      group: "block",
      attrs: {
        className: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "div[class]",
          getAttrs: (dom: HTMLElement) => ({
            className: dom.getAttribute("class"),
          }),
        },
      ],
      toDOM: (node) => [
        "div",
        {
          class: node.attrs.className,
        },
        0,
      ],
    };
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    const className = node.attrs.className;
    if (className) {
      state.write(`<div class="${className}">\n\n`);
    } else {
      state.write("<div>\n\n");
    }
    state.renderContent(node);
    state.write("\n</div>\n");
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "html_block",
      getAttrs: (tok: any) => ({
        className: tok.attrGet?.("class") || null,
      }),
    };
  }

  get rulePlugins() {
    return [htmlblock];
  }
}
