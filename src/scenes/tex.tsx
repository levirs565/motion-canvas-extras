import { Layout, Txt, Node } from "@motion-canvas/2d/lib/components";
import { makeScene2D } from "@motion-canvas/2d/lib/scenes";
import { waitFor } from "@motion-canvas/core/lib/flow";
import { createSignal } from "@motion-canvas/core/lib/signals";
import { createRef } from "@motion-canvas/core/lib/utils";
import { AnimatedTex } from "../components/AnimatedTex";

export default makeScene2D(function* (view) {
  const fontSize = createSignal<number>(48);
  const tex = createRef<AnimatedTex>();
  view.add(
    <Layout layout direction={"column"} gap={50}>
      <Txt text="This is normal text" fontSize={fontSize} />
      <Txt text="x" fontSize={fontSize} />
      <AnimatedTex
        ref={tex}
        tex="{\color{white} x = \sin \left( \frac{\pi}{2} \right)}"
        fontSize={fontSize}
      />
    </Layout>
  );
  yield* waitFor(2);
  yield* tex().opacity(0, 1);
  yield* tex().opacity(1, 1);
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
    "{\\color{white} x = 3 + \\sin \\left( \\dfrac{\\pi}{2} \\right) + 1}",
    1
  );
  yield* tex().tweenTex(
    "{\\color{white} x = 3 + \\sin \\left( \\dfrac{\\pi + 3}{2} \\right) + 1}",
    1
  );
  yield* tex().tweenTex(
    "{\\color{white} x = \\sin \\left( \\frac{\\pi}{2} \\right)}",
    1
  );
  yield* waitFor(2);
  yield* fontSize(96, 1);
  yield* fontSize(48, 1);
  yield* waitFor(2);
});
