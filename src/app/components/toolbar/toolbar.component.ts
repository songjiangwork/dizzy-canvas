import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DrawingService } from '../../services/drawing.service';
import { Brush } from '../../models/brush.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit, OnDestroy {
  currentBrush: Brush = {
    type: 'pen',
    color: '#000000',
    size: 5,
    opacity: 1
  };
  
  isCollapsed = false;

  private subscriptions: Subscription[] = [];
  
  constructor(private drawingService: DrawingService) {}
  
  ngOnInit(): void {
    this.subscriptions.push(
      this.drawingService.currentBrush$.subscribe(brush => {
        this.currentBrush = brush;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  setBrushType(type: 'pen' | 'pencil' | 'brush'): void {
    this.drawingService.updateBrush({ type });
  }
  
  setColor(color: string): void {
    this.drawingService.updateBrush({ color });
  }
  
  setSize(size: number): void {
    this.drawingService.updateBrush({ size });
  }
  
  setOpacity(opacity: number): void {
    this.drawingService.updateBrush({ opacity });
  }
}
