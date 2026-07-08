declare module '*neural-loader.js' {
  type NeuralLoaderTheme = 'dark' | 'light';

  type NeuralLoaderOptions = {
    theme?: NeuralLoaderTheme;
    cycle?: number;
  };

  export class NeuralLoader {
    constructor(canvas: HTMLCanvasElement, options?: NeuralLoaderOptions);
    destroy(): void;
    nextStructure(): void;
    pause(): void;
    replay(): void;
    resume(): void;
    setSpeed(value: number): void;
    setTheme(theme: NeuralLoaderTheme): void;
    start(): void;
    stop(): void;
  }
}
