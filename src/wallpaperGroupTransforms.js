// @flow
import type {Path, Point} from './types';
import Matrix from 'transformatrix';

type Transformer = (paths: Array<Path>) => Array<Path>;

type TransformerFactory = (
  tileWidth: number,
  tileHeight: number,
) => Transformer;

// https://en.wikipedia.org/wiki/Wallpaper_group#Group_p1_.28o.29
export const p1: TransformerFactory = () =>
  (paths: Array<Path>) => {
    return paths;
  };

const makePathTransformer = transform =>
  (paths: Array<Path>) =>
    paths.map(({...rest, points}) => ({
      ...rest,
      points: points.map(transform),
    }));

export const p2: TransformerFactory = (tileWidth, tileHeight) => {
  const matrix = new Matrix()
    .translate(tileWidth / 2, tileHeight / 2)
    .rotate(Math.PI)
    .translate(-tileWidth / 2, -tileHeight / 2);

  const transformPaths = makePathTransformer(({x, y}: Point) => {
    const [x2, y2] = matrix.transformPoint(x, y);
    return {x: x2, y: y2};
  });

  return (paths: Array<Path>) => {
    return [...paths, ...transformPaths(paths)];
  };
};

const TAU = Math.PI * 2;

const OY = 1.5;
const OX = 1 / 2;

const getCoordShiftAmount = (value, size) => -Math.floor(value / size) * size;

const addToCoords = ({x: xDiff, y: yDiff}) =>
  ({x, y}) => {
    return {x: x + xDiff, y: y + yDiff};
  };
export const p3: TransformerFactory = (tileWidth, tileHeight) => {
  console.log(tileWidth, tileHeight);
  const matrices = [
    new Matrix()
      .translate(tileWidth / 2, tileHeight / 2)
      .rotate(TAU / 3)
      .translate(-tileWidth / 2, -tileHeight / 2),
    new Matrix()
      .translate(tileWidth / 2, tileHeight / 2)
      .rotate(TAU / 3 * 2)
      .translate(-tileWidth / 2, -tileHeight / 2),
    new Matrix().translate(tileWidth * OX, tileHeight * OY),
    new Matrix()
      .translate(tileWidth * OX, tileHeight * OY)
      .translate(tileWidth / 2, tileHeight / 2)
      .rotate(TAU / 3)
      .translate(-tileWidth / 2, -tileHeight / 2),
    new Matrix()
      .translate(tileWidth * OX, tileHeight * OY)
      .translate(tileWidth / 2, tileHeight / 2)
      .rotate(TAU / 3 * 2)
      .translate(-tileWidth / 2, -tileHeight / 2),
  ];
  const pathTransformers = matrices.map(matrix =>
    makePathTransformer(({x, y}: Point) => {
      const [x2, y2] = matrix.transformPoint(x, y);
      return {x: x2, y: y2};
    }));
  return (paths: Array<Path>) => {
    return [
      ...paths,
      ...pathTransformers.reduce(
        (addedPaths, transformPaths) => {
          return [...addedPaths, ...transformPaths(paths)];
        },
        [],
      ),
    ];
  };
};
