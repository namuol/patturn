import Immutable from 'immutable';

import {
  START_DRAWING_LINE,
  DRAW_LINE,
  STOP_DRAWING_LINE,
} from '../constants/ActionTypes';

const defaultState = Immutable.fromJS({
  isDrawing: false,
  lines: [],
});

export default function canvas(state = defaultState, action) {
  const { x, y } = action;
  
  switch (action.type) {
  case START_DRAWING_LINE:
    return state.set('isDrawing', true).set('lines', state.get('lines').push(Immutable.List()));
  case DRAW_LINE:
    const lines = state.get('lines');
    const points = lines.last().push(Immutable.Map({x, y}));
    return state.set('lines', lines.set(lines.size-1, points));
  case STOP_DRAWING_LINE:
    return state.set('isDrawing', false);
  default:
    return state;
  }
}
