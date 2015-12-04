export default function getIntersectionWithTile (
  p0,
  p1,
  tileX,
  tileY,
  tileWidth,
  tileHeight,
) {
  let t0 = 0.0;
  let t1 = 1.0;

  const edgeLeft = tileX;
  const edgeRight = tileX + tileWidth;
  const edgeTop = tileY;
  const edgeBottom = tileY + tileHeight;

  const x0src = p0.x;
  const y0src = p0.y;
  const xdelta = p1.x - x0src;
  const ydelta = p1.y - y0src;

  let p, q, r;

  for (let edge = 0; edge < 4; edge++) {
    if (edge == 0) {
      p = -xdelta;
      q = -(edgeLeft - x0src);
    }
    if (edge == 1) {
      p = xdelta;
      q = (edgeRight - x0src);
    }
    if (edge == 2) {
      p = -ydelta;
      q = -(edgeTop - y0src);
    }
    if (edge == 3) {
      p = ydelta;
      q = (edgeBottom - y0src);
    }
    r = q / p;
    if (p == 0 && q < 0) {
      console.log('a');
      return false;
    }

    if (p < 0) {
      if (r > t1) {
      console.log('b');
        return false;
      } else if (r > t0) {
        t0 = r;
      }
    } else if (p > 0) {
      if (r < t0) {
      console.log('c', p, r, t0);
        return false;
      } else if (r < t1) {
        t1 = r;
      }
    }
  }

  const x0clip = x0src + t0 * xdelta;
  const y0clip = y0src + t0 * ydelta;
  const x1clip = x0src + t1 * xdelta;
  const y1clip = y0src + t1 * ydelta;

  return {
    x: x0clip,
    y: y0clip,
  };
}

if (!!window)
  window.getIntersectionWithTile = getIntersectionWithTile;