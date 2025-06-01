import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GIF } from 'gif.js';
import { DrawingHistory, DrawingStroke } from '../models/brush.model';
import { CanvasSettings } from '../models/canvas-settings.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private isExportingSubject = new BehaviorSubject<boolean>(false);
  private progressSubject = new BehaviorSubject<number>(0);
  
  constructor() {}
  
  get isExporting$(): Observable<boolean> {
    return this.isExportingSubject.asObservable();
  }
  
  get progress$(): Observable<number> {
    return this.progressSubject.asObservable();
  }
  
  // 导出绘画过程为GIF
  exportDrawingProcess(
    canvas: HTMLCanvasElement,
    history: DrawingHistory,
    settings: CanvasSettings,
    frameDelay: number = 100 // 每帧延迟，单位毫秒
  ): Promise<Blob> {
    this.isExportingSubject.next(true);
    this.progressSubject.next(0);
    
    return new Promise((resolve, reject) => {
      try {
        // 创建临时画布用于生成GIF帧
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // 创建GIF编码器
        const gif = new GIF({
          workers: 2,
          quality: 10,
          width: canvas.width,
          height: canvas.height,
          workerScript: 'assets/gif.worker.js'
        });
        
        // 添加完成事件处理
        gif.on('finished', (blob: Blob) => {
          this.isExportingSubject.next(false);
          this.progressSubject.next(100);
          resolve(blob);
        });
        
        gif.on('progress', (progress: number) => {
          this.progressSubject.next(Math.round(progress * 100));
        });
        
        // 计算总帧数
        const totalStrokes = history.strokes.length;
        let currentFrame = 0;
        
        // 逐步绘制每个笔画，每个笔画生成一帧
        for (let i = 0; i <= history.currentIndex; i++) {
          // 清除临时画布
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // 绘制背景
          tempCtx.fillStyle = settings.backgroundColor;
          tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
          
          // 绘制当前帧之前的所有笔画
          for (let j = 0; j <= i; j++) {
            this.drawStrokeOnCanvas(tempCtx, history.strokes[j]);
          }
          
          // 添加帧到GIF
          gif.addFrame(tempCanvas, { delay: frameDelay, copy: true });
          
          // 更新进度
          currentFrame++;
          this.progressSubject.next(Math.round((currentFrame / totalStrokes) * 50));
        }
        
        // 开始生成GIF
        gif.render();
        
      } catch (error) {
        this.isExportingSubject.next(false);
        reject(error);
      }
    });
  }
  
  // 导出带旋转效果的最终结果为GIF
  exportRotatingResult(
    canvas: HTMLCanvasElement,
    history: DrawingHistory,
    settings: CanvasSettings,
    duration: number = 2000, // 旋转一周的时间，单位毫秒
    frameRate: number = 30 // 每秒帧数
  ): Promise<Blob> {
    this.isExportingSubject.next(true);
    this.progressSubject.next(0);
    
    return new Promise((resolve, reject) => {
      try {
        // 创建临时画布用于生成GIF帧
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d')!;
        
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // 创建GIF编码器
        const gif = new GIF({
          workers: 2,
          quality: 10,
          width: canvas.width,
          height: canvas.height,
          workerScript: 'assets/gif.worker.js'
        });
        
        // 添加完成事件处理
        gif.on('finished', (blob: Blob) => {
          this.isExportingSubject.next(false);
          this.progressSubject.next(100);
          resolve(blob);
        });
        
        gif.on('progress', (progress: number) => {
          this.progressSubject.next(Math.round(progress * 100));
        });
        
        // 计算总帧数和每帧角度增量
        const totalFrames = Math.round(duration / 1000 * frameRate);
        const angleIncrement = 360 / totalFrames;
        
        // 首先在临时画布上绘制完整的画作
        tempCtx.fillStyle = settings.backgroundColor;
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        for (let i = 0; i <= history.currentIndex; i++) {
          this.drawStrokeOnCanvas(tempCtx, history.strokes[i]);
        }
        
        // 创建旋转帧
        for (let i = 0; i < totalFrames; i++) {
          // 创建新的临时画布用于旋转
          const rotateCanvas = document.createElement('canvas');
          const rotateCtx = rotateCanvas.getContext('2d')!;
          
          rotateCanvas.width = canvas.width;
          rotateCanvas.height = canvas.height;
          
          // 设置旋转
          rotateCtx.translate(rotateCanvas.width / 2, rotateCanvas.height / 2);
          rotateCtx.rotate((i * angleIncrement) * Math.PI / 180);
          rotateCtx.translate(-rotateCanvas.width / 2, -rotateCanvas.height / 2);
          
          // 绘制图像
          rotateCtx.drawImage(tempCanvas, 0, 0);
          
          // 添加帧到GIF
          gif.addFrame(rotateCanvas, { delay: 1000 / frameRate, copy: true });
          
          // 更新进度
          this.progressSubject.next(Math.round((i / totalFrames) * 50));
        }
        
        // 开始生成GIF
        gif.render();
        
      } catch (error) {
        this.isExportingSubject.next(false);
        reject(error);
      }
    });
  }
  
  // 在画布上绘制笔画
  private drawStrokeOnCanvas(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
    const points = stroke.points;
    if (points.length < 2) return;
    
    const brush = stroke.brush;
    
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 设置笔刷样式
    switch (brush.type) {
      case 'pen':
        ctx.lineWidth = brush.size;
        ctx.globalAlpha = brush.opacity;
        break;
      case 'pencil':
        ctx.lineWidth = brush.size * 0.8;
        ctx.globalAlpha = brush.opacity * 0.9;
        break;
      case 'brush':
        ctx.lineWidth = brush.size * 1.5;
        ctx.globalAlpha = brush.opacity * 0.7;
        break;
    }
    
    ctx.strokeStyle = brush.color;
    
    // 绘制路径
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      // 对于毛笔效果，可以根据压力调整线宽
      if (brush.type === 'brush') {
        const pressure = points[i].pressure ?? 1;
        ctx.lineWidth = brush.size * pressure * 1.5;
      }
      
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.stroke();
    
    // 重置透明度
    ctx.globalAlpha = 1;
  }
}
