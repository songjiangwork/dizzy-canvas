import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DrawingHistory } from '../models/brush.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private historySubject = new BehaviorSubject<DrawingHistory>({
    strokes: [],
    currentIndex: -1
  });
  
  constructor() {}
  
  get history$(): Observable<DrawingHistory> {
    return this.historySubject.asObservable();
  }
  
  get currentHistory(): DrawingHistory {
    return this.historySubject.value;
  }
  
  addStroke(stroke: any): void {
    const history = this.historySubject.value;
    
    // 如果当前不是在历史记录的最后，需要删除后面的记录
    if (history.currentIndex < history.strokes.length - 1) {
      history.strokes = history.strokes.slice(0, history.currentIndex + 1);
    }
    
    // 添加新的笔画
    history.strokes.push(stroke);
    history.currentIndex = history.strokes.length - 1;
    
    this.historySubject.next({...history});
  }
  
  undo(): boolean {
    const history = this.historySubject.value;
    
    if (history.currentIndex >= 0) {
      history.currentIndex--;
      this.historySubject.next({...history});
      return true;
    }
    
    return false;
  }
  
  redo(): boolean {
    const history = this.historySubject.value;
    
    if (history.currentIndex < history.strokes.length - 1) {
      history.currentIndex++;
      this.historySubject.next({...history});
      return true;
    }
    
    return false;
  }
  
  clear(): void {
    this.historySubject.next({
      strokes: [],
      currentIndex: -1
    });
  }
  
  canUndo(): boolean {
    return this.historySubject.value.currentIndex >= 0;
  }
  
  canRedo(): boolean {
    return this.historySubject.value.currentIndex < this.historySubject.value.strokes.length - 1;
  }
}
