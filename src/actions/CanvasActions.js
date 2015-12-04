import {
  START_DRAWING_LINE,
  DRAW_LINE,
  STOP_DRAWING_LINE,
} from '../constants/ActionTypes';

import mod from '../utils/mod';

export function startDrawingLine ({x,y,tileWidth,tileHeight}) {
  return {
    type: START_DRAWING_LINE,
    x,y,
    tileWidth,tileHeight,
  };
}

export function drawTo ({x,y,tileWidth,tileHeight}) {
  return {
    type: DRAW_LINE,
    x,y,
    tileWidth,tileHeight,
  };
}

export function stopDrawingLine ({x,y, tileWidth,tileHeight}) {
  return {
    type: STOP_DRAWING_LINE,
    x,y,
    tileWidth,tileHeight,
  };
}
