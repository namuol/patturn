import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import { findDOMNode } from 'react-dom';
import Seamstress from 'react-seamstress';

import WallpaperGroups from '../utils/WallpaperGroups';

import { Group, Shape, Surface, Transform } from 'react-art';

const seamstressConfig = {
  styles: {
    backgroundColor: 'white',
    cursor: 'crosshair',
    width: p => p.width,
    height: p => p.height,
  },
  getStyleState: ({props}) => {
    return {
      width: props.width,
      height: props.height,
    };
  },
};

class Path extends Component {
  render () {
    return <Shape
      stroke={'#000'}
      strokeWidth={2.5}
      transform={this.props.transform}
      d={'M' + this.props.points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
    />;  
  }

  shouldComponentUpdate ({last}) {
    return !!last;
  }
}

function Canvas (props) {
  const {
    startDrawingLine,

    canvas,

    tileWidth,
    tileHeight,
    width,
    height,
    computedStyles,
  } = props;

  const transforms = WallpaperGroups.getIn(['p3', 'transforms'])(props);

  const tile = transforms.map((transform, tdx) => {
    return canvas.get('paths').map((points, idx) => {
      return <Shape
        stroke={'#000'}
        strokeWidth={2.5}
        transform={transform}
        d={'M' + points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
      />; 
    });
  });

  const columnCount = Math.ceil(width / tileWidth)*3;
  const rowCount = Math.ceil(height / tileHeight)*3;

  return (
    <div
      onMouseDown={(e) => {
        const { top, left, width, height } = e.target.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        startDrawingLine({x,y, tileWidth,tileHeight});
      }}
      {...computedStyles.root}
    >
      <Surface
        width={width}
        height={height}
      >
        <Group>
        {Immutable.Range(0,(rowCount + 2)*(columnCount + 2)).map((num) => {
          const col = num % columnCount;
          const row = Math.floor(num / columnCount);
          const xOffset = tileWidth/2 - (row % 2) * tileWidth / 2;
          // const xOffset = 0;

          return (
            <Group x={col*tileWidth - (columnCount/3)*tileWidth - xOffset} y={row*tileHeight - (rowCount/3)*tileHeight - tileHeight}>
              {/*<Shape
                transform={new Transform().translate(tileWidth/2-3,tileHeight/2-3)}
                d={'M0,0, 6,0, 6,6, 0,6Z'}
                fill={'#f00'}
              />/**/}
              {tile}
            </Group>
          );
        })}
        </Group>
      </Surface>
    </div>
  );
}

Canvas = Seamstress.createContainer(Canvas, seamstressConfig);

Canvas.propTypes = {
  startDrawingLine: PropTypes.func.isRequired,
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
};

Canvas.displayName = 'Canvas';

export default Canvas;