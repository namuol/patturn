// @flow
import type {Path} from './types';

type Params = {
  path: Path,
  tileWidth: number,
  tileHeight: number,
};

const crossesGrid = (v1, v2, size) => {
  const cell1 = Math.floor(v1 / size);
  const cell2 = Math.floor(v2 / size);
  return cell1 !== cell2;
};

const splitPathAtTileBoundaries = (
  {path: {points, strokeWidth, smoothFactor}, tileWidth, tileHeight}: Params,
): Array<Path> => {
  let lastPoint = points[0];
  const paths = [{points: [lastPoint], strokeWidth, smoothFactor}];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const {x: x1, y: y1} = lastPoint;
    const {x: x2, y: y2} = point;

    if (crossesGrid(x1, x2, tileWidth) || crossesGrid(y1, y2, tileHeight)) {
      paths.push(
        {
          points: [lastPoint, point],
          intersectsGrid: true,
          strokeWidth,
          smoothFactor,
        },
        {points: [point], strokeWidth, smoothFactor},
      );
    } else {
      paths[paths.length - 1].points.push(point);
    }

    lastPoint = point;
  }

  return paths;
};

export default splitPathAtTileBoundaries;
