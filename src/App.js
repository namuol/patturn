// @flow
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

type Point = [number, number];

type Path = Array<Point>;

type TileProps = $Exact<{
  id: string,
  pageMouseX: number,
  pageMouseY: number,
  paths: Array<Path>,
  tileHeight: number,
  tileWidth: number,
}>;

const getTileCoordFromPageCoord = (
  {
    pageMouseX,
    pageMouseY,
    tileHeight,
    tileWidth,
  }
) => {
  return [
    pageMouseX - Math.floor(pageMouseX / tileWidth) * tileWidth,
    pageMouseY - Math.floor(pageMouseY / tileHeight) * tileHeight,
  ];
};

const TileableCircle = (
  {
    cx,
    cy,
    r,
    fill,

    tileWidth,
    tileHeight,
  }
) => {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />

      <circle cx={cx + tileWidth} cy={cy} r={r} fill={fill} />
      <circle cx={cx - tileWidth} cy={cy} r={r} fill={fill} />

      <circle cx={cx} cy={cy + tileHeight} r={r} fill={fill} />
      <circle cx={cx} cy={cy - tileHeight} r={r} fill={fill} />

      <circle cx={cx + tileWidth} cy={cy + tileHeight} r={r} fill={fill} />
      <circle cx={cx + tileWidth} cy={cy - tileHeight} r={r} fill={fill} />

      <circle cx={cx - tileWidth} cy={cy + tileHeight} r={r} fill={fill} />
      <circle cx={cx - tileWidth} cy={cy - tileHeight} r={r} fill={fill} />
    </g>
  );
};

const Tile = (
  {
    id,
    pageMouseX,
    pageMouseY,
    paths,
    tileHeight,
    tileWidth,
  }: TileProps
) => {
  const [tileMouseX, tileMouseY] = getTileCoordFromPageCoord({
    pageMouseX,
    pageMouseY,
    tileHeight,
    tileWidth,
  });
  return (
    <pattern
      id={id}
      width={tileWidth}
      height={tileHeight}
      patternUnits="userSpaceOnUse"
    >
      {paths.map((points, idx) => {
        return (
          <polyline
            stroke="#ddd"
            fill="red"
            key={idx}
            points={points.map(coords => coords.join(',')).join(' ')}
          />
        );
      })}

      <TileableCircle
        cx={0}
        cy={0}
        r={3}
        fill="#faa"
        tileWidth={tileWidth}
        tileHeight={tileHeight}
      />

      <TileableCircle
        cx={tileMouseX}
        cy={tileMouseY}
        r={4}
        fill="blue"
        tileWidth={tileWidth}
        tileHeight={tileHeight}
      />
    </pattern>
  );
};

const Canvas = (
  {
    viewBoxWidth,
    viewBoxHeight,
    pageMouseX,
    pageMouseY,
  }
) => {
  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
      <Tile
        id="patturnTile"
        tileWidth={100}
        tileHeight={100}
        pageMouseX={pageMouseX}
        pageMouseY={pageMouseY}
        paths={[[[0, 0], [100, 0]], [[0, 0], [0, 100]]]}
      />
      <rect
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="url(#patturnTile)"
      />
    </svg>
  );
};

class App extends Component {
  state = {
    viewBoxWidth: 0,
    viewBoxHeight: 0,
    pageMouseX: 310,
    pageMouseY: 0,
  };

  measureCanvas = element => {
    const dims = ReactDOM.findDOMNode(element).getBoundingClientRect();
    const { width, height } = dims;
    this.setState(() => {
      return {
        viewBoxWidth: width,
        viewBoxHeight: height,
      };
    });
  };

  handleMouseMove = (
    {
      pageX,
      pageY,
    }
  ) => {
    this.setState(state => {
      return {
        ...state,
        pageMouseX: pageX,
        pageMouseY: pageY,
      };
    });
  };

  render() {
    return (
      <div
        onMouseMove={this.handleMouseMove}
        style={{
          width: '100%',
          height: '100%',
        }}
        ref={this.measureCanvas}
      >
        <Canvas {...this.state} />
      </div>
    );
  }
}

export default App;
