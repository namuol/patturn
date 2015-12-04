import React, { Component } from 'react';
import CanvasApp from './CanvasApp';
import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import * as reducers from '../reducers';

const finalCreateStore = compose(
  applyMiddleware(thunk),
  window.devToolsExtension ? window.devToolsExtension() : f => f,
)(createStore);

const reducer = combineReducers(reducers);
const store = finalCreateStore(reducer);

if (module.hot) {
  module.hot.accept('../reducers', () =>
    store.replaceReducer(combineReducers(require('../reducers')))
  );
}

export default class App extends Component {
  render() {
    return (
      <div>
        <Provider store={store}>
          <CanvasApp />
        </Provider>
      </div>
    );
  }
}
