import { NodeProps } from "@motion-canvas/2d/lib/components";
import { easeInOutSine } from "@motion-canvas/core/lib/tweening";
import { BBox, Vector2 } from "@motion-canvas/core/lib/types";

export function firstNotNull<T>(...items: Array<T | null>): T | null {
  return items.find((item) => item);
}

export function easeInOutSineVector2(
  value: number,
  from: Vector2,
  to: Vector2
) {
  return Vector2.lerp(from, to, easeInOutSine(value, 0, 1));
}
