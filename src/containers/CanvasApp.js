import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Canvas from '../components/Canvas';
import * as CanvasActions from '../actions/CanvasActions';
import * as ScreenActions from '../actions/ScreenActions';
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
  componentDidMount () {
    const { resizeScreen } = bindActionCreators(ScreenActions, this.props.dispatch);
    
    this._resizeScreen = () => {
      resizeScreen(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', this._resizeScreen);
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this._resizeScreen);
  }

  render () {
    const {
      canvas,
      screen,
      computedStyles,
      dispatch,
    } = this.props;
    const tileWidth = 200;
    const tileHeight = Math.floor((Math.sqrt(3)/2)*200);
    const boundActions = bindActionCreators(CanvasActions, dispatch);
    const repeatableTile = (
      <Canvas
        ref="canvas"
        canvas={canvas}
        width={screen.get('width')}
        height={screen.get('height')}
        width={tileWidth*2}
        height={tileHeight*2}
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        {...boundActions}
      />
    );

    return (
      <div
        onMouseUp={(e) => {
          const { top, left, width, height } = findDOMNode(this.refs.canvas).getBoundingClientRect();
          const x = e.clientX - left;
          const y = e.clientY - top;
          boundActions.stopDrawingLine({x,y, tileWidth,tileHeight});
        }}
        onMouseMove={(e) => {
          if (!!canvas.get('isDrawing')) {
            const { top, left, width, height } = findDOMNode(this.refs.canvas).getBoundingClientRect();
            const x = e.clientX - left;
            const y = e.clientY - top;
            boundActions.drawTo({x,y,tileWidth,tileHeight});
          }
        }}
        {...computedStyles.root}
      >
        {repeatableTile}  
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
    canvas: state.canvas,
    screen: state.screen,
  };
}

export default connect(select)(CanvasApp);
