import { Shape, ShapeProps } from "@motion-canvas/2d/lib/components";
import { signal } from "@motion-canvas/2d/lib/decorators";
import { DesiredLength } from "@motion-canvas/2d/lib/partials";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import {
  BBox,
  SerializedVector2,
  Vector2,
} from "@motion-canvas/core/lib/types";
import { useLogger } from "@motion-canvas/core/lib/utils";
import bound from "svg-path-bounds";

export interface PathProps extends ShapeProps {
  data?: SignalValue<string>;
}

export class Path extends Shape {
  @signal()
  public declare readonly data: SimpleSignal<string, this>;

  public constructor(props: PathProps) {
    super(props);
  }

  private getPathBBox() {
    const [left, top, right, bottom] = bound(this.data());
    const bbox = new BBox();
    bbox.left = left;
    bbox.top = top;
    bbox.right = right;
    bbox.bottom = bottom;
    return bbox;
  }

  protected override applyStyle(context: CanvasRenderingContext2D): void {
    super.applyStyle(context);
    const pathBBox = this.getPathBBox();
    const pathCenter = BBox.fromSizeCentered(pathBBox.size);
    context.translate(pathCenter.x, pathCenter.y);
    context.translate(-pathBBox.left, -pathBBox.top);
  }

  protected override desiredSize(): SerializedVector2<DesiredLength> {
    return this.getPathBBox().size;
  }

  protected override getPath(): Path2D {
    const path = new Path2D(this.data());
    return path;
  }
}
