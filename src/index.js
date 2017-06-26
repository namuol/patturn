// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App, {reducer as appReducer} from './App';

/*
globals
__REDUX_DEVTOOLS_EXTENSION__
*/

const store = createStore(
  appReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ &&
    window.__REDUX_DEVTOOLS_EXTENSION__({
      actionsBlacklist: ['MOUSE_MOVED'],
    }),
);

ReactDOM.render(
  <Provider store={store}><App tileSize={100} /></Provider>,
  document.getElementById('root'),
);
