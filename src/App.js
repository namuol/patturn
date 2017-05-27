// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import {compose} from 'ramda';
import withInternalReducer from './withInternalReducer';

import splitSegmentsAtTileBoundaries from './splitSegmentsAtTileBoundaries';
import * as transforms from './wallpaperGroupTransforms';

import type {Path, Point, Provider, Component} from './types';

const getCoordShiftAmount = (value, size) => -Math.floor(value / size) * size;

const getTileCoordFromPageCoord = (
  {
    x,
    y,
    tileHeight,
    tileWidth,
  },
): Point => {
  return {
    x: x + getCoordShiftAmount(x, tileWidth),
    y: y + getCoordShiftAmount(y, tileHeight),
  };
};

const addToCoords = ({x: xDiff, y: yDiff}) =>
  ({x, y}) => {
    return {x: x + xDiff, y: y + yDiff};
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
  },
): Array<Point> => {
  const {x, y} = points[0];
  const xDiff = getCoordShiftAmount(x, tileWidth);
  const yDiff = getCoordShiftAmount(y, tileHeight);

  return points.map(addToCoords({x: xDiff, y: yDiff}));
};

const TileableCircle = (
  {
    cx,
    cy,
    fill,
    r,
    tileHeight,
    tileWidth,
  },
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

const round = (number, precision) => {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
};

const getPolylinePointsString = (points: Array<Point>) => {
  return points.map(({x, y}) => [round(x, 2), round(y, 2)].join(',')).join(' ');
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
  },
) => {
  return (
    <g>
      {[
        [0, 0],
        [0, tileHeight],
        [0, -tileHeight],
        [tileWidth, 0],
        [tileWidth, tileHeight],
        [tileWidth, -tileHeight],
        [-tileWidth, 0],
        [-tileWidth, tileHeight],
        [-tileWidth, -tileHeight],
      ].map(([xDiff, yDiff], idx) => {
        return (
          <polyline
            key={idx}
            {...props}
            points={getPolylinePointsString(
              points.map(addToCoords({x: xDiff, y: yDiff})),
            )}
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
  zoom: number,
  strokeWidth: number,
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
    zoom,
    strokeWidth,
  }: TileProps,
) => {
  const {x: tileMouseX, y: tileMouseY} = getTileCoordFromPageCoord({
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
      [],
    )
    .map(path => {
      const {points, intersectsGrid} = path;
      return {
        ...path,
        points: intersectsGrid
          ? getTileSegmentFromPageSegment({
              points,
              tileWidth,
              tileHeight,
            })
          : points.map(({x, y}) => {
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
      {tilePaths.map(({points, strokeWidth, intersectsGrid}, idx) => {
        if (intersectsGrid) {
          return (
            <TilablePolyline
              strokeWidth={strokeWidth}
              stroke="black"
              strokeLinecap="round"
              strokeLinejoin="round"
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
              strokeWidth={strokeWidth}
              stroke="black"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              key={idx}
              points={getPolylinePointsString(points)}
            />
          );
        }
      })}

      <TileableCircle
        cx={tileMouseX}
        cy={tileMouseY}
        r={strokeWidth / 2}
        fill={mousePressed ? 'red' : 'rgba(0,0,0,0.2)'}
        tileWidth={tileWidth}
        tileHeight={tileHeight}
      />
    </pattern>
  );
};

type CanvasProps = {
  tileWidth: number,
  tileHeight: number,
  viewBoxHeight: number,
  viewBoxWidth: number,
  zoom: number,
  paths: Array<Path>,
  mousePageX: number,
  mousePageY: number,
  mousePressed: boolean,
  strokeWidth: number,
};

const Canvas = (
  {
    mousePageX,
    mousePageY,
    mousePressed,
    viewBoxHeight,
    viewBoxWidth,
    tileWidth,
    tileHeight,
    paths,
    zoom,
    strokeWidth,
  }: CanvasProps,
) => {
  return (
    <svg viewBox={`0 0 ${viewBoxWidth / zoom} ${viewBoxHeight / zoom}`}>
      <Tile
        id="patturnTile"
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        mousePageX={mousePageX}
        mousePageY={mousePageY}
        mousePressed={mousePressed}
        paths={paths}
        zoom={zoom}
        strokeWidth={strokeWidth}
      />
      <rect
        width={viewBoxWidth / zoom}
        height={viewBoxHeight / zoom}
        fill="url(#patturnTile)"
      />
    </svg>
  );
};

type State = {
  mousePageX: number,
  mousePageY: number,
  strokeWidth: number,
  mousePressed: boolean,
  paths: Array<Path>,
  zoom: number,
  transformType: $Keys<typeof transforms>,
  sizingStrokeWidth: boolean,
  smoothFactor: number,
  mode: 'pen' | 'line',
};

const keyMap: {
  [key: string]: string,
} = {
  alt: 'TOGGLE_SIZING_STROKEWIDTH',
  l: 'SET_LINE_MODE',
  p: 'SET_PEN_MODE',
};

type MappedKey = $Keys<typeof keyMap>;

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
      payload?: {
        pageX: number,
        pageY: number,
      },
    }
  | {
      type: 'MOUSE_RELEASED',
    }
  | {type: 'ZOOMED', payload: {amount: number}}
  | {type: 'KEY_PRESSED', payload: MappedKey}
  | {type: 'KEY_RELEASED', payload: MappedKey};

const defaultState: State = {
  mousePageX: 0,
  mousePageY: 0,
  strokeWidth: 2,
  zoom: 1,
  mousePressed: false,
  paths: [],
  transformType: 'p3',
  sizingStrokeWidth: false,
  smoothFactor: 0.5,
  mode: 'line',
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const getReducer = () =>
  (state: State = defaultState, action: Action) => {
    if (action.type === 'MOUSE_MOVED') {
      const {paths, zoom} = state;
      const {
        pageX,
        pageY,
      } = action.payload;
      const mousePageX = pageX / zoom;
      const mousePageY = pageY / zoom;

      let updatedPaths;

      if (!state.mousePressed) {
        updatedPaths = paths;
      } else {
        if (state.mode === 'pen') {
          updatedPaths = [
            ...paths.slice(0, paths.length - 1),
            {
              ...paths[paths.length - 1],
              points: [
                ...paths[paths.length - 1].points,
                {x: mousePageX, y: mousePageY},
              ],
            },
          ];
        } else {
          // state.mode === 'line'
          updatedPaths = [
            ...paths.slice(0, paths.length - 1),
            {
              ...paths[paths.length - 1],
              points: [
                paths[paths.length - 1].points[0],
                {x: mousePageX, y: mousePageY},
              ],
            },
          ];
        }
      }

      return {
        ...state,
        mousePageX,
        mousePageY,
        paths: updatedPaths,
      };
    }

    if (action.type === 'MOUSE_PRESSED') {
      const {mousePageX, mousePageY, strokeWidth, smoothFactor} = state;
      const {pageX, pageY} = action.payload || {};
      return {
        ...state,
        mousePressed: true,
        paths: [
          ...state.paths,
          {
            points: [{x: pageX || mousePageX, y: pageY || mousePageY}],
            strokeWidth,
            smoothFactor,
          },
        ],
      };
    }

    if (action.type === 'MOUSE_RELEASED') {
      return {
        ...state,
        mousePressed: false,
      };
    }

    if (action.type === 'ZOOMED') {
      const {payload: {amount}} = action;

      if (state.sizingStrokeWidth) {
        const {strokeWidth} = state;
        return {
          ...state,
          strokeWidth: clamp(strokeWidth - amount * 0.1, 0.5, 20),
        };
      }

      const {zoom} = state;
      return {
        ...state,
        zoom: clamp(zoom - amount * (zoom * 0.002), 0.5, 10),
      };
    }

    if (action.type === 'KEY_PRESSED') {
      if (action.payload === 'TOGGLE_SIZING_STROKEWIDTH') {
        return {
          ...state,
          sizingStrokeWidth: true,
        };
      }

      if (action.payload === 'SET_PEN_MODE') {
        return {...state, mode: 'pen'};
      }

      if (action.payload === 'SET_LINE_MODE') {
        return {...state, mode: 'line'};
      }
    }

    if (action.type === 'KEY_RELEASED') {
      if (action.payload === 'TOGGLE_SIZING_STROKEWIDTH') {
        return {
          ...state,
          sizingStrokeWidth: false,
        };
      }
    }

    return state;
  };

const smoothPath = (path: Path) => {
  const {points, smoothFactor} = path;
  if (points.length <= 4 || smoothFactor === 0) {
    return path;
  }

  const smoothedPoints = points.reduce(
    (smoothPoints, p1, idx) => {
      if (idx === 0 || idx > points.length - 2) {
        return smoothPoints.concat({
          x: p1.x,
          y: p1.y,
        });
      }

      const p0 = smoothPoints[idx - 1];

      return smoothPoints.concat({
        x: p1.x * (1 - smoothFactor) + p0.x * smoothFactor,
        y: p1.y * (1 - smoothFactor) + p0.y * smoothFactor,
      });
    },
    [],
  );

  return {
    ...path,
    points: smoothedPoints,
  };
};

import simplify from 'simplify-js';

const mapStateToProps = (state: State): {state: State} => {
  const {paths, zoom} = state;

  const smoothedPaths = paths.map(smoothPath);

  const simplifyPath = ({points, ...rest}) =>
    points.length < 2
      ? {...rest, points} // simplify() chokes if we don't do this
      : {
          ...rest,
          points: simplify(points, 0.5 / zoom, false),
        };

  return {
    state: {
      ...state,
      paths: smoothedPaths.map(simplifyPath),
    },
  };
};

type AppHandlers = {
  handleTouchStart: (e: SyntheticTouchEvent) => void,
  handleTouchMove: (e: SyntheticTouchEvent) => void,
  handleTouchEnd: (e: SyntheticTouchEvent) => void,
  handleMouseDown: (e: SyntheticMouseEvent) => void,
  handleMouseMove: (e: SyntheticMouseEvent) => void,
  handleMouseUp: (e: SyntheticMouseEvent) => void,
  handleWheel: (e: SyntheticWheelEvent) => void,
  handleKeyDown: (e: SyntheticKeyboardEvent) => void,
  handleKeyUp: (e: SyntheticKeyboardEvent) => void,
};

const mapDispatchToProps = (dispatch): AppHandlers => {
  return {
    handleTouchMove: (event: SyntheticTouchEvent) => {
      event.preventDefault();

      const {changedTouches: [{pageX, pageY}]} = event;
      dispatch({
        type: 'MOUSE_MOVED',
        payload: {
          pageX,
          pageY,
        },
      });
    },
    handleTouchStart: (event: SyntheticTouchEvent) => {
      event.preventDefault();

      const {changedTouches: [{pageX, pageY}]} = event;
      dispatch({
        type: 'MOUSE_PRESSED',
        payload: {
          pageX,
          pageY,
        },
      });
    },
    handleTouchEnd: () => {
      event.preventDefault();
      dispatch({type: 'MOUSE_RELEASED'});
    },

    handleMouseMove: (event: SyntheticMouseEvent) => {
      event.preventDefault();
      const {pageX, pageY} = event;
      dispatch({
        type: 'MOUSE_MOVED',
        payload: {
          pageX,
          pageY,
        },
      });
    },
    handleMouseDown: () => {
      event.preventDefault();
      dispatch({type: 'MOUSE_PRESSED'});
    },
    handleMouseUp: () => {
      event.preventDefault();
      dispatch({type: 'MOUSE_RELEASED'});
    },

    handleWheel: (event: SyntheticWheelEvent) => {
      event.preventDefault();
      const {deltaY} = event;
      dispatch({
        type: 'ZOOMED',
        payload: {
          amount: deltaY,
        },
      });
    },

    handleKeyDown: (event: SyntheticKeyboardEvent) => {
      const key = keyMap[event.key.toLowerCase()];
      if (key !== undefined) {
        dispatch({
          type: 'KEY_PRESSED',
          payload: key,
        });
      }
    },

    handleKeyUp: (event: SyntheticKeyboardEvent) => {
      const key = keyMap[event.key.toLowerCase()];
      if (key !== undefined) {
        dispatch({
          type: 'KEY_RELEASED',
          payload: key,
        });
      }
    },
  };
};

type ViewBoxProps = {
  viewBoxWidth: number,
  viewBoxHeight: number,
};

import debounce from 'lodash.debounce';

const withViewBoxDimensions: Provider<ViewBoxProps> = <VBRP: Object>(
  WrappedComponent: Component<VBRP & ViewBoxProps>,
): Component<VBRP> => {
  class ViewBoxProvider extends React.Component {
    props: VBRP;
    state: ViewBoxProps = {
      viewBoxWidth: 0,
      viewBoxHeight: 0,
    };

    __setViewBoxDimensions = debounce(
      () => {
        const element = ReactDOM.findDOMNode(this);

        if (!element || typeof element.getBoundingClientRect !== 'function') {
          return;
        }

        const {
          width,
          height,
        }: {width: number, height: number} = element.getBoundingClientRect();
        this.setState((state: ViewBoxProps) => {
          return {
            ...state,
            viewBoxWidth: width,
            viewBoxHeight: height,
          };
        });
      },
      100,
    );

    componentDidMount() {
      window.addEventListener('resize', this.__setViewBoxDimensions);
      this.__setViewBoxDimensions();
    }

    componentWillUnmount() {
      window.removeEventListener('resize', this.__setViewBoxDimensions);
    }

    render() {
      const props = {...this.props, ...this.state};
      return <WrappedComponent {...props} />;
    }
  }

  return ViewBoxProvider;
};

type AppRequiredProps = {
  tileSize: number,
};

type Props = AppRequiredProps & AppHandlers & ViewBoxProps & {
  state: State,
};

class PureApp extends React.Component {
  props: Props;
  render() {
    const {
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseMove,
      handleMouseDown,
      handleMouseUp,
      handleWheel,
      handleKeyDown,
      handleKeyUp,
      tileSize,
      state: {
        mousePageX,
        mousePageY,
        mousePressed,
        paths,
        zoom,
        transformType,
        strokeWidth,
      },
      viewBoxWidth,
      viewBoxHeight,
    } = this.props;

    const transformBuilder = transforms[transformType];
    const {
      tileWidth,
      tileHeight,
    } = transformBuilder.getTileDimensions(tileSize);

    const transform = transforms[transformType](tileWidth, tileHeight);

    return (
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        tabIndex={1}
        style={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Canvas
          mousePageX={mousePageX}
          mousePageY={mousePageY}
          mousePressed={mousePressed}
          zoom={zoom}
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
          tileWidth={tileWidth}
          tileHeight={tileHeight}
          paths={transform(paths)}
          strokeWidth={strokeWidth}
        />
      </div>
    );
  }
}

const App: Component<AppRequiredProps> = compose(
  withInternalReducer(getReducer, mapStateToProps, mapDispatchToProps),
  withViewBoxDimensions,
)(PureApp);

export default App;
