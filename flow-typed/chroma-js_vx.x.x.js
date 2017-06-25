type Chroma = {
  hsl: () => [number, number, number],
  hex: () => string,
};

declare module 'chroma-js' {
  declare module.exports: {
    (color: string): Chroma,
    hsl: (h: number, s: number, l: number) => Chroma,
  }
}
