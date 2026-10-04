import { Tint } from '../common/Tint';

/**
 * IconsaxIcon — 一个 Iconsax 图标的渲染单元（HarmonyOS / ArkUI）
 *
 * 复制到你的工程：entry/src/main/ets/components/IconsaxIcon.ets
 * 依赖：../common/Tint.ets
 *
 * 支持两条上色路线 + 两条动效路线：
 *   上色：填充图稿 → fillColor；描边图稿 → colorFilter 乘法矩阵
 *   动效：① SVG 内嵌 SMIL —— 由文件本身自带，Image 自动播放，用完触发 onFinish
 *         ② ArkTS 属性动画 —— 外部用 animateTo 驱动下面这些 ic* 属性
 *
 * ⚠️ 重要：属性名**不能**叫 scale / size / rotate / translate / opacity / visibility，
 *    会和 CustomComponent 自带的通用属性方法冲突，编译期直接报
 *    "Property 'x' is not assignable to the same property in base type 'CustomComponent'"。
 *    所以统一加 ic 前缀。
 */
@Component
export struct IconsaxIcon {
  /** rawfile 相对路径，例如 'iconsax/bold/home.svg' */
  @Prop rawfile: string = '';
  /** 显示边长，单位 vp */
  @Prop icSize: number | string = 24;
  /** 目标颜色，'#RRGGBB' */
  @Prop icTint: string = '#182431';
  /** true = 描边图稿（linear/twotone/broken），false = 填充图稿（bold/bulk/outline） */
  @Prop strokeArtwork: boolean = false;
  /** true = 该 SVG 的动效只播一次，播完会触发 onFinish */
  @Prop oneShot: boolean = false;

  /** 以下由 animateTo / keyframeAnimateTo 驱动 */
  @Prop icScale: number = 1;
  @Prop icExtraScale: number = 1;
  @Prop icOffsetY: number = 0;
  @Prop icAngle: number = 0;

  /** 单次动效播完的回调（可做"播完就停在终点"或切图） */
  onPlayed?: () => void;

  private onFinishHandler(): void {
    if (this.oneShot) {
      if (this.onPlayed !== undefined) {
        this.onPlayed();
      } else {
        console.info('[Iconsax] SVG 单次动效播放完成');
      }
    }
  }

  build() {
    if (this.strokeArtwork) {
      // 描边图稿：颜色矩阵是唯一可靠的上色方式
      Image($rawfile(this.rawfile))
        .width(this.icSize)
        .height(this.icSize)
        .objectFit(ImageFit.Contain)
        .colorFilter(Tint.multiplyMatrix(this.icTint))
        .scale({ x: this.icScale * this.icExtraScale, y: this.icScale * this.icExtraScale })
        .translate({ y: this.icOffsetY })
        .rotate({ angle: this.icAngle })
        .onFinish(() => {
          this.onFinishHandler();
        })
    } else {
      // 填充图稿：fillColor 直接替换所有可绘制元素的填充色
      Image($rawfile(this.rawfile))
        .width(this.icSize)
        .height(this.icSize)
        .objectFit(ImageFit.Contain)
        .fillColor(this.icTint)
        .scale({ x: this.icScale * this.icExtraScale, y: this.icScale * this.icExtraScale })
        .translate({ y: this.icOffsetY })
        .rotate({ angle: this.icAngle })
        .onFinish(() => {
          this.onFinishHandler();
        })
    }
  }
}
