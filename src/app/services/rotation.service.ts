import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CanvasSettings, Point } from '../models/canvas-settings.model';

@Injectable({
  providedIn: 'root'
})
export class RotationService {
  private defaultCenter: Point = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  private defaultRadius: number = Math.min(window.innerWidth, window.innerHeight) / 2 - 20;
  
  private settingsSubject = new BehaviorSubject<CanvasSettings>({
    backgroundColor: '#ffffff',
    rotationSpeed: 5, // 每秒旋转5度
    rotationDirection: 'clockwise',
    rotationCenter: this.defaultCenter,
    radius: this.defaultRadius
  });

  private isRotatingSubject = new BehaviorSubject<boolean>(true);
  private currentAngleSubject = new BehaviorSubject<number>(0);
  private animationFrameId: number | null = null;
  private lastTimestamp: number | null = null;

  constructor() {
    this.startRotation();
    
    // 监听窗口大小变化，调整画布半径和中心点
    window.addEventListener('resize', () => {
      const newRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - 20;
      // 画布正中心
      const newCenter = { x: newRadius, y: newRadius };
      this.settingsSubject.next({
        ...this.settingsSubject.value,
        rotationCenter: newCenter,
        radius: newRadius
      });
      this.defaultCenter = newCenter;
      this.defaultRadius = newRadius;
    });
  }

  get settings$(): Observable<CanvasSettings> {
    return this.settingsSubject.asObservable();
  }

  get isRotating$(): Observable<boolean> {
    return this.isRotatingSubject.asObservable();
  }

  get currentAngle$(): Observable<number> {
    return this.currentAngleSubject.asObservable();
  }

  get currentSettings(): CanvasSettings {
    return this.settingsSubject.value;
  }

  updateSettings(settings: Partial<CanvasSettings>): void {
    this.settingsSubject.next({
      ...this.settingsSubject.value,
      ...settings
    });
  }

  toggleRotation(): void {
    const isRotating = !this.isRotatingSubject.value;
    this.isRotatingSubject.next(isRotating);
    
    if (isRotating) {
      this.startRotation();
    } else {
      this.stopRotation();
    }
  }

  setRotationCenter(center: Point): void {
    this.updateSettings({ rotationCenter: center });
  }

  resetRotationCenter(): void {
    this.updateSettings({ rotationCenter: this.defaultCenter });
  }

  private startRotation(): void {
    if (this.animationFrameId !== null) {
      return;
    }
    
    this.lastTimestamp = null;
    this.animateRotation();
  }

  private stopRotation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private animateRotation(timestamp?: number): void {
    if (!this.isRotatingSubject.value) {
      return;
    }
    
    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp || performance.now();
    }
    
    const elapsed = (timestamp || performance.now()) - this.lastTimestamp;
    this.lastTimestamp = timestamp || performance.now();
    
    const settings = this.settingsSubject.value;
    const rotationAmount = (settings.rotationSpeed * elapsed) / 1000;
    const direction = settings.rotationDirection === 'clockwise' ? 1 : -1;
    
    let newAngle = this.currentAngleSubject.value + (rotationAmount * direction);
    
    // 保持角度在0-360范围内
    if (newAngle >= 360) {
      newAngle -= 360;
    } else if (newAngle < 0) {
      newAngle += 360;
    }
    
    this.currentAngleSubject.next(newAngle);
    
    this.animationFrameId = requestAnimationFrame((time) => this.animateRotation(time));
  }
}
