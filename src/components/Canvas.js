import React, { Component, PropTypes } from 'react';
import Immutable from 'immutable';
import { findDOMNode } from 'react-dom';
import Seamstress from 'react-seamstress';

import WallpaperGroups from '../utils/WallpaperGroups';

import {
  Geometry,
  Vector3,
  LineBasicMaterial,
} from 'three';

import {
  OrthographicCamera,
  Scene,
  Line,
} from 'react-three';

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

  const transforms = WallpaperGroups.getIn(['p3', 'transforms'])(props);
  const material = new LineBasicMaterial({
    color: 0x000000,
    linewidth: 3,
    opacity: 1,
    linecap: 'round',
  });

  const tile = transforms.map((transform, tdx) => {
    return canvas.get('paths').map((points, idx) => {
      const geometry = new Geometry();
      const vecs = points.toJS().map(p => new Vector3(p.x, p.y, 0));
      geometry.vertices.push(...vecs);
      return <Line
        geometry={geometry}
        material={material}
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
      <Scene
        width={width}
        height={height}
        camera="maincamera"
        background={0xffffff}
      >
        <OrthographicCamera
          name="maincamera"
          left={0}
          right={width}
          top={0}
          bottom={height}
          near={-100}
          far={100}
        />
        {tile}
        {/*Immutable.Range(0,(rowCount + 2)*(columnCount + 2)).map((num) => {
          const col = num % columnCount;
          const row = Math.floor(num / columnCount);
          const xOffset = tileWidth/2 - (row % 2) * tileWidth / 2;
          // const xOffset = 0;

          return (
            <Group x={col*tileWidth - (columnCount/3)*tileWidth - xOffset} y={row*tileHeight - (rowCount/3)*tileHeight - tileHeight}>
              {tile}
            </Group>
          );
        })*/}
      </Scene>
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