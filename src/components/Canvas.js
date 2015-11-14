import React, { Component, PropTypes } from 'react';
import { findDOMNode } from 'react-dom';
import Seamstress from 'react-seamstress';

import { Group, Shape, Surface, Transform } from 'react-art';

const seamstressConfig = {
  styles: {
    backgroundColor: 'white',
    cursor: 'crosshair',
    // width: p => p.width,
    // height: p => p.height,
  },
  getStyleState: ({props}) => {
    return {
      // width: props.width,
      // height: props.height,
    };
  },
};

const TRANSFORM = new Transform().translate(200,200).rotate(90).translate(-200,-200);
const TRANSFORM_2 = new Transform().translate(200,200).rotate(180).translate(-200,-200);
const TRANSFORM_3 = new Transform().translate(200,200).rotate(270).translate(-200,-200);

function Canvas (props) {
  const {
    startDrawingLine,

    canvas,

    width,
    height,
    computedStyles,
  } = props;

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
        <Group x={0} y={0}>
          {canvas.get('lines').map((points, idx) => {
            return <Shape
              key={idx}
              stroke={'#000'}
              strokeWidth={2}
              d={'M' + points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
            />;
          })}
          {canvas.get('lines').map((points, idx) => {
            return <Shape
              key={idx+'t'}
              transform={TRANSFORM}
              stroke={'#000'}
              strokeWidth={2}
              d={'M' + points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
            />;
          })}
          {canvas.get('lines').map((points, idx) => {
            return <Shape
              key={idx+'t'}
              transform={TRANSFORM_2}
              stroke={'#000'}
              strokeWidth={2}
              d={'M' + points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
            />;
          })}
          {canvas.get('lines').map((points, idx) => {
            return <Shape
              key={idx+'t'}
              transform={TRANSFORM_3}
              stroke={'#000'}
              strokeWidth={2}
              d={'M' + points.map(p => `${p.get('x')},${p.get('y')}`).join(',')}
            />;
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