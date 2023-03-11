import {
  Layout,
  LayoutProps,
  Node,
  NodeProps,
  Rect,
  ShapeProps,
} from "@motion-canvas/2d/lib/components";
import { signal } from "@motion-canvas/2d/lib/decorators";
import { DesiredLength } from "@motion-canvas/2d/lib/partials";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import {
  BBox,
  SerializedVector2,
  Vector2,
} from "@motion-canvas/core/lib/types";
import { useLogger } from "@motion-canvas/core/lib/utils";
import {
  decomposeMatrixTransformation,
  firstNotNull,
  getPathBBox,
} from "../utils";
import { Path } from "./Path";

interface ParsedSVG {
  width: number;
  height: number;
  nodes: Array<Node>;
}

export interface SVGProps extends LayoutProps {
  svg?: SignalValue<string>;
}

export class SVG extends Layout {
  @signal()
  public declare readonly svg: SimpleSignal<string, this>;
  private viewBox: BBox;

  public constructor(props: SVGProps) {
    super(props);

    const svg = this.svg();
    const container = document.createElement("div");
    container.innerHTML = svg;

    const svgRoot = container.querySelector("svg");
    const { x, y, width, height } = svgRoot.viewBox.baseVal;
    const bbox = new BBox(x, y, width, height);
    const center = bbox.center;

    const rootTransform = new DOMMatrix().translate(-center.x, -center.y);

    const children = Array.from(
      this.extractGroupShape(svgRoot, svgRoot, rootTransform, {})
    );
    children.forEach((child) => this.add(child));

    this.viewBox = bbox;
  }

  protected override desiredSize(): SerializedVector2<DesiredLength> {
    return this.viewBox.size;
  }

  private getElementTransformation(
    element: SVGGraphicsElement,
    parentTransform: DOMMatrix
  ) {
    const transform = element.transform.baseVal.consolidate();
    const x = element.getAttribute("x");
    const y = element.getAttribute("y");
    const transformMatrix = (
      transform ? parentTransform.multiply(transform.matrix) : parentTransform
    ).translate(x ? parseFloat(x) : 0, y ? parseFloat(y) : 0);
    return transformMatrix;
  }

  private getElementStyle(
    element: SVGGraphicsElement,
    inheritedStyle: ShapeProps
  ): ShapeProps {
    return {
      fill: firstNotNull(element.getAttribute("fill"), inheritedStyle.fill),
      stroke: firstNotNull(
        element.getAttribute("stroke"),
        inheritedStyle.stroke
      ),
      lineWidth: firstNotNull(
        parseFloat(element.getAttribute("stroke-width")),
        inheritedStyle.lineWidth
      ),
    };
  }

  private *extractGroupShape(
    element: SVGElement,
    svgRoot: Element,
    parentTransform: DOMMatrix,
    inheritedStyle: ShapeProps
  ): Generator<Node> {
    for (const child of element.children) {
      if (!(child instanceof SVGGraphicsElement)) continue;

      yield* this.extractElementShape(
        child,
        svgRoot,
        parentTransform,
        inheritedStyle
      );
    }
  }

  private *extractElementShape(
    child: SVGGraphicsElement,
    svgRoot: Element,
    parentTransform: DOMMatrix,
    inheritedStyle: ShapeProps
  ): Generator<Node> {
    const transformMatrix = this.getElementTransformation(
      child,
      parentTransform
    );
    const style = this.getElementStyle(child, inheritedStyle);
    if (child.tagName == "g")
      yield* this.extractGroupShape(child, svgRoot, transformMatrix, style);
    else if (child.tagName == "use") {
      const hrefElement = svgRoot.querySelector(
        (child as SVGUseElement).href.baseVal
      )!;
      if (!(hrefElement instanceof SVGGraphicsElement)) return;

      yield* this.extractElementShape(
        hrefElement,
        svgRoot,
        transformMatrix,
        inheritedStyle
      );
    } else if (child.tagName == "path") {
      const data = child.getAttribute("d");
      if (!data) {
        useLogger().warn("blank path data at " + child.id);
        return;
      }
      const center = getPathBBox(data).center;
      yield new Path({
        data,
        ...style,
        ...decomposeMatrixTransformation(
          transformMatrix.translate(center.x, center.y)
        ),
      });
    } else if (child.tagName == "rect") {
      const width = parseFloat(child.getAttribute("width"));
      const height = parseFloat(child.getAttribute("height"));
      const center = new BBox(0, 0, width, height).center;
      yield new Rect({
        width,
        height,
        ...style,
        ...decomposeMatrixTransformation(
          transformMatrix.translate(center.x, center.y)
        ),
      });
    }
  }
}
