import { InputRule } from "prosemirror-inputrules";
import { NodeSpec, Node as ProsemirrorNode } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import { columnResizing, tableEditing } from "prosemirror-tables";
import { MarkdownSerializerState } from "../lib/markdown/serializer";
import { FixTablesPlugin } from "../plugins/FixTables";
import { EditorStyleHelper } from "../styles/EditorStyleHelper";
import { createTableInner } from "../commands/table";
import infoboxRule from "../rules/infobox";
import Node from "./Node";
import { InfoboxView } from "./InfoboxView";

export default class Infobox extends Node {
  get name() {
    return "container_infobox";
  }

  get schema(): NodeSpec {
    return {
      content: "tr+",
      tableRole: "table",
      isolating: true,
      group: "block",
      parseDOM: [
        {
          tag: "div.infobox",
          getAttrs: (node: HTMLElement) => {
            const table = node.querySelector("table");
            return table ? {} : false;
          },
        },
      ],
      attrs: {
        align: {
          default: "right",
        },
      },
      toDOM(node) {
        return [
          "div",
          {
            class: `${EditorStyleHelper.infobox} infobox`,
            "data-align": node.attrs.align,
          },
          ["table", {}, ["tbody", 0]],
        ];
      },
    };
  }

  inputRules() {
    return [
      // Trigger infobox creation with :::infobox
      new InputRule(/^(:::infobox)$/, (state, _, start, end) => {
        const nodes = createTableInner(state, 2, 2);
        const infoboxNode = state.schema.nodes.container_infobox.create(
          { align: "right" },
          nodes[0].content
        );
        const tr = state.tr
          .replaceWith(start - 1, end, infoboxNode)
          .scrollIntoView();
        const resolvedPos = tr.doc.resolve(start + 1);
        tr.setSelection(TextSelection.near(resolvedPos));
        return tr;
      }),
    ];
  }

  toMarkdown(state: MarkdownSerializerState, node: ProsemirrorNode) {
    state.write(":::infobox\n\n");
    state.renderTable(node);
    state.write("\n:::\n");
    state.closeBlock(node);
  }

  parseMarkdown() {
    return {
      block: "container_infobox",
      getAttrs: () => ({ align: "right" }),
    };
  }

  get rulePlugins() {
    return [infoboxRule];
  }

  get plugins() {
    return [
      columnResizing({
        View: InfoboxView,
      }),
      tableEditing(),
      new FixTablesPlugin(),
    ];
  }
}
