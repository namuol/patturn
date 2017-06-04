// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';
import App, {reducer as appReducer} from './App';

const store = createStore(appReducer);

ReactDOM.render(
  <Provider store={store}><App tileSize={100} /></Provider>,
  document.getElementById('root'),
);
