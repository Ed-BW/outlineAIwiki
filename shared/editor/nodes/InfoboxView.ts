import { Node } from "prosemirror-model";
import { TableView as ProsemirrorTableView } from "prosemirror-tables";
import { EditorStyleHelper } from "../styles/EditorStyleHelper";

export class InfoboxView extends ProsemirrorTableView {
  private container: HTMLDivElement;

  public constructor(
    public node: Node,
    public cellMinWidth: number
  ) {
    super(node, cellMinWidth);

    // Remove the default table from the dom
    this.dom.removeChild(this.table);

    // Create a container div for the infobox
    this.container = document.createElement("div");
    this.container.classList.add(EditorStyleHelper.infobox, "infobox");

    // Set alignment attribute
    if (node.attrs.align) {
      this.container.setAttribute("data-align", node.attrs.align);
    }

    // Create inner wrapper for table
    const tableWrapper = document.createElement("div");
    tableWrapper.classList.add(EditorStyleHelper.infoboxTable);
    tableWrapper.appendChild(this.table);

    this.container.appendChild(tableWrapper);
    this.dom.appendChild(this.container);

    // Apply styles
    this.updateStyles(node);
  }

  public override update(node: Node) {
    const result = super.update(node);
    if (result) {
      this.updateStyles(node);
    }
    return result;
  }

  public override ignoreMutation(record: MutationRecord): boolean {
    if (
      record.type === "attributes" &&
      (record.target === this.dom || record.target === this.container) &&
      (record.attributeName === "class" ||
        record.attributeName === "style" ||
        record.attributeName === "data-align")
    ) {
      return true;
    }

    return (
      record.type === "attributes" &&
      (record.target === this.table || this.colgroup.contains(record.target))
    );
  }

  private updateStyles(node: Node) {
    // Update alignment
    if (node.attrs.align) {
      this.container.setAttribute("data-align", node.attrs.align);
    }
  }
}
