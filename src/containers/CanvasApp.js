import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Canvas from '../components/Canvas';
import * as CanvasActions from '../actions/CanvasActions';
import Seamstress from 'react-seamstress';

const seamstressConfig = {
  styles: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'grey',
    width: '100vw',
    height: '100vh',
  },
  getStyleState: ({props}) => {
    return {
    };
  },
};

class CanvasApp extends React.Component {
  render () {
    const {
      canvas,
      computedStyles,
      dispatch,
    } = this.props;

    const boundActions = bindActionCreators(CanvasActions, dispatch);

    return (
      <div
        onMouseUp={(e) => {
          const { top, left, width, height } = findDOMNode(this.refs.canvas).getBoundingClientRect();
          const x = e.clientX - left;
          const y = e.clientY - top;
          boundActions.stopDrawingLine(x, y);
        }}
        onMouseMove={(e) => {
          if (!!canvas.get('isDrawing')) {
            const { top, left, width, height } = findDOMNode(this.refs.canvas).getBoundingClientRect();
            const x = e.clientX - left;
            const y = e.clientY - top;
            boundActions.drawTo(x, y);
          }
        }}
        {...computedStyles.root}
      >
        <Canvas
          ref="canvas"
          canvas={canvas}
          height={400}
          width={400}
          {...boundActions}
        />
      </div>
    );
  }
}

CanvasApp = Seamstress.createContainer(CanvasApp, seamstressConfig);

CanvasApp.displayName = 'CanvasApp';

CanvasApp.propTypes = {
  isDrawing: PropTypes.bool,
  dispatch: PropTypes.func.isRequired,
};

function select (state) {
  return {
    canvas: state.canvas
  };
}

export default connect(select)(CanvasApp);
