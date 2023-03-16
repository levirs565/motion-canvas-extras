import { Shape, ShapeProps, View2D } from "@motion-canvas/2d/lib/components";
import { computed, signal } from "@motion-canvas/2d/lib/decorators";
import { DesiredLength } from "@motion-canvas/2d/lib/partials";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import { BBox, SerializedVector2 } from "@motion-canvas/core/lib/types";

export interface PathProps extends ShapeProps {
  data?: SignalValue<string>;
}

export class Path extends Shape {
  @signal()
  public declare readonly data: SimpleSignal<string, this>;

  public constructor(props: PathProps) {
    super(props);
  }

  @computed()
  public getPathBBox() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svg.appendChild(path);
    View2D.shadowRoot.appendChild(svg);
    path.setAttribute("d", this.data());
    const bbox = new BBox(path.getBBox());
    View2D.shadowRoot.removeChild(svg);
    return bbox;
  }

  protected override applyStyle(context: CanvasRenderingContext2D): void {
    super.applyStyle(context);
    const pathBBox = this.getPathBBox().center;
    context.translate(-pathBBox.x, -pathBBox.y);
  }

  protected override desiredSize(): SerializedVector2<DesiredLength> {
    return this.getPathBBox().size;
  }

  protected override getPath(): Path2D {
    const path = new Path2D(this.data());
    return path;
  }
}
