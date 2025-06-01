import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from './components/canvas/canvas.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { SettingsPanelComponent } from './components/settings-panel/settings-panel.component';
import { HistoryControlsComponent } from './components/history-controls/history-controls.component';
import { TranslatePipe } from './pipes/translate.pipe';

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
    TranslatePipe
  ],
  template: `
    <div class="app-container">
      <div class="app-header">
        <h1 class="app-title">{{ 'app.title' | translate }}</h1>
        <div class="language-selector">
          <button (click)="switchLanguage('zh')" [class.active]="currentLanguage === 'zh'">中文</button>
          <button (click)="switchLanguage('en')" [class.active]="currentLanguage === 'en'">English</button>
        </div>
      </div>
      
      <app-canvas></app-canvas>
      <app-toolbar></app-toolbar>
      <app-settings-panel></app-settings-panel>
      <app-history-controls></app-history-controls>
    </div>
  `,
  styles: [`
    .app-container {
      width: 100%;
      height: 100vh;
      position: relative;
      background-color: #f5f5f5;
    }
    
    .app-header {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    
    .app-title {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #333;
    }
    
    .language-selector {
      margin-top: 10px;
      display: flex;
      gap: 5px;
    }
    
    .language-selector button {
      padding: 5px 10px;
      border: none;
      background-color: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    
    .language-selector button.active {
      background-color: #007bff;
      color: white;
    }
    
    @media (max-width: 768px) {
      .app-header {
        top: 10px;
        left: 10px;
      }
      
      .app-title {
        font-size: 20px;
      }
    }
  `]
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
