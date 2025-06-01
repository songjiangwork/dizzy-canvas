export interface Brush {
  type: 'pen' | 'pencil' | 'brush';
  color: string;
  size: number;
  opacity: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number; // 用于支持压感
  time: number; // 用于回放和GIF生成
}

export interface DrawingStroke {
  points: DrawingPoint[];
  brush: Brush;
}

export interface DrawingHistory {
  strokes: DrawingStroke[];
  currentIndex: number; // 用于撤销/恢复功能
}
