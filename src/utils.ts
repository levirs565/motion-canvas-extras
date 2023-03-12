import { NodeProps } from "@motion-canvas/2d/lib/components";
import { easeInOutSine } from "@motion-canvas/core/lib/tweening";
import {
  BBox,
  SerializedVector2,
  Vector2,
} from "@motion-canvas/core/lib/types";
import bound from "svg-path-bounds";

export function getPathBBox(data: string) {
  const [left, top, right, bottom] = bound(data);
  const bbox = new BBox();
  bbox.left = left;
  bbox.top = top;
  bbox.right = right;
  bbox.bottom = bottom;
  return bbox;
}

export function firstNotNull<T>(...items: Array<T | null>): T | null {
  return items.find((item) => item);
}

export function decomposeMatrixTransformation(matrix: DOMMatrix): NodeProps {
  const position = {
    x: matrix.m41,
    y: matrix.m42,
  };
  const rotation = (Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI;
  const scale = {
    x: Vector2.magnitude(matrix.m11, matrix.m12),
    y: Vector2.magnitude(matrix.m21, matrix.m22),
  };
  var determinant = matrix.m11 * matrix.m22 - matrix.m12 * matrix.m21;
  if (determinant < 0) {
    if (matrix.m11 < matrix.m22) scale.x = -scale.x;
    else scale.y = -scale.y;
  }
  return {
    position,
    rotation,
    scale,
  };
}

export function easeInOutSineVector2(value: number, from: Vector2, to: Vector2) {
  return Vector2.lerp(from, to, easeInOutSine(value, 0, 1));
}
