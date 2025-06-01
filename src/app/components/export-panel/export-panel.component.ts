import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../services/export.service';
import { HistoryService } from '../../services/history.service';
import { RotationService } from '../../services/rotation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-export-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './export-panel.component.html',
  styleUrls: ['./export-panel.component.scss']
})
export class ExportPanelComponent implements OnInit {
  showPanel: boolean = false;
  exportType: 'process' | 'rotating' = 'rotating';
  frameDelay: number = 100; // 毫秒
  duration: number = 2000; // 毫秒
  isExporting: boolean = false;
  progress: number = 0;
  
  constructor(
    private exportService: ExportService,
    private historyService: HistoryService,
    private rotationService: RotationService
  ) {}
  
  ngOnInit(): void {
    this.exportService.isExporting$.subscribe(isExporting => {
      this.isExporting = isExporting;
    });
    
    this.exportService.progress$.subscribe(progress => {
      this.progress = progress;
    });
  }
  
  togglePanel(): void {
    this.showPanel = !this.showPanel;
  }
  
  closePanel(): void {
    this.showPanel = false;
  }
  
  setExportType(type: 'process' | 'rotating'): void {
    this.exportType = type;
  }
  
  exportGif(): void {
    if (this.isExporting) return;
    
    // 获取画布元素
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('无法获取画布元素');
      return;
    }
    
    const history = this.historyService.currentHistory;
    const settings = this.rotationService.currentSettings;
    
    if (this.exportType === 'process') {
      this.exportService.exportDrawingProcess(canvas, history, settings, this.frameDelay)
        .then(blob => {
          this.downloadGif(blob, 'drawing-process.gif');
        })
        .catch(error => {
          console.error('导出失败', error);
          alert('导出失败: ' + error.message);
        });
    } else {
      this.exportService.exportRotatingResult(canvas, history, settings, this.duration)
        .then(blob => {
          this.downloadGif(blob, 'rotating-result.gif');
        })
        .catch(error => {
          console.error('导出失败', error);
          alert('导出失败: ' + error.message);
        });
    }
  }
  
  private downloadGif(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
