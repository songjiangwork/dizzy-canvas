import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Brush, DrawingStroke, DrawingHistory } from '../models/brush.model';
import { HistoryService } from './history.service';

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private defaultBrush: Brush = {
    type: 'pen',
    color: '#000000',
    size: 5,
    opacity: 1
  };
  
  private currentBrushSubject = new BehaviorSubject<Brush>(this.defaultBrush);
  private historySubject = new BehaviorSubject<DrawingHistory>({
    strokes: [],
    currentIndex: -1
  });
  
  private isDrawingSubject = new BehaviorSubject<boolean>(false);
  private currentStroke: DrawingStroke | null = null;
  
  constructor(private historyService: HistoryService) {}
  
  get currentBrush$(): Observable<Brush> {
    return this.currentBrushSubject.asObservable();
  }
  
  get history$(): Observable<DrawingHistory> {
    return this.historySubject.asObservable();
  }
  
  get isDrawing$(): Observable<boolean> {
    return this.isDrawingSubject.asObservable();
  }
  
  get currentBrush(): Brush {
    return this.currentBrushSubject.value;
  }
  
  // Public getter for currentStroke
  public getCurrentStroke(): DrawingStroke | null {
    return this.currentStroke;
  }
  
  updateBrush(brush: Partial<Brush>): void {
    this.currentBrushSubject.next({
      ...this.currentBrushSubject.value,
      ...brush
    });
  }
  
  startStroke(x: number, y: number, pressure: number = 1): void {
    this.isDrawingSubject.next(true);
    
    this.currentStroke = {
      points: [{
        x,
        y,
        pressure,
        time: Date.now()
      }],
      brush: { ...this.currentBrushSubject.value }
    };
  }
  
  continueStroke(x: number, y: number, pressure: number = 1): void {
    if (!this.currentStroke || !this.isDrawingSubject.value) {
      return;
    }
    
    this.currentStroke.points.push({
      x,
      y,
      pressure,
      time: Date.now()
    });
  }
  
  endStroke(): void {
    if (!this.currentStroke || !this.isDrawingSubject.value) {
      return;
    }
    
    const history = this.historySubject.value;
    
    // 如果当前不是在历史记录的最后，需要删除后面的记录
    if (history.currentIndex < history.strokes.length - 1) {
      history.strokes = history.strokes.slice(0, history.currentIndex + 1);
    }
    
    // 添加新的笔画
    history.strokes.push(this.currentStroke);
    history.currentIndex = history.strokes.length - 1;
    
    this.historySubject.next({...history});
    // 同步到全局HistoryService
    this.historyService.addStroke(this.currentStroke);
    this.isDrawingSubject.next(false);
    this.currentStroke = null;
  }
  
  undo(): void {
    const history = this.historySubject.value;
    
    if (history.currentIndex >= 0) {
      history.currentIndex--;
      this.historySubject.next({...history});
    }
  }
  
  redo(): void {
    const history = this.historySubject.value;
    
    if (history.currentIndex < history.strokes.length - 1) {
      history.currentIndex++;
      this.historySubject.next({...history});
    }
  }
  
  clearCanvas(): void {
    this.historySubject.next({
      strokes: [],
      currentIndex: -1
    });
  }
  
  // 将坐标从屏幕坐标系转换为画布坐标系
  transformCoordinates(x: number, y: number, canvasElement: HTMLCanvasElement, rotationAngle: number, center: {x: number, y: number}): {x: number, y: number} {
    // 获取画布在屏幕中的位置
    const rect = canvasElement.getBoundingClientRect();
    
    // 计算相对于画布左上角的坐标
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    // 计算相对于画布中心的坐标
    const centerX = canvasElement.width / 2;
    const centerY = canvasElement.height / 2;
    
    // 计算相对于旋转中心的坐标
    const relativeX = canvasX - centerX;
    const relativeY = canvasY - centerY;
    
    // 应用反向旋转变换
    const angleInRadians = (rotationAngle * Math.PI) / 180;
    const cos = Math.cos(angleInRadians);
    const sin = Math.sin(angleInRadians);
    
    const rotatedX = relativeX * cos + relativeY * sin;
    const rotatedY = -relativeX * sin + relativeY * cos;
    
    // 转换回画布坐标系
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY
    };
  }
}
