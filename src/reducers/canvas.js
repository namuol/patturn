import Immutable from 'immutable';
import mod from '../utils/mod';
import getIntersectionWithTile from '../utils/getIntersectionWithTile';
import sliceSegmentByGridIntersections from '../utils/sliceSegmentByGridIntersections';

import {
  START_DRAWING_LINE,
  DRAW_LINE,
  STOP_DRAWING_LINE,
} from '../constants/ActionTypes';

const defaultState = Immutable.fromJS({
  isDrawing: false,
  paths: [],
  tileWidth: -1,
  tileHeight: -1,
});

function splitLastLineIfNeeded ({paths, tileWidth, tileHeight}) {
  // Get last two points of last path:
  const path = paths.last();
  const p0 = path.get(path.size-2).get('orig').toJS();
  const p1 = path.get(path.size-1).get('orig').toJS();

  const newSegments = sliceSegmentByGridIntersections(
    p0, p1,
    tileWidth, tileHeight
  );

  if (newSegments.length > 0) {
  }

  return paths;
}

export default function canvas (state=defaultState, action) {
  const {
    x, y,
    tileWidth, tileHeight
  } = action;
  
  switch (action.type) {
  case START_DRAWING_LINE:
    return state.set('isDrawing', true).set('paths', state.get('paths').push(Immutable.List()));
  case DRAW_LINE:
    const paths = state.get('paths');
    const points = paths.last().push(Immutable.Map({
      x,y,
      orig:{x,y},
    }));
    return state.set('paths', paths.set(paths.size-1, points));

    return state.set('paths', splitLastLineIfNeeded({
      paths: paths.set(paths.size-1, points),
      tileWidth, tileHeight,
    }));
  case STOP_DRAWING_LINE:
    return state.set('isDrawing', false);
  default:
    return state;
  }
}
