// @flow
export type Point = {
  x: number,
  y: number,
};
export type Path = {
  points: Array<Point>,
  intersectsGrid?: boolean,
};
