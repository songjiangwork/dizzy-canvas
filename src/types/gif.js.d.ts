declare module 'gif.js' {
  interface GIFOptions {
    workers?: number;
    quality?: number;
    width?: number;
    height?: number;
    workerScript?: string;
  }

  interface AddFrameOptions {
    delay?: number;
    copy?: boolean;
  }

  type GIFEvent = 'finished' | 'progress';

  export class GIF {
    constructor(options?: GIFOptions);
    addFrame(image: CanvasImageSource, options?: AddFrameOptions): void;
    on(event: GIFEvent, callback: (data: any) => void): void;
    render(): void;
  }

  export default GIF;
}
