import {
  Layout,
  LayoutProps,
  Node,
  Rect,
  ShapeProps,
} from "@motion-canvas/2d/lib/components";
import { computed, signal } from "@motion-canvas/2d/lib/decorators";
import { DesiredLength } from "@motion-canvas/2d/lib/partials";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import {
  clampRemap,
  easeInOutSine,
  tween,
} from "@motion-canvas/core/lib/tweening";
import {
  BBox,
  SerializedVector2,
  Vector2,
} from "@motion-canvas/core/lib/types";
import { useLogger } from "@motion-canvas/core/lib/utils";
import diffSequence from "diff-sequences";
import {
  decomposeMatrixTransformation,
  easeInOutSineVector2,
  firstNotNull,
  getPathBBox,
} from "../utils";
import { Path } from "./Path";

interface ParsedSVG {
  size: Vector2;
  nodes: Array<Node>;
}

interface SVGDiff {
  fromSize: Vector2;
  toSize: Vector2;
  inserted: Array<Node>;
  deleted: Array<Node>;
  transformed: Array<{
    from: Node;
    to: Node;
  }>;
}

export interface SVGProps extends LayoutProps {
  svg?: SignalValue<string>;
}

export class SVG extends Layout {
  @signal()
  public declare readonly svg: SimpleSignal<string, this>;

  public constructor(props: SVGProps) {
    super(props);
    this.spawner(this.parsedNodes);
  }

  protected override desiredSize(): SerializedVector2<DesiredLength> {
    const custom = super.desiredSize();
    const { x, y } = this.parsed().size;
    return {
      x: custom.x ?? x,
      y: custom.y ?? y,
    };
  }

  @computed()
  private parsed() {
    return this.parseSVG(this.svg());
  }

  @computed()
  private parsedNodes() {
    return this.parsed().nodes;
  }

  private parseSVG(svg: string): ParsedSVG {
    const container = document.createElement("div");
    container.innerHTML = svg;

    const svgRoot = container.querySelector("svg");
    const { x, y, width, height } = svgRoot.viewBox.baseVal;
    const viewBox = new BBox(x, y, width, height);
    const center = viewBox.center;

    const rootTransform = new DOMMatrix().translate(-center.x, -center.y);

    const nodes = Array.from(
      this.extractGroupShape(svgRoot, svgRoot, rootTransform, {})
    );
    return {
      size: viewBox.size,
      nodes,
    };
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
      layout: false,
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

  private isNodeEqual(aShape: Node, bShape: Node): boolean {
    if (aShape.constructor !== bShape.constructor) return false;
    if (
      aShape instanceof Path &&
      bShape instanceof Path &&
      aShape.data() !== bShape.data()
    )
      return false;

    return true;
  }

  private diffSVG(from: ParsedSVG, to: ParsedSVG): SVGDiff {
    const diff: SVGDiff = {
      fromSize: from.size,
      toSize: to.size,
      inserted: [],
      deleted: [],
      transformed: [],
    };

    const aNodes = from.nodes;
    const bNodes = to.nodes;
    const aLength = aNodes.length;
    const bLength = bNodes.length;
    let aIndex = 0;
    let bIndex = 0;

    diffSequence(
      aLength,
      bLength,
      (aIndex, bIndex) => {
        return this.isNodeEqual(aNodes[aIndex], bNodes[bIndex]);
      },
      (nCommon, aCommon, bCommon) => {
        if (aIndex !== aCommon)
          diff.deleted.push(...aNodes.slice(aIndex, aCommon));
        if (bIndex !== bCommon)
          diff.inserted.push(...bNodes.slice(bIndex, bCommon));

        aIndex = aCommon;
        bIndex = bCommon;
        for (let x = 0; x < nCommon; x++) {
          diff.transformed.push({
            from: aNodes[aIndex],
            to: bNodes[bIndex],
          });
          aIndex++;
          bIndex++;
        }
      }
    );

    if (aIndex !== aLength) diff.deleted.push(...aNodes.slice(aIndex));

    if (bIndex !== bNodes.length) diff.inserted.push(...bNodes.slice(bIndex));

    diff.deleted = diff.deleted.filter((aNode) => {
      const bIndex = diff.inserted.findIndex((bNode) =>
        this.isNodeEqual(aNode, bNode)
      );
      if (bIndex >= 0) {
        const bNode = diff.inserted[bIndex];
        diff.inserted.splice(bIndex, 1);
        diff.transformed.push({
          from: aNode,
          to: bNode,
        });

        return false;
      }

      return true;
    });
    return diff;
  }

  private cloneNodeExact(node: Node) {
    const props: ShapeProps = {
      position: node.position(),
      scale: node.scale(),
      rotation: node.rotation(),
    };
    if (node instanceof Layout) {
      props.size = node.size();
    }
    return node.clone(props);
  }

  public *tweenSVG(svg: string, time: number) {
    const newSVG = this.parseSVG(svg);
    const diff = this.diffSVG(this.parsed(), newSVG);
    const transformed = diff.transformed.map(({ from, to }) => ({
      from: this.cloneNodeExact(from),
      current: from,
      to,
    }));

    for (const node of diff.inserted) this.add(node);

    const autoWidth = this.customWidth() == null;
    const autoHeight = this.customHeight() == null;

    const beginning = 0.2;
    const ending = 0.8;
    const overlap = 0.15;

    yield* tween(
      time,
      (value) => {
        const remapped = clampRemap(beginning, ending, 0, 1, value);
        for (const node of transformed) {
          node.current.position(
            easeInOutSineVector2(
              remapped,
              node.from.position(),
              node.to.position()
            )
          );
          node.current.scale(
            easeInOutSineVector2(remapped, node.from.scale(), node.to.scale())
          );
          node.current.rotation(
            easeInOutSine(remapped, node.from.rotation(), node.to.rotation())
          );

          if (node.current instanceof Rect) {
            node.current.size(
              easeInOutSineVector2(
                remapped,
                (node.from as Layout).size(),
                (node.to as Layout).size()
              )
            );
          }
        }

        if (autoWidth)
          this.customWidth(
            easeInOutSine(value, diff.fromSize.x, diff.toSize.x)
          );

        if (autoHeight)
          this.customHeight(
            easeInOutSine(value, diff.fromSize.y, diff.toSize.y)
          );

        const deletedOpacity = clampRemap(0, beginning + overlap, 1, 0, value);
        for (const node of diff.deleted) node.opacity(deletedOpacity);

        const insertedOpacity = clampRemap(ending - overlap, 1, 0, 1, value);
        for (const node of diff.inserted) node.opacity(insertedOpacity);
      },
      () => {
        this.spawner(this.parsedNodes);
        this.svg(svg);
        if (autoWidth) this.customWidth(null);
        if (autoHeight) this.customHeight(null);
      }
    );
  }
}
