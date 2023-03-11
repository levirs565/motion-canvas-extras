import { Shape, ShapeProps } from "@motion-canvas/2d/lib/components";
import { signal } from "@motion-canvas/2d/lib/decorators";
import { DesiredLength } from "@motion-canvas/2d/lib/partials";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import { BBox, SerializedVector2 } from "@motion-canvas/core/lib/types";
import { useLogger } from "@motion-canvas/core/lib/utils";
import { getPathBBox } from "../utils";

export interface PathProps extends ShapeProps {
  data?: SignalValue<string>;
}

export class Path extends Shape {
  @signal()
  public declare readonly data: SimpleSignal<string, this>;

  public constructor(props: PathProps) {
    super(props);
  }

  protected override applyStyle(context: CanvasRenderingContext2D): void {
    super.applyStyle(context);
    const pathBBox = getPathBBox(this.data()).center;
    context.translate(-pathBBox.x, -pathBBox.y);
  }

  protected override desiredSize(): SerializedVector2<DesiredLength> {
    return getPathBBox(this.data()).size;
  }

  protected override getPath(): Path2D {
    const path = new Path2D(this.data());
    return path;
  }
}
