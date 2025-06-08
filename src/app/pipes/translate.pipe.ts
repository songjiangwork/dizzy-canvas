import { Pipe, PipeTransform, ChangeDetectorRef, inject } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // 关键：让 pipe 在依赖变化时自动刷新
})
export class TranslatePipe implements PipeTransform {
  private translations: { [key: string]: { [key: string]: string } } = {
    zh: {
      'app.title': '晕晕画板',
      'toolbar.brushType': '笔刷类型',
      'toolbar.pen': '钢笔',
      'toolbar.pencil': '铅笔',
      'toolbar.brush': '毛笔',
      'toolbar.color': '颜色',
      'toolbar.size': '粗细',
      'toolbar.opacity': '透明度',
      'settings.background': '背景色',
      'settings.rotationSpeed': '旋转速度',
      'settings.rotationDirection': '旋转方向',
      'settings.clockwise': '顺时针',
      'settings.counterclockwise': '逆时针',
      'settings.rotation': '旋转控制',
      'settings.pauseRotation': '暂停旋转',
      'settings.startRotation': '开始旋转',
      'settings.rotationCenter': '旋转中心',
      'settings.resetCenter': '重置中心点',
      'settings.canvasSize': '画板大小',
      'settings.title': '画板设置',
      'toolbar.title': '工具栏',
      'history.undo': '撤销',
      'history.redo': '恢复',
      'history.clear': '清空画板',
      'settings.quickSelect': '快速选择',
      'export.title': '导出',
      'export.type': '导出类型',
      'export.drawingProcess': '绘制过程',
      'export.rotatingResult': '旋转结果',
      'export.frameDelay': '帧间隔',
      'export.duration': '持续时间',
      'export.exportGif': '导出 GIF',
      'export.exporting': '正在导出...'
    },
    en: {
      'app.title': 'Dizzy Canvas',
      'toolbar.brushType': 'Brush Type',
      'toolbar.pen': 'Pen',
      'toolbar.pencil': 'Pencil',
      'toolbar.brush': 'Brush',
      'toolbar.color': 'Color',
      'toolbar.size': 'Size',
      'toolbar.opacity': 'Opacity',
      'settings.background': 'Background',
      'settings.rotationSpeed': 'Rotation Speed',
      'settings.rotationDirection': 'Rotation Direction',
      'settings.clockwise': 'Clockwise',
      'settings.counterclockwise': 'Counterclockwise',
      'settings.rotation': 'Rotation Control',
      'settings.pauseRotation': 'Pause Rotation',
      'settings.startRotation': 'Start Rotation',
      'settings.rotationCenter': 'Rotation Center',
      'settings.resetCenter': 'Reset Center',
      'settings.canvasSize': 'Canvas Size',
      'settings.title': 'Settings',
      'toolbar.title': 'Toolbar',
      'history.undo': 'Undo',
      'history.redo': 'Redo',
      'history.clear': 'Clear Canvas',
      'settings.quickSelect': 'Quick Select',
      'export.title': 'Export',
      'export.type': 'Export Type',
      'export.drawingProcess': 'Drawing Process',
      'export.rotatingResult': 'Rotating Result',
      'export.frameDelay': 'Frame Delay',
      'export.duration': 'Duration',
      'export.exportGif': 'Export GIF',
      'export.exporting': 'Exporting...'
    }
  };

  private currentLang: string = 'zh';
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // 从本地存储获取语言设置
    const savedLang = localStorage.getItem('language');
    if (savedLang && (savedLang === 'zh' || savedLang === 'en')) {
      this.currentLang = savedLang;
    }

    // 监听语言变化
    window.addEventListener('storage', (event) => {
      if (event.key === 'language') {
        this.currentLang = event.newValue || 'zh';
        this.cdr.markForCheck(); // 通知 Angular 检查变更
      }
    });
  }

  transform(key: string): string {
    return this.translations[this.currentLang][key] || key;
  }
}
