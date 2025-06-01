import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from './components/canvas/canvas.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { HistoryControlsComponent } from './components/history-controls/history-controls.component';
import { TranslatePipe } from './pipes/translate.pipe';
import { ExportPanelComponent } from './components/export-panel/export-panel.component';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CanvasComponent,
    ToolbarComponent,
    SettingsPanelComponent,
    HistoryControlsComponent,
    TranslatePipe,
    ExportPanelComponent,
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent implements OnInit {
  currentLanguage: string = 'zh'; // 默认中文
  
  constructor() {}
  
  ngOnInit(): void {
    // 初始化时加载语言设置
    this.loadLanguage();
  }
  
  switchLanguage(lang: string): void {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    // 触发语言变更事件，让其他组件知道语言已更改
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'language',
      newValue: lang
    }));
  }
  
  private loadLanguage(): void {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
  }
}
