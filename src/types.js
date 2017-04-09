// @flow
export type Point = [number, number];
export type Path = {
  points: Array<Point>,
  intersectsGrid?: boolean,
};
