import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import { findDOMNode } from 'react-dom';
import Seamstress from 'react-seamstress';

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

  const tile = [
    new Transform(),
    new Transform().translate(tileWidth/2,tileHeight/2).rotate(90).translate(-tileWidth/2,-tileHeight/2),
    new Transform().translate(tileWidth/2,tileHeight/2).rotate(180).translate(-tileWidth/2,-tileHeight/2),
    new Transform().translate(tileWidth/2,tileHeight/2).rotate(270).translate(-tileWidth/2,-tileHeight/2),
  ].map((transform, tdx) => {
    return canvas.get('lines').map((points, idx) => {
      return <Shape
        key={idx}
        stroke={'#000'}
        strokeWidth={2}
        transform={transform}
        d={'M' + points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
      />;
    });
  });

  const columnCount = Math.ceil(width/tileWidth) + 1;
  const rowCount = Math.ceil(height/tileHeight);

  return (
    <div
      onMouseDown={(e) => {
        const { top, left, width, height } = e.target.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        startDrawingLine(x, y);
      }}
      {...computedStyles.root}
    >
      <Surface
        width={width}
        height={height}
      >
        {Immutable.Range(0,columnCount*rowCount).map((num) => {
          const col = num % columnCount;
          const row = Math.floor(num / columnCount);
          const xOffset = (row % 2) * tileWidth / 2;

          return (
            <Group x={col*tileWidth - xOffset} y={row*tileHeight}>
              {tile}
            </Group>
          );
        })}
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