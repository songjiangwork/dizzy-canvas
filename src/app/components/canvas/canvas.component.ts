import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RotationService } from '../../services/rotation.service';
import { DrawingService } from '../../services/drawing.service';
import { HistoryService } from '../../services/history.service';
import { CanvasSettings, Point } from '../../models/canvas-settings.model';
import { Brush, DrawingStroke } from '../../models/brush.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('drawingCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private subscriptions: Subscription[] = [];
  private isDrawing: boolean = false;
  private lastPoint: Point | null = null;

  settings?: CanvasSettings;
  currentAngle: number = 0;
  canvasSize: number = 0;

  constructor(
    private rotationService: RotationService,
    private drawingService: DrawingService,
    private historyService: HistoryService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.rotationService.currentAngle$.subscribe(angle => {
        // 修正：角度增量取反，保证补点方向正确
        if (this.isDrawing && this.lastPoint && this.settings) {
          const centerX = this.settings.rotationCenter.x;
          const centerY = this.settings.rotationCenter.y;
          const r = Math.sqrt(Math.pow(this.lastPoint.x - centerX, 2) + Math.pow(this.lastPoint.y - centerY, 2));
          const theta0 = Math.atan2(this.lastPoint.y - centerY, this.lastPoint.x - centerX);
          // 修正：angle - this.currentAngle => -(angle - this.currentAngle)
          const theta = theta0 - (angle - this.currentAngle) * Math.PI / 180;
          const x = centerX + r * Math.cos(theta);
          const y = centerY + r * Math.sin(theta);
          this.drawingService.continueStroke(x, y);
          this.lastPoint = { x, y };
        }
        this.currentAngle = angle;
        this.redrawCanvas();
      })
    );
    this.subscriptions.push(
      this.rotationService.settings$.subscribe(settings => {
        this.settings = settings;
        this.canvasSize = settings.radius * 2;
        if (this.canvasRef && this.ctx) {
          this.updateCanvasSize();
        }
      })
    );
    this.subscriptions.push(
      this.historyService.history$.subscribe(() => {
        this.redrawCanvas();
      })
    );
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.updateCanvasSize();
    if (this.settings) {
      this.updateCanvasSize();
    }
    // 移除window级别的事件监听
    // window.addEventListener('mousemove', this.onMouseMove.bind(this));
    // window.addEventListener('mouseup', this.onMouseUp.bind(this));
    // window.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    // window.addEventListener('touchend', this.onTouchEnd.bind(this));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    // window.removeEventListener('mouseup', this.onMouseUp.bind(this));
    // window.removeEventListener('touchmove', this.onTouchMove.bind(this));
    // window.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private updateCanvasSize(): void {
    if (!this.settings) return;
    const canvas = this.canvasRef.nativeElement;
    const size = this.settings.radius * 2;
    canvas.width = size;
    canvas.height = size;
    // 强制rotationCenter为画布正中心
    this.settings.rotationCenter.x = size / 2;
    this.settings.rotationCenter.y = size / 2;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.redrawCanvas();
  }

  private redrawCanvas(): void {
    if (!this.ctx || !this.settings) return;
    const canvas = this.canvasRef.nativeElement;
    const centerX = this.settings.rotationCenter.x;
    const centerY = this.settings.rotationCenter.y;
    const radius = this.settings.radius;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((this.currentAngle * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.clip();
    this.ctx.fillStyle = this.settings.backgroundColor;
    this.ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    this.drawPolarGrid(centerX, centerY, radius);
    const history = this.historyService.currentHistory;
    for (let i = 0; i <= history.currentIndex; i++) {
      this.drawStroke(history.strokes[i]);
    }
    // 画当前未提交的stroke（与redrawCanvasWithCurrentStroke一致）
    const currentStroke = this.drawingService.getCurrentStroke();
    if (currentStroke && currentStroke.points.length > 0) {
      this.drawStroke(currentStroke);
    }
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = 'red';
    this.ctx.fill();
    this.ctx.restore();
    this.ctx.restore();
    this.ctx.restore();
  }

  private drawPolarGrid(centerX: number, centerY: number, radius: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let angle = 0; angle < 360; angle += 30) {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + radius * Math.cos(rad), centerY + radius * Math.sin(rad));
      ctx.stroke();
    }
    for (let r = radius / 4; r <= radius; r += radius / 4) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  private drawStroke(stroke: DrawingStroke): void {
    if (!this.ctx) return;
    const points = stroke.points;
    if (points.length === 1) {
      // 只有一个点时画一个圆点
      const brush = stroke.brush;
      this.ctx.beginPath();
      this.ctx.arc(points[0].x, points[0].y, brush.size / 2, 0, Math.PI * 2);
      this.ctx.fillStyle = brush.color;
      this.ctx.globalAlpha = brush.opacity;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
      return;
    }
    if (points.length < 2) return;
    const brush = stroke.brush;
    this.ctx.beginPath();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    switch (brush.type) {
      case 'pen':
        this.ctx.lineWidth = brush.size;
        this.ctx.globalAlpha = brush.opacity;
        break;
      case 'pencil':
        this.ctx.lineWidth = brush.size * 0.8;
        this.ctx.globalAlpha = brush.opacity * 0.9;
        break;
      case 'brush':
        this.ctx.lineWidth = brush.size * 1.5;
        this.ctx.globalAlpha = brush.opacity * 0.7;
        break;
    }
    this.ctx.strokeStyle = brush.color;
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (brush.type === 'brush' && typeof points[i]?.pressure === 'number') {
        this.ctx.lineWidth = brush.size * (points[i].pressure as number) * 1.5;
      }
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }

  onMouseDown(event: MouseEvent): void {
    if (!this.settings) return;
    event.preventDefault();
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const transformedPoint = this.transformCoordinates(x, y);
    this.isDrawing = true;
    this.lastPoint = transformedPoint;
    this.drawingService.startStroke(transformedPoint.x, transformedPoint.y);
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDrawing || !this.lastPoint || !this.settings) return;
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const transformedPoint = this.transformCoordinates(x, y);
    this.drawingService.continueStroke(transformedPoint.x, transformedPoint.y);
    this.lastPoint = transformedPoint;
    this.redrawCanvasWithCurrentStroke();
  }

  private redrawCanvasWithCurrentStroke(): void {
    if (!this.ctx || !this.settings) return;
    const canvas = this.canvasRef.nativeElement;
    const centerX = this.settings.rotationCenter.x;
    const centerY = this.settings.rotationCenter.y;
    const radius = this.settings.radius;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate((this.currentAngle * Math.PI) / 180);
    this.ctx.translate(-centerX, -centerY);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.clip();
    this.ctx.fillStyle = this.settings.backgroundColor;
    this.ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    this.drawPolarGrid(centerX, centerY, radius);
    const history = this.historyService.currentHistory;
    for (let i = 0; i <= history.currentIndex; i++) {
      this.drawStroke(history.strokes[i]);
    }
    // 画当前未提交的stroke
    const currentStroke = this.drawingService.getCurrentStroke();
    if (currentStroke && currentStroke.points.length > 0) {
      this.drawStroke(currentStroke);
    }
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    this.ctx.fillStyle = 'red';
    this.ctx.fill();
    this.ctx.restore();
    this.ctx.restore();
    this.ctx.restore();
  }

  onMouseUp(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.lastPoint = null;
    this.drawingService.endStroke();
  }

  // 触摸事件处理
  onTouchStart(event: TouchEvent): void {
    if (!this.settings) return;
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const transformedPoint = this.transformCoordinates(x, y);
    this.isDrawing = true;
    this.lastPoint = transformedPoint;
    const pressure = (touch as any).force !== undefined ? (touch as any).force : 1;
    this.drawingService.startStroke(transformedPoint.x, transformedPoint.y, pressure);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDrawing || !this.lastPoint || !this.settings) return;
    event.preventDefault();
    const touch = event.touches[0];
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const transformedPoint = this.transformCoordinates(x, y);
    const pressure = (touch as any).force !== undefined ? (touch as any).force : 1;
    this.drawingService.continueStroke(transformedPoint.x, transformedPoint.y, pressure);
    this.lastPoint = transformedPoint;
  }

  onTouchEnd(): void {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.lastPoint = null;
    this.drawingService.endStroke();
  }

  // 正向旋转坐标变换
  private transformCoordinates(x: number, y: number): Point {
    if (!this.settings) return { x, y };
    const centerX = this.settings.rotationCenter.x;
    const centerY = this.settings.rotationCenter.y;
    const angleInRadians = (this.currentAngle * Math.PI) / 180;
    const dx = x - centerX;
    const dy = y - centerY;
    const rotatedX = dx * Math.cos(angleInRadians) + dy * Math.sin(angleInRadians);
    const rotatedY = -dx * Math.sin(angleInRadians) + dy * Math.cos(angleInRadians);
    return {
      x: rotatedX + centerX,
      y: rotatedY + centerY
    };
  }
}
