import { mathjax } from "mathjax-full/js/mathjax";
import { TeX } from "mathjax-full/js/input/tex";
import { SVG } from "mathjax-full/js/output/svg";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";
import { OptionList } from "mathjax-full/js/util/Options";
import { computed, initial, signal } from "@motion-canvas/2d/lib/decorators";
import { SVGProps, SVG as SVGComponent } from "./SVG";
import { useLogger } from "@motion-canvas/core/lib/utils";

const Adaptor = liteAdaptor();
RegisterHTMLHandler(Adaptor);

const JaxDocument = mathjax.document("", {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  InputJax: new TeX({ packages: AllPackages }),
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OutputJax: new SVG({ fontCache: "local" }),
});

export interface AnimatedTexProps extends SVGProps {
  tex?: SignalValue<string>;
  renderProps?: SignalValue<OptionList>;
}

export class AnimatedTex extends SVGComponent {
  private static svgContentsPool: Record<string, string> = {};

  @initial({})
  @signal()
  public declare readonly options: SimpleSignal<OptionList, this>;

  @signal()
  public declare readonly tex: SimpleSignal<string, this>;

  public constructor(props: AnimatedTexProps) {
    super(props);
    this.svg(this.latexSVG);
    this.wrapper.scale(this.scaleFactor);
  }

  @computed()
  scaleFactor() {
    return this.fontSize() / 2;
  }

  @computed()
  latexSVG() {
    return this.latexToSVG(this.tex());
  }

  private latexToSVG(tex: string): string {
    const src = `${tex}::${JSON.stringify(this.options())}`;
    if (AnimatedTex.svgContentsPool[src])
      return AnimatedTex.svgContentsPool[src];

    const svg = Adaptor.innerHTML(JaxDocument.convert(tex, this.options));
    AnimatedTex.svgContentsPool[src] = svg;
    return svg;
  }

  public *tweenTex(tex: string, time: number) {
    const newSVG = this.latexToSVG(tex);
    yield* this.tweenSVG(newSVG, time);
  }
}
