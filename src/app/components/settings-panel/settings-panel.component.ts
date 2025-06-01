import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { RotationService } from '../../services/rotation.service';
import { CanvasSettings } from '../../models/canvas-settings.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './settings-panel.component.html',
  styleUrls: ['./settings-panel.component.scss']
})
export class SettingsPanelComponent implements OnInit, OnDestroy {
  settings: CanvasSettings = {
    backgroundColor: '#ffffff',
    rotationSpeed: 5,
    rotationDirection: 'clockwise',
    rotationCenter: { x: 0, y: 0 },
    radius: 300
  };
  
  isRotating: boolean = true;
  showCenterCoordinates: boolean = true;
  minRadius: number = 100;
  maxRadius: number = 1000;
  isCollapsed: boolean = false;
  
  private subscriptions: Subscription[] = [];
  
  constructor(private rotationService: RotationService) {}
  
  ngOnInit(): void {
    this.subscriptions.push(
      this.rotationService.settings$.subscribe(settings => {
        // 先计算maxRadius
        this.maxRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - 20;
        // 如果radius超出maxRadius，延迟修正，避免ExpressionChangedAfterItHasBeenCheckedError
        if (settings.radius > this.maxRadius) {
          setTimeout(() => this.setRadius(this.maxRadius));
        }
        this.settings = settings;
      })
    );
    
    this.subscriptions.push(
      this.rotationService.isRotating$.subscribe(isRotating => {
        this.isRotating = isRotating;
      })
    );
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
  
  setBackgroundColor(color: string): void {
    this.rotationService.updateSettings({ backgroundColor: color });
  }
  
  setRotationSpeed(speed: number): void {
    this.rotationService.updateSettings({ rotationSpeed: speed });
  }
  
  setRotationDirection(direction: 'clockwise' | 'counterclockwise'): void {
    this.rotationService.updateSettings({ rotationDirection: direction });
  }
  
  toggleRotation(): void {
    this.rotationService.toggleRotation();
  }
  
  resetRotationCenter(): void {
    this.rotationService.resetRotationCenter();
  }
  
  setRadius(radius: number): void {
    this.rotationService.updateSettings({ radius });
  }
  
  private onWindowResize(): void {
    this.maxRadius = Math.min(window.innerWidth, window.innerHeight) / 2 - 20;
    
    // 如果当前半径超过最大值，则调整为最大值
    if (this.settings.radius > this.maxRadius) {
      setTimeout(() => this.setRadius(this.maxRadius));
    }
  }
}
