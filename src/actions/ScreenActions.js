import {
  RESIZE_SCREEN,
} from '../constants/ActionTypes';

export function resizeScreen (width,height) {
  return {
    type: RESIZE_SCREEN,
    width, height
  };
}
