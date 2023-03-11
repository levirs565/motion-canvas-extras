import { makeScene2D } from "@motion-canvas/2d/lib/scenes";
import { waitFor } from "@motion-canvas/core/lib/flow";
import { createRef } from "@motion-canvas/core/lib/utils";
import { AnimatedTex } from "../components/AnimatedTex";

export default makeScene2D(function* (view) {
  const tex = createRef<AnimatedTex>();
  view.add(
    <AnimatedTex
      ref={tex}
      tex="{\color{white} x = \sin \left( \frac{\pi}{2} \right)}"
      y={0} // height and width can calculate based on each other
    />
  );

  yield* waitFor(2);
  yield* tex().tweenTex(
    "{\\color{white} x = \\sin \\left( \\frac{\\pi}{2} \\right) + 3}",
    1
  );
  yield* tex().tweenTex(
    "{\\color{white} x = 1 + \\sin \\left( \\frac{\\pi}{2} \\right) + 3}",
    1
  );
  yield* tex().tweenTex(
    "{\\color{white} x = 3 + \\sin \\left( \\frac{\\pi}{2} \\right) + 1}",
    1
  );
  yield* tex().tweenTex(
    "{\\color{white} x = \\sin \\left( \\frac{\\pi}{2} \\right)}",
    1
  );
  yield* waitFor(2);
});
