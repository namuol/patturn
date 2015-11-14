import Immutable from 'immutable';

import {
  RESIZE_SCREEN,
} from '../constants/ActionTypes';

const defaultState = Immutable.fromJS({
  width: window.innerWidth,
  height: window.innerHeight,
});

export default function screen (state=defaultState, action) {
  const { width, height } = action;
  
  switch (action.type) {
  case RESIZE_SCREEN:
  default:
    return state;
  }
}
