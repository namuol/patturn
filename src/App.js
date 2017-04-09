// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import { compose } from 'ramda';
import withInternalReducer from './withInternalReducer';

import splitSegmentsAtTileBoundaries from './splitSegmentsAtTileBoundaries';

import type { Path, Point } from './types';

const getCoordShiftAmount = (value, size) => -Math.floor(value / size) * size;

const getTileCoordFromPageCoord = (
  {
    x,
    y,
    tileHeight,
    tileWidth,
  }
): Point => {
  return [
    x + getCoordShiftAmount(x, tileWidth),
    y + getCoordShiftAmount(y, tileHeight),
  ];
};

const addToCoords = ([xDiff, yDiff]) =>
  ([x, y]) => {
    return [x + xDiff, y + yDiff];
  };

const getTileSegmentFromPageSegment = (
  {
    points,
    tileHeight,
    tileWidth,
  }: {
    points: Array<Point>,
    tileWidth: number,
    tileHeight: number,
  }
): Array<Point> => {
  const [x, y] = points[0];
  const xDiff = getCoordShiftAmount(x, tileWidth);
  const yDiff = getCoordShiftAmount(y, tileHeight);

  return points.map(addToCoords([xDiff, yDiff]));
};

const TileableCircle = (
  {
    cx,
    cy,
    fill,
    r,
    tileHeight,
    tileWidth,
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

const getPolylinePointsString = (points: Array<Point>) => {
  return points.map(coords => coords.slice(0, 2).join(',')).join(' ');
};

const TilablePolyline = (
  {
    points,
    tileWidth,
    tileHeight,
    ...props
  }: {
    points: Array<Point>,
    tileWidth: number,
    tileHeight: number,
  }
) => {
  return (
    <g>
      {[
        [0, 0],
        [0, tileHeight],
        [0, -tileHeight],
        [tileWidth, 0],
        [tileWidth, tileWidth],
        [tileWidth, -tileWidth],
        [-tileWidth, 0],
        [-tileWidth, tileWidth],
        [-tileWidth, -tileWidth],
      ].map(offset => {
        return (
          <polyline
            {...props}
            points={getPolylinePointsString(points.map(addToCoords(offset)))}
          />
        );
      })}
    </g>
  );
};

type TileProps = {
  id: string,
  mousePageX: number,
  mousePageY: number,
  mousePressed: boolean,
  paths: Array<Path>,
  tileHeight: number,
  tileWidth: number,
};
const Tile = (
  {
    id,
    mousePageX,
    mousePageY,
    mousePressed,
    paths,
    tileHeight,
    tileWidth,
  }: TileProps
) => {
  const [tileMouseX, tileMouseY] = getTileCoordFromPageCoord({
    x: mousePageX,
    y: mousePageY,
    tileHeight,
    tileWidth,
  });

  const tilePaths = paths
    .reduce(
      (allPaths, path) => {
        return [
          ...allPaths,
          ...splitSegmentsAtTileBoundaries({
            path,
            tileWidth,
            tileHeight,
          }),
        ];
      },
      []
    )
    .map(path => {
      const { points, intersectsGrid } = path;
      return {
        ...path,
        points: intersectsGrid
          ? getTileSegmentFromPageSegment({
              points,
              tileWidth,
              tileHeight,
            })
          : points.map(([x, y]) => {
              return getTileCoordFromPageCoord({
                x,
                y,
                tileWidth,
                tileHeight,
              });
            }),
      };
    });

  return (
    <pattern
      id={id}
      width={tileWidth}
      height={tileHeight}
      patternUnits="userSpaceOnUse"
    >
      {tilePaths.map(({ points, intersectsGrid }, idx) => {
        // return (
        //   <g>
        //     {points.map(([x, y]) => {
        //       return <circle cx={x} cy={y} r={2} fill="black" />;
        //     })}
        //   </g>
        // );
        if (intersectsGrid) {
          return (
            <TilablePolyline
              strokeWidth={2}
              stroke="red"
              key={idx}
              fill="none"
              points={points}
              tileWidth={tileWidth}
              tileHeight={tileHeight}
            />
          );
        } else {
          return (
            <polyline
              strokeWidth={2}
              stroke="black"
              fill="none"
              key={idx}
              points={points
                .map(coords => coords.slice(0, 2).join(','))
                .join(' ')}
            />
          );
        }
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
        r={2}
        fill={mousePressed ? 'red' : 'rgba(0,0,0,0.2)'}
        tileWidth={tileWidth}
        tileHeight={tileHeight}
      />
    </pattern>
  );
};

type CanvasProps = {
  mousePageX: number,
  mousePageY: number,
  mousePressed: boolean,
  viewBoxHeight: number,
  viewBoxWidth: number,
  paths: Array<Path>,
};

const Canvas = (
  {
    mousePageX,
    mousePageY,
    mousePressed,
    viewBoxHeight,
    viewBoxWidth,
    paths,
  }: CanvasProps
) => {
  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}>
      <Tile
        id="patturnTile"
        tileWidth={200}
        tileHeight={200}
        mousePageX={mousePageX}
        mousePageY={mousePageY}
        mousePressed={mousePressed}
        // prettier-ignore
        paths={paths}
      />
      <rect
        width={viewBoxWidth}
        height={viewBoxHeight}
        fill="url(#patturnTile)"
      />
    </svg>
  );
};

type State = {
  mousePageX: number,
  mousePageY: number,
  mousePressed: boolean,
  paths: Array<Path>,
};

type Action =
  | {
      type: 'MOUSE_MOVED',
      payload: {
        pageX: number,
        pageY: number,
      },
    }
  | {
      type: 'MOUSE_PRESSED',
    }
  | {
      type: 'MOUSE_RELEASED',
    };

const defaultState: State = {
  mousePageX: 0,
  mousePageY: 0,
  mousePressed: false,
  paths: [],
};

const getReducer = () =>
  (state: State = defaultState, action: Action) => {
    if (action.type === 'MOUSE_MOVED') {
      const {
        pageX: mousePageX,
        pageY: mousePageY,
      } = action.payload;

      const { paths } = state;
      let updatedPaths;

      if (state.mousePressed) {
        updatedPaths = [
          ...paths.slice(0, paths.length - 1),
          {
            points: [
              ...paths[paths.length - 1].points,
              [mousePageX, mousePageY],
            ],
          },
        ];
      } else {
        updatedPaths = paths;
      }

      return {
        ...state,
        mousePageX,
        mousePageY,
        paths: updatedPaths,
      };
    }

    if (action.type === 'MOUSE_PRESSED') {
      return {
        ...state,
        mousePressed: true,
        paths: [
          ...state.paths,
          { points: [[state.mousePageX, state.mousePageY]] },
        ],
      };
    }

    if (action.type === 'MOUSE_RELEASED') {
      return {
        ...state,
        mousePressed: false,
      };
    }

    return state;
  };

const mapStateToProps = state => {
  return { state };
};

const mapDispatchToProps = dispatch => {
  return {
    handleMouseMove: (event: SyntheticMouseEvent) => {
      const { pageX, pageY } = event;
      dispatch({
        type: 'MOUSE_MOVED',
        payload: {
          pageX,
          pageY,
        },
      });
    },
    handleMouseDown: () => {
      dispatch({ type: 'MOUSE_PRESSED' });
    },

    handleMouseUp: () => {
      dispatch({ type: 'MOUSE_RELEASED' });
    },
  };
};

const withViewBoxDimensions = function<WrappedProps>(
  WrappedComponent: React.Component<*, WrappedProps, *>
) {
  type ProvidedProps = {
    viewBoxWidth: number,
    viewBoxHeight: number,
  };

  class ViewBoxProvider extends React.Component {
    props: $Diff<WrappedProps, ProvidedProps>;

    state: ProvidedProps = {
      viewBoxWidth: 0,
      viewBoxHeight: 0,
    };

    componentDidMount() {
      const element = ReactDOM.findDOMNode(this);

      if (!element || typeof element.getBoundingClientRect !== 'function') {
        return;
      }

      const { width, height } = element.getBoundingClientRect();
      this.setState((state: ProvidedProps) => {
        return {
          ...state,
          viewBoxWidth: width,
          viewBoxHeight: height,
        };
      });
    }

    render() {
      // $FlowFixMe
      return <WrappedComponent {...this.props} {...this.state} />;
    }
  }

  // $FlowFixMe
  return ViewBoxProvider;
};

type Props = {
  handleMouseMove: Function,
  handleMouseDown: Function,
  handleMouseUp: Function,
  state: State,
  viewBoxWidth: number,
  viewBoxHeight: number,
};

const PureApp = (
  {
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    state: {
      mousePageX,
      mousePageY,
      mousePressed,
      paths,
    },
    viewBoxWidth,
    viewBoxHeight,
  }: Props
) => {
  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <Canvas
        mousePageX={mousePageX}
        mousePageY={mousePageY}
        mousePressed={mousePressed}
        viewBoxWidth={viewBoxWidth}
        viewBoxHeight={viewBoxHeight}
        // paths={[
        //   //prettier-ignore
        //   {points: [
        //     [200 + 30, 10],
        //     [200 + 10, 10],
        //     [200 + -10, 10],
        //     [200 + -30, 10],
        //   ]},
        // ]}
        paths={paths}
      />
    </div>
  );
};

const App = compose(
  withInternalReducer(getReducer, mapStateToProps, mapDispatchToProps),
  withViewBoxDimensions
)(PureApp);

export default App;
