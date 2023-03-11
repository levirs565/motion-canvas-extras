import { makeScene2D } from "@motion-canvas/2d/lib/scenes";
import { waitFor } from "@motion-canvas/core/lib/flow";
import { createRef } from "@motion-canvas/core/lib/utils";
import { Path } from "../components/Path";

export default makeScene2D(function* (view) {
  const path = createRef<Path>();
  view.add(
    <Path
      data="M132 -11Q98 -11 98 22V33L111 61Q186 219 220 334L228 358H196Q158 358 142 355T103 336Q92 329 81 318T62 297T53 285Q51 284 38 284Q19 284 19 294Q19 300 38 329T93 391T164 429Q171 431 389 431Q549 431 553 430Q573 423 573 402Q573 371 541 360Q535 358 472 358H408L405 341Q393 269 393 222Q393 170 402 129T421 65T431 37Q431 20 417 5T381 -10Q370 -10 363 -7T347 17T331 77Q330 86 330 121Q330 170 339 226T357 318T367 358H269L268 354Q268 351 249 275T206 114T175 17Q164 -11 132 -11Z"
      fill="black"
      scaleY={-1}
      y={0} // height and width can calculate based on each other
      ref={path}
    />
  );

  yield* waitFor(2);
  yield* path().opacity(0, 1);
  yield* path().opacity(1, 1);
  yield* waitFor(2);
});
