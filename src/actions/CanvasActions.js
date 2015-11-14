import {
  START_DRAWING_LINE,
  DRAW_LINE,
  STOP_DRAWING_LINE,
} from '../constants/ActionTypes';

export function startDrawingLine (x,y) {
  return {
    type: START_DRAWING_LINE,
    x,y
  };
}

export function drawTo (x,y) {
  return {
    type: DRAW_LINE,
    x,y
  };
}

export function stopDrawingLine (x,y) {
  return {
    type: STOP_DRAWING_LINE,
    x,y
  };
}
