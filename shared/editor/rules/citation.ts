import MarkdownIt, { Token, StateCore } from "markdown-it";

function renderCitationRef(tokens: Token[], idx: number) {
  const id = tokens[idx].attrGet("id");
  const label = id || "?";
  return `<sup class="citation-ref" data-id="${label}">[${label}]</sup>`;
}

/**
 * Markdown-it rule to convert inline text like "[^1]" into a custom
 * token `citation_ref` that we can map to a ProseMirror node.
 */
function parseCitations(state: StateCore) {
  // Support both [^1] and ^[1]^ styles
  const re = /\[\^(\d+)\]|\^\[(\d+)\]\^/g;

  for (let i = 0; i < state.tokens.length; i++) {
    const tok = state.tokens[i];
    if (!(tok.type === "inline" && tok.children)) {
      continue;
    }

    const newChildren: Token[] = [];

    for (const child of tok.children) {
      if (child.type !== "text" || !child.content) {
        newChildren.push(child);
        continue;
      }

      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = re.exec(child.content))) {
        const [full, idBracket, idCaret] = match;
        const id = idBracket || idCaret;
        const startIndex = match.index;
        const endIndex = startIndex + full.length;

        // Push any text prior to the match
        if (startIndex > lastIndex) {
          const textTok = new state.Token("text", "", 0);
          textTok.content = child.content.slice(lastIndex, startIndex);
          newChildren.push(textTok);
        }

        // Push the citation_ref token
        const citeTok = new state.Token("citation_ref", "", 0);
        citeTok.attrSet("id", id);
        // Store original content for potential debug
        citeTok.content = full;
        newChildren.push(citeTok);

        lastIndex = endIndex;
      }

      // Push remaining text after the last match
      if (lastIndex < child.content.length) {
        const textTok = new state.Token("text", "", 0);
        textTok.content = child.content.slice(lastIndex);
        newChildren.push(textTok);
      }
    }

    state.tokens[i].children = newChildren;
  }
}

export default function citation(md: MarkdownIt) {
  md.renderer.rules.citation_ref = renderCitationRef;
  md.core.ruler.after("inline", "citation_ref", parseCitations);
}


