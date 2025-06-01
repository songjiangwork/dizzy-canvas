export interface CanvasSettings {
  backgroundColor: string;
  rotationSpeed: number; // 度/秒
  rotationDirection: 'clockwise' | 'counterclockwise';
  rotationCenter: { x: number, y: number };
  radius: number;
}

export interface Point {
  x: number;
  y: number;
}
