import MarkdownIt, { Token } from "markdown-it";
import container from "markdown-it-container";

/**
 * Markdown-it plugin for parsing :::infobox containers
 * Syntax: :::infobox Title
 *         | Field | Value |
 *         :::
 */
export default function infoboxnew(md: MarkdownIt): void {
  return container(md, "infobox", {
    marker: ":",
    validate: (params: string) => params.trim().match(/^infobox(?:\s+(.+))?$/),
    render: (tokens: Token[], idx: number) => {
      const token = tokens[idx];
      const info = token.info.trim().match(/^infobox(?:\s+(.+))?$/);
      const title = info?.[1] || "Infobox";

      if (token.nesting === 1) {
        // opening tag
        return `<div class="infobox" data-title="${title}">\n`;
      } else {
        // closing tag
        return "</div>\n";
      }
    },
  });
}
