/**
 * Tint.ets — 给 SVG 图标上色的工具（HarmonyOS / ArkUI）
 *
 * 复制到你的工程：entry/src/main/ets/common/Tint.ets
 *
 * ============================ 为什么需要两套上色方案 ============================
 * ArkUI 的 Image 组件对 SVG 提供两个上色入口，但**适用场景不同**：
 *
 *  1) Image.fillColor(color)
 *     文档："设置填充颜色。仅对SVG图源生效，设置后会替换SVG图片中所有可绘制元素的填充颜色。"
 *     → 只改 fill，不改 stroke。
 *
 *  2) Image.colorFilter(4x5 颜色矩阵)
 *     文档："SVG类型的图源只有设置了 stroke 属性（无论是否有值）才会生效。"
 *     → 只要图稿带 stroke 属性就能生效（改的是整张渲染结果）。
 *
 * Iconsax 的 6 种样式恰好分成两派：
 *   填充型：bold / bulk / outline        → 用 fillColor
 *   描边型：linear / twotone / broken    → 用 colorFilter
 *
 * 所以这里准备了两个东西：
 *   - isStrokeArtwork()  判断某个样式该走哪条路
 *   - multiplyMatrix()   生成"把白图染成目标色"的乘法矩阵
 *
 * 乘法矩阵的原理：Iconsax 的图稿统一是白色 (#FFFFFF)，把它当成一张亮度蒙版，
 * 用对角矩阵乘以目标色即可——白色 (1,1,1) 会被映射成目标色 (r,g,b)，
 * 而 twotone 那种 opacity=0.4 的次级笔画会自动变成目标色的浅色版，正合预期。
 */
export class Tint {
  /** 用 fill 画的样式 */
  private static readonly FILL_STYLES: string[] = ['bold', 'bulk', 'outline'];

  /** 该样式是不是"描边图稿"（需要走 colorFilter 那条路） */
  static isStrokeArtwork(style: string): boolean {
    return !Tint.FILL_STYLES.includes(style);
  }

  /**
   * 生成"乘法着色"用的 4x5 颜色矩阵（行优先，共 20 个数）。
   * @param color '#RRGGBB' 或 '#RGB'
   */
  static multiplyMatrix(color: string): ColorFilter {
    const rgb: number[] = Tint.parseHex(color);
    const r: number = rgb[0];
    const g: number = rgb[1];
    const b: number = rgb[2];
    return [
      r, 0, 0, 0, 0,
      0, g, 0, 0, 0,
      0, 0, b, 0, 0,
      0, 0, 0, 1, 0
    ];
  }

  /**
   * 把矩阵降级成"整图替换颜色"的版本（保留原图亮度差异）。
   * 适合 multicolor 图稿：R' = R*r 之类。和 multiplyMatrix 相同，
   * 保留这个名字是为了让调用点读起来更直白。
   */
  static tintMatrix(color: string): ColorFilter {
    return Tint.multiplyMatrix(color);
  }

  /** '#RRGGBB' -> [r, g, b]，分量归一化到 0~1 */
  static parseHex(color: string): number[] {
    let hex: string = color.trim();
    if (hex.startsWith('#')) {
      hex = hex.substring(1);
    }
    if (hex.length === 3) {
      hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
    }
    if (hex.length === 8) {
      // #AARRGGBB（Iconsax 的 SVG 里出现过），丢掉 alpha
      hex = hex.substring(2);
    }
    if (hex.length !== 6) {
      return [0.0, 0.0, 0.0];
    }
    return [
      parseInt(hex.substring(0, 2), 16) / 255,
      parseInt(hex.substring(2, 4), 16) / 255,
      parseInt(hex.substring(4, 6), 16) / 255
    ];
  }

  /**
   * 把 '#RRGGBB' 转成 [r, g, b, a]（0~1），Lottie 的 changeColor 用的是 0~255，
   * 这里给的是 0~1 版本，按需取用。
   */
  static toUnitRgba(color: string): number[] {
    const rgb: number[] = Tint.parseHex(color);
    return [rgb[0], rgb[1], rgb[2], 1];
  }

  /** 把 '#RRGGBB' 转成 Lottie 的 changeColor 需要的 0~255 RGBA */
  static toLottieRgba(color: string): number[] {
    const rgb: number[] = Tint.parseHex(color);
    return [
      Math.round(rgb[0] * 255),
      Math.round(rgb[1] * 255),
      Math.round(rgb[2] * 255),
      1
    ];
  }
}
