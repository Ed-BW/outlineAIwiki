import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Node as ProsemirrorNode, NodeType } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { columnResizing, tableEditing } from "prosemirror-tables";
import type Token from "markdown-it/lib/token";
import { MarkdownSerializerState } from "../lib/markdown/serializer";
import { createTableInner } from "../commands/table";
import { FixTablesPlugin } from "../plugins/FixTables";
import { EditorStyleHelper } from "../styles/EditorStyleHelper";
import infoboxnew from "../rules/infoboxnew";
import Node from "./Node";

/**
 * Infobox node - A Wikipedia-style floating information box
 * Implemented as a specialized table with predefined styling
 */
export default class InfoboxNew extends Node {
  get name() {
    return "container_infobox";
  }

  get rulePlugins() {
    return [infoboxnew];
  }

  get schema(): NodeSpec {
    return {
      content: "tr+",
      tableRole: "table",
      isolating: true,
      group: "block",
      attrs: {
        title: {
          default: "Infobox",
        },
      },
      parseDOM: [
        {
          tag: "div.infobox",
          getAttrs: (node: HTMLElement) => {
            const table = node.querySelector("table");
            const title = node.querySelector(".infobox-title")?.textContent;
            return table ? { title: title || "Infobox" } : false;
          },
        },
      ],
      toDOM(node) {
        return [
          "div",
          { class: `${EditorStyleHelper.infobox} infobox` },
          [
            "div",
            { class: "infobox-title", contentEditable: "false" },
            node.attrs.title,
          ],
          ["table", {}, ["tbody", 0]],
        ];
      },
    };
  }

  inputRules({ type: _type }: { type: NodeType }) {
    return [
      // Trigger infobox creation with :::infobox
      new InputRule(/^:::infobox(?:\s+(.+))?$/, (state, match, start, end) => {
        const title = match[1] || "Infobox";
        // Create a 2-column table with 5 rows by default
        const nodes = createTableInner(state, 5, 2);
        const infoboxNode = state.schema.nodes.container_infobox.create(
          { title },
          nodes[0].content
        );
        const tr = state.tr
          .replaceWith(start - 1, end, infoboxNode)
          .scrollIntoView();
        // Place cursor in first cell
        const resolvedPos = tr.doc.resolve(start + 2);
        tr.setSelection(TextSelection.near(resolvedPos));
        return tr;
      }),
    ];
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    state.write(`:::infobox ${node.attrs.title}\n\n`);
    state.renderTable(node);
    state.write("\n:::\n");
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "container_infobox",
      getAttrs: (tok: Token) => ({
        title: tok.info?.replace(/^infobox\s*/, "") || "Infobox",
      }),
    };
  }

  get plugins() {
    return [
      columnResizing({
        handleWidth: 5,
        cellMinWidth: 100,
      }),
      tableEditing(),
      new FixTablesPlugin(),
    ];
  }
}
