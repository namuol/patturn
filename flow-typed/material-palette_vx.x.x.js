type HSL = {
  h: number,
  s: number,
  l: number,
};

declare module 'material-palette' {
  declare module.exports: (HSL) => {
    [key: string]: HSL,
  };
}
