import { IconsaxIcon } from '../components/IconsaxIcon';
import { IconsaxCatalog } from '../model/IconsaxCatalog';
import { Tint } from '../common/Tint';

/**
 * Skill 模板编译验证页：
 * 把 harmonyos-ui-icons 的三个模板（Tint / IconsaxIcon / IconsaxCatalog）
 * 当真实依赖用一遍，确保它们能过 ArkTS 编译。
 */
@Entry
@Component
struct Index {
  @State styleA: string = 'bold';      // 填充型 -> fillColor
  @State styleB: string = 'linear';    // 描边型 -> colorFilter
  @State tint: string = '#0A59F7';
  @State angle: number = 0;
  @State offsetY: number = 0;
  @State pulseScale: number = 1;
  @State played: string = '-';

  private fillNames: string[] = ['home', 'user', 'setting', 'heart'];
  private strokeNames: string[] = ['search-normal', 'star', 'bookmark', 'calendar'];

  aboutToAppear(): void {
    // 顺便验证 Tint 的工具方法都能被调用
    const m: ColorFilter = Tint.multiplyMatrix(this.tint);
    console.info(`[skilltest] matrix=${JSON.stringify(m)}`);
    console.info(`[skilltest] lottie rgba=${JSON.stringify(Tint.toLottieRgba(this.tint))}`);
    console.info(`[skilltest] isStroke(bold)=${Tint.isStrokeArtwork('bold')} isStroke(linear)=${Tint.isStrokeArtwork('linear')}`);
    console.info(`[skilltest] catalog icons=${IconsaxCatalog.ICONS.length} styles=${IconsaxCatalog.STYLES.length}`);
  }

  private play(): void {
    this.angle = 0;
    this.offsetY = 0;
    this.getUIContext().animateTo({ duration: 900, curve: Curve.FastOutSlowIn }, () => {
      this.angle = 360;
    });
    this.getUIContext().keyframeAnimateTo({ delay: 0, iterations: 1 }, [
      { duration: 240, curve: Curve.EaseOut, event: () => { this.offsetY = -8; } },
      { duration: 240, curve: Curve.EaseIn, event: () => { this.offsetY = 0; } },
      { duration: 200, curve: Curve.Friction, event: () => { this.pulseScale = 1.2; } },
      { duration: 200, curve: Curve.Friction, event: () => { this.pulseScale = 1; } }
    ]);
  }

  @Builder
  IconRow(names: string[], style: string) {
    Row({ space: 18 }) {
      ForEach(names, (n: string) => {
        IconsaxIcon({
          rawfile: IconsaxCatalog.rawfilePath(n, style),
          icSize: 28,
          icTint: this.tint,
          strokeArtwork: IconsaxCatalog.isStrokeStyle(style),
          oneShot: false,
          icAngle: this.angle,
          icOffsetY: this.offsetY,
          icExtraScale: this.pulseScale
        })
      }, (n: string) => n)
    }
    .width('100%')
    .justifyContent(FlexAlign.Center)
  }

  build() {
    Column({ space: 14 }) {
      Text('skill 模板编译验证').fontSize(18).fontWeight(FontWeight.Bold)

      Text('填充型 fillColor（' + this.styleA + '）').fontSize(12).fontColor('#99182431')
      this.IconRow(this.fillNames, this.styleA)

      Text('描边型 colorFilter（' + this.styleB + '）').fontSize(12).fontColor('#99182431')
      this.IconRow(this.strokeNames, this.styleB)

      Text('SMIL 动效图标 float').fontSize(12).fontColor('#99182431')
      Row({ space: 18 }) {
        IconsaxIcon({
          rawfile: 'iconsax-anim/float/' + this.styleB + '/heart.svg',
          icSize: 28,
          icTint: this.tint,
          strokeArtwork: true
        })
        IconsaxIcon({
          rawfile: 'iconsax-anim/pulse/' + this.styleA + '/star.svg',
          icSize: 28,
          icTint: '#E84026',
          strokeArtwork: false
        })
      }

      Text('单次动效 + onPlayed 回调：' + this.played).fontSize(12).fontColor('#99182431')
      IconsaxIcon({
        rawfile: 'iconsax-anim/spin/' + this.styleB + '/setting.svg',
        icSize: 32,
        icTint: this.tint,
        strokeArtwork: true,
        oneShot: true,
        onPlayed: () => {
          this.played = 'spin 播完了';
        }
      })

      Button('ArkTS 属性动画')
        .fontSize(13)
        .onClick(() => {
          this.play();
        })

      Text('icSize 传 string 也应可用').fontSize(12).fontColor('#99182431')
      IconsaxIcon({
        rawfile: IconsaxCatalog.rawfilePath('home', 'bulk'),
        icSize: '36vp',
        icTint: '#00A870',
        strokeArtwork: IconsaxCatalog.isStrokeStyle('bulk')
      })
    }
    .width('100%')
    .height('100%')
    .justifyContent(FlexAlign.Center)
    .backgroundColor(Color.White)
  }
}
