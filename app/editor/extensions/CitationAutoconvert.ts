import { Plugin } from "prosemirror-state";
import { Node as PMNode } from "prosemirror-model";
import Extension from "@shared/editor/lib/Extension";

export default class CitationAutoconvert extends Extension {
  get name() {
    return "citation-autoconvert";
  }

  get plugins() {
    const toCite = (doc: PMNode) => {
      const bracketRe = /\[\^(\d+)\]/g;
      const caretRe = /\^\[(\d+)\]\^/g;

      const steps: { from: number; to: number; id: string }[] = [];

      let pos = 0;
      doc.descendants((node, posHere) => {
        if (node.isText && node.text) {
          const collect = (re: RegExp) => {
            let m: RegExpExecArray | null;
            re.lastIndex = 0;
            while ((m = re.exec(node.text!))) {
              const id = m[1];
              const from = posHere + m.index;
              const to = from + m[0].length;
              steps.push({ from, to, id });
            }
          };
          collect(bracketRe);
          collect(caretRe);
        }
        return true;
      });
      return steps;
    };

    return [
      new Plugin({
        view: (editorView) => {
          // Convert patterns shortly after mount and after each state update where doc changed
          let prevVersion = editorView.state.doc;
          const run = () => {
            const { state } = editorView;
            const steps = toCite(state.doc);
            if (!steps.length) return;
            const tr = state.tr;
            // Apply from end to start to preserve positions
            steps
              .sort((a, b) => b.from - a.from)
              .forEach(({ from, to, id }) => {
                const cite = state.schema.nodes.citation_ref;
                if (cite) tr.replaceWith(from, to, cite.create({ id }));
              });
            if (tr.docChanged) editorView.dispatch(tr);
          };

          setTimeout(run, 0);

          return {
            update: (view) => {
              if (view.state.doc !== prevVersion) {
                prevVersion = view.state.doc;
                setTimeout(run, 0);
              }
            },
          };
        },
      }),
    ];
  }
}





