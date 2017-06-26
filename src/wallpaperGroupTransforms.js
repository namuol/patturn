// @flow
import type {Path, Point} from './types';
import Matrix from 'transformatrix';

type Transformer = (paths: Array<Path>) => Array<Path>;

type TransformerFactory = (
  tileWidth: number,
  tileHeight: number,
) => Transformer;

type TileDimensionGetter = (tileSize: number) => {
  tileWidth: number,
  tileHeight: number,
};

type GridSnapperFactory = (gridSize: number) => Transformer;

type TransformerConfiguration = {
  createTransformer: TransformerFactory,
  getTileDimensions: TileDimensionGetter,
  createGridSnapper: GridSnapperFactory,
};

const makePathTransformer = transform =>
  (path: Path) => ({
    ...path,
    points: path.points.map(transform),
  });

const getHexagonalTileDimensions: TileDimensionGetter = (
  tileSize: number,
): {tileWidth: number, tileHeight: number} => {
  return {
    tileWidth: tileSize * Math.sqrt(3),
    tileHeight: tileSize * 3,
  };
};

const roundHexagon = (h_q: number, h_r: number) => {
  const h_s = -h_q - h_r;
  let q = Math.trunc(Math.round(h_q));
  let r = Math.trunc(Math.round(h_r));
  let s = Math.trunc(Math.round(h_s));
  const q_diff = Math.abs(q - h_q);
  const r_diff = Math.abs(r - h_r);
  const s_diff = Math.abs(s - h_s);
  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  }
  return [q, r];
};

const createHexagonalGridSnapper: GridSnapperFactory = (gridSize: number) => {
  /*
  A hexagon can be made of several right-angled triangles
  or rectangles, like so:

   _ | W |
   H   1 | 2
     | 3 | 4 |
     | 5 | 6 |
       7 | 8

  W = sqrt(3) / 2 * H

  The center Segments 3, 4, 6, 6 are rectangles of (W, H)
  The corner segments 1, 2, 7, 8 are right-angled triangles of W, H

  Here's what a grid could look like:

    1 | 2   1 | 2   1 |
  | 3 | 4 | 3 | 4 | 3 |
  | 5 | 6 | 5 | 6 | 5 |
    7 | 8   7 | 8   7 |
  | 2   1 | 2   1 | 2
  | 4 | 3 | 4 | 3 | 4 |
  | 6 | 5 | 6 | 5 | 6 |
  | 8   7 | 8   7 | 8

  Therefore, we can break the problem into three parts:

  1. Determine where we are in rectangular coordinates to determine our
     segment-type (corner or center)
  2. - If we're in a corner, determine which triangular *sub-segment*
       we are in to determine which of the two possible hexagons we're in
     - If we're in a center, it's easy to determine our hexagon
  3. Return the centerpoint of the hexagon
  */

  const snapPointToGrid = (point: Point) => {
    const {x, y} = point;
    const q = (x * Math.sqrt(3) / 3 - y / 3) / gridSize;
    const r = y * 2 / 3 / gridSize;
    const [roundedQ, roundedR] = roundHexagon(q, r);
    return {
      ...point,
      x: gridSize * Math.sqrt(3) * (roundedQ + roundedR / 2),
      y: gridSize * 3 / 2 * roundedR,
    };
  };

  return (paths: Array<Path>) => {
    return paths.map(path => ({
      ...path,
      points: path.points.map(snapPointToGrid),
    }));
  };
};

const getSquareTileDimensions: TileDimensionGetter = (
  tileSize: number,
): {tileWidth: number, tileHeight: number} => {
  return {
    tileWidth: tileSize,
    tileHeight: tileSize,
  };
};

const createSquareGridSnapper: GridSnapperFactory = (gridSize: number) => {
  const snapPointToGrid = (point: Point) => ({
    ...point,
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  });

  return (paths: Array<Path>) => {
    return paths.map(path => ({
      ...path,
      points: path.points.map(snapPointToGrid),
    }));
  };
};

// https://en.wikipedia.org/wiki/Wallpaper_group#Group_p1_.28o.29
export const p1: TransformerConfiguration = {
  createTransformer: () =>
    (paths: Array<Path>) => {
      return paths;
    },
  createGridSnapper: createSquareGridSnapper,
  getTileDimensions: getSquareTileDimensions,
};

const makeMatrixTransformer = (matrices: Array<Matrix>) => {
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

export const p2: TransformerConfiguration = {
  createTransformer: (tileWidth, tileHeight) => {
    const matrix = new Matrix()
      .translate(tileWidth / 2, tileHeight / 2)
      .rotate(Math.PI)
      .translate(-tileWidth / 2, -tileHeight / 2);

    return makeMatrixTransformer([matrix]);
  },
  createGridSnapper: createSquareGridSnapper,
  getTileDimensions: getSquareTileDimensions,
};

const TAU = Math.PI * 2;

const OY = 1.5;
const OX = 1 / 2;

export const p3: TransformerConfiguration = {
  createTransformer: (tileWidth, tileHeight) => {
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
  },
  createGridSnapper: createHexagonalGridSnapper,
  getTileDimensions: getHexagonalTileDimensions,
};
