declare module 'simplify-js' {
  declare function simplify(
    points: Array<{x: number, y: number}>,
    precision: number,
    highQuality?: boolean
  ): Array<{x: number, y: number}>;

  declare module.exports: typeof simplify;
};
