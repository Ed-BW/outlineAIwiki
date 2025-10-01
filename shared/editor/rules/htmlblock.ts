import { PluginSimple } from "markdown-it";

/**
 * A markdown-it plugin that parses HTML div elements and converts them
 * to html_block tokens that can be rendered by the HTMLBlock node.
 */
const htmlblock: PluginSimple = (md) => {
  md.block.ruler.before(
    "html_block",
    "custom_html_block",
    (state, startLine, endLine, silent) => {
      let pos = state.bMarks[startLine] + state.tShift[startLine];
      let max = state.eMarks[startLine];

      // Check if line starts with <div
      const lineText = state.src.slice(pos, max);
      const openMatch = lineText.match(/^<div(\s+class="([^"]+)")?>/);

      if (!openMatch) {
        return false;
      }

      if (silent) {
        return true;
      }

      const className = openMatch[2] || null;
      let nextLine = startLine;
      let foundClosing = false;

      // Find the closing </div>
      for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        const closeText = state.src.slice(pos, max);

        if (closeText.trim() === "</div>") {
          foundClosing = true;
          break;
        }
      }

      if (!foundClosing) {
        return false;
      }

      const oldParent = state.parentType;
      const oldLineMax = state.lineMax;
      state.parentType = "html_block" as any;

      const token_o = state.push("html_block_open", "div", 1);
      token_o.markup = "<div>";
      token_o.map = [startLine, nextLine + 1];
      if (className) {
        token_o.attrSet("class", className);
      }

      state.md.block.tokenize(state, startLine + 1, nextLine);

      const token_c = state.push("html_block_close", "div", -1);
      token_c.markup = "</div>";

      state.parentType = oldParent;
      state.lineMax = oldLineMax;
      state.line = nextLine + 1;

      return true;
    }
  );
};

export default htmlblock;
