// @flow
import type {Path, Point} from './types';
import Matrix from 'transformatrix';

type Transformer = (paths: Array<Path>) => Array<Path>;

type TransformerFactory = (
  tileWidth: number,
  tileHeight: number,
) => Transformer;

const getHexagonalTileDimensions = (
  tileSize: number,
): {tileWidth: number, tileHeight: number} => {
  return {
    tileWidth: tileSize * Math.sqrt(3),
    tileHeight: tileSize * 3,
  };
};

const getSquareTileDimensions = (
  tileSize: number,
): {tileWidth: number, tileHeight: number} => {
  return {
    tileWidth: tileSize,
    tileHeight: tileSize,
  };
};

// https://en.wikipedia.org/wiki/Wallpaper_group#Group_p1_.28o.29
export const p1: TransformerFactory = () =>
  (paths: Array<Path>) => {
    return paths;
  };
p1.getTileDimensions = getSquareTileDimensions;

const makePathTransformer = transform =>
  (path: Path) => ({
    ...path,
    points: path.points.map(transform),
  });

const makeMatrixTransformer = matrices => {
  const pathTransformers = matrices.map(matrix =>
    makePathTransformer(({x, y}: Point) => {
      const [x2, y2] = matrix.transformPoint(x, y);
      return {x: x2, y: y2};
    }));
  return (paths: Array<Path>) => {
    return paths.reduce(
      (allPaths, path) => {
        return allPaths.concat(
          path,
          ...pathTransformers.map(transform => transform(path)),
        );
      },
      [],
    );
  };
};

export const p2: TransformerFactory = (tileWidth, tileHeight) => {
  const matrix = new Matrix()
    .translate(tileWidth / 2, tileHeight / 2)
    .rotate(Math.PI)
    .translate(-tileWidth / 2, -tileHeight / 2);

  return makeMatrixTransformer([matrix]);
};
p2.getTileDimensions = getSquareTileDimensions;

const TAU = Math.PI * 2;

const OY = 1.5;
const OX = 1 / 2;

export const p3: TransformerFactory = (tileWidth, tileHeight) => {
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

  return makeMatrixTransformer(matrices);
};
p3.getTileDimensions = getHexagonalTileDimensions;
