declare class Matrix {
  constructor(): Matrix;
  translate(x: number, y: number): Matrix;
  rotate(theta: number): Matrix;
  reset(): Matrix;
  inverse(): Matrix;
  scale(): Matrix;
  transformPoint(x: number, y: number): [number, number];
  transformVector(x: number, y: number): [number, number];
}

declare module 'transformatrix' {
  declare module.exports: typeof Matrix;
}
