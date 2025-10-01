import MarkdownIt, { Token } from "markdown-it";
import customFence from "markdown-it-container";

export default function infobox(md: MarkdownIt): void {
  return customFence(md, "infobox", {
    marker: ":",
    validate: (params: string) => params.trim() === "infobox",
    render(tokens: Token[], idx: number) {
      if (tokens[idx].nesting === 1) {
        // opening tag
        return '<div class="infobox" data-align="right">\n';
      } else {
        // closing tag
        return "</div>\n";
      }
    },
  });
}
