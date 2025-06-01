import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { HistoryService } from '../../services/history.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-history-controls',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './history-controls.component.html',
  styleUrls: ['./history-controls.component.scss']
})
export class HistoryControlsComponent implements OnInit, OnDestroy {
  canUndo: boolean = false;
  canRedo: boolean = false;
  
  private subscriptions: Subscription[] = [];
  
  constructor(private historyService: HistoryService) {}
  
  ngOnInit(): void {
    this.subscriptions.push(
      this.historyService.history$.subscribe(() => {
        this.canUndo = this.historyService.canUndo();
        this.canRedo = this.historyService.canRedo();
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  undo(): void {
    this.historyService.undo();
  }
  
  redo(): void {
    this.historyService.redo();
  }
  
  clear(): void {
    if (confirm('确定要清空画板吗？')) {
      this.historyService.clear();
    }
  }
}
