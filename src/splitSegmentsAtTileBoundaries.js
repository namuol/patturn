// @flow
import type {Path} from './types';

type Params = {
  path: Path,
  tileWidth: number,
  tileHeight: number,
};

const crossesGrid = (v1, v2, size, strokeWidth) => {
  const min = Math.min(v1, v2) - strokeWidth;
  const max = Math.max(v1, v2) + strokeWidth;
  const cell1 = Math.floor(min / size);
  const cell2 = Math.floor(max / size);
  return cell1 !== cell2;
};

const splitPathAtTileBoundaries = (
  {
    path: {points, strokeWidth, color, smoothFactor},
    tileWidth,
    tileHeight,
  }: Params,
): Array<Path> => {
  let lastPoint = points[0];
  const paths = [{points: [lastPoint], strokeWidth, smoothFactor, color}];
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    const {x: x1, y: y1} = lastPoint;
    const {x: x2, y: y2} = point;

    if (
      crossesGrid(x1, x2, tileWidth, strokeWidth) ||
      crossesGrid(y1, y2, tileHeight, strokeWidth)
    ) {
      paths.push(
        {
          points: [lastPoint, point],
          intersectsGrid: true,
          strokeWidth,
          smoothFactor,
          color,
        },
        {points: [point], strokeWidth, smoothFactor, color},
      );
    } else {
      paths[paths.length - 1].points.push(point);
    }

    lastPoint = point;
  }

  return paths;
};

export default splitPathAtTileBoundaries;
