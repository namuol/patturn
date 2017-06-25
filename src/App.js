// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import {compose} from 'ramda';
import {connect} from 'react-redux';
import {pure} from 'recompose';

import Pinchable from 'react-tappable/lib/Pinchable';

import splitSegmentsAtTileBoundaries from './splitSegmentsAtTileBoundaries';
import * as transformConfigs from './wallpaperGroupTransforms';

import type {Path, Point, Provider, Component, Color, Tool} from './types';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

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

const round = (number, precision) => {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
};

const getPolylinePointsString = (points: Array<Point>) => {
  return points.map(({x, y}) => [round(x, 2), round(y, 2)].join(',')).join(' ');
};

const TilablePolyline = pure(({
  points,
  tileWidth,
  tileHeight,
  ...props
}: {
  points: Array<Point>,
  tileWidth: number,
  tileHeight: number,
}) => {
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
});

type TileProps = {
  id: string,
  paths: Array<Path>,
  tileHeight: number,
  tileWidth: number,
};
const Tile = pure(({
  id,
  paths,
  tileHeight,
  tileWidth,
}: TileProps) => {
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
      {tilePaths.map(({points, strokeWidth, color, intersectsGrid}, idx) => {
        if (intersectsGrid) {
          return (
            <TilablePolyline
              strokeWidth={strokeWidth}
              stroke={color}
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
              stroke={color}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              key={idx}
              points={getPolylinePointsString(points)}
            />
          );
        }
      })}
    </pattern>
  );
});

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
};

const Canvas = pure(({
  mousePageX,
  mousePageY,
  mousePressed,
  viewBoxHeight,
  viewBoxWidth,
  tileWidth,
  tileHeight,
  paths,
  zoom,
}: CanvasProps) => {
  return (
    <svg
      style={{
        transformOrigin: '0 0',
        transform: `translate3d(0,0,0) scale(${zoom * 2})`,
      }}
      viewBox={`0 0 ${viewBoxWidth / MIN_ZOOM} ${viewBoxHeight / MIN_ZOOM}`}
    >
      <Tile
        id="patturnTile"
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        mousePageX={mousePageX}
        mousePageY={mousePageY}
        mousePressed={mousePressed}
        paths={paths}
      />
      <rect
        width={viewBoxWidth / MIN_ZOOM}
        height={viewBoxHeight / MIN_ZOOM}
        fill="url(#patturnTile)"
      />
    </svg>
  );
});

type PathList = Array<Path>;

type State = {
  mousePageX: number,
  mousePageY: number,
  strokeWidth: number,
  mousePressed: boolean,
  paths: PathList,
  history: {
    past: Array<PathList>,
    future: Array<PathList>,
  },
  zoom: number,
  zoomWhenPinchStarted: number,
  pinching: boolean,
  transformType: $Keys<typeof transformConfigs>,
  sizingStrokeWidth: boolean,
  smoothFactor: number,
  color: Color,
  tool: 'pen' | 'line',
};

const keyMap: {
  [key: string]: string,
} = {
  l: 'SET_LINE_MODE',
  p: 'SET_PEN_MODE',
  z: 'UNDO',
  y: 'REDO',
};

type MappedKey = $Keys<typeof keyMap>;

export type Action =
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
  | {type: 'KEY_RELEASED', payload: MappedKey}
  | {type: 'OVERLAY_PRESSED'}
  | {type: 'TOOL_CONTROL_PRESSED'}
  | {type: 'COLOR_CONTROL_PRESSED'}
  | {type: 'STROKE_WIDTH_CONTROL_PRESSED'}
  | {type: 'COLOR_CHANGED', payload: Color}
  | {type: 'STROKE_WIDTH_CHANGED', payload: number}
  | {type: 'TOOL_CHANGED', payload: Tool}
  | {type: 'UNDO'}
  | {type: 'REDO'}
  | {type: 'UNDO_CONTROL_PRESSED'}
  | {type: 'REDO_CONTROL_PRESSED'}
  | {type: 'PINCH_STARTED'}
  | {type: 'PINCH_MOVED', payload: {zoomMultiple: number}}
  | {type: 'PINCH_ENDED'};

import {BASECOLORS} from './Controls';
const defaultState: State = {
  mousePageX: 0,
  mousePageY: 0,
  strokeWidth: 2,
  zoomWhenPinchStarted: 1,
  zoom: 1,
  mousePressed: false,
  pinching: false,
  paths: [],
  history: {
    past: [],
    future: [],
  },
  transformType: 'p3',
  sizingStrokeWidth: false,
  smoothFactor: 0.5,
  color: BASECOLORS[0],
  tool: 'line',
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const undo = (state: State) => {
  const {
    history: {
      past,
      future,
    },
  } = state;

  if (past.length === 0) {
    return {
      ...state,
    };
  }

  return {
    ...state,
    history: {
      past: past.slice(0, past.length - 1),
      future: [state.paths, ...future],
    },
    paths: past[past.length - 1],
  };
};

const redo = (state: State) => {
  const {
    history: {
      past,
      future,
    },
  } = state;

  if (future.length === 0) {
    return {
      ...state,
    };
  }

  return {
    ...state,
    history: {
      past: [...past, state.paths],
      future: future.slice(1),
    },
    paths: future[0],
  };
};

export const reducer = (state: State = defaultState, action: Action): State => {
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
      if (state.tool === 'pen') {
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
        // state.tool === 'line'
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
    if (state.mousePressed) {
      return state;
    }

    const {
      mousePageX,
      mousePageY,
      zoom,
      strokeWidth,
      smoothFactor,
      color,
      history,
    } = state;

    const {pageX, pageY} = action.payload || {};
    return {
      ...state,
      mousePressed: true,
      history: {
        ...history,
        past: [...history.past, state.paths],
      },
      paths: [
        ...state.paths,
        {
          points: [
            {x: pageX / zoom || mousePageX, y: pageY / zoom || mousePageY},
          ],
          strokeWidth,
          smoothFactor,
          color,
        },
      ],
    };
  }

  if (action.type === 'MOUSE_RELEASED') {
    if (!state.mousePressed) {
      return state;
    }

    return {
      ...state,
      mousePressed: false,
      history: {
        ...state.history,
        future: [],
      },
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
      zoom: clamp(zoom - amount * (zoom * 0.002), MIN_ZOOM, MAX_ZOOM),
    };
  }

  if (action.type === 'PINCH_STARTED') {
    const {
      paths,
      history,
      history: {
        past,
      },
    } = state;

    return {
      ...state,
      mousePressed: false,
      pinching: true,
      zoomWhenPinchStarted: state.zoom,
      paths: paths.slice(0, paths.length - 1),
      history: {
        ...history,
        past: past.slice(0, past.length - 1),
      },
    };
  }

  if (action.type === 'PINCH_MOVED') {
    const {payload: {zoomMultiple}} = action;

    return {
      ...state,
      zoom: clamp(state.zoomWhenPinchStarted * zoomMultiple, 0.5, 10),
    };
  }

  if (action.type === 'PINCH_ENDED') {
    return {
      ...state,
      pinching: false,
    };
  }

  if (action.type === 'KEY_PRESSED') {
    if (action.payload === 'SET_PEN_MODE') {
      return {...state, tool: 'pen'};
    }

    if (action.payload === 'SET_LINE_MODE') {
      return {...state, tool: 'line'};
    }

    if (action.payload === 'UNDO') {
      return undo(state);
    }

    if (action.payload === 'REDO') {
      return redo(state);
    }
  }

  if (action.type === 'TOOL_CHANGED') {
    return {
      ...state,
      tool: action.payload,
    };
  }

  if (action.type === 'COLOR_CHANGED') {
    return {
      ...state,
      color: action.payload,
    };
  }

  if (action.type === 'STROKE_WIDTH_CHANGED') {
    return {
      ...state,
      strokeWidth: action.payload,
    };
  }

  if (action.type === 'UNDO_CONTROL_PRESSED') {
    return undo(state);
  }

  if (action.type === 'REDO_CONTROL_PRESSED') {
    return redo(state);
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
import {createSelector} from 'reselect';

type AppStateMappedProps = {
  state: State,
  canUndo: boolean,
  canRedo: boolean,
};

const getLODSnappedZoom = (state: State) => 1;

const getSmoothedPaths = ({paths}: State) => paths.map(smoothPath);

const getSimplifiedPaths = createSelector(
  getSmoothedPaths,
  getLODSnappedZoom,
  (smoothedPaths, zoom) => {
    const simplifyPath = ({points, ...rest}) => {
      if (points.length < 2) {
        // simplify() chokes if we don't do this:
        return {...rest, points};
      }

      const simplifiedPoints: Array<Point> = simplify(
        points,
        0.5 / zoom,
        false,
      );

      return {
        ...rest,
        points: simplifiedPoints,
      };
    };

    return smoothedPaths.map(simplifyPath);
  },
);

//
// TODO: Snap to a hexagonal grid (or whatever the current lattice type is):
//
// const snapPoint = ({x, y, ...rest}) => ({
//   x: Math.round(x / 10) * 10,
//   y: Math.round(y / 10) * 10,
//   ...rest,
// });
//
// const snapPath = path => ({
//   ...path,
//   points: path.points.map(snapPoint),
// });
//
// const getSnappedPaths = createSelector(
//   ({paths}) => paths,
//   paths => paths.map(snapPath),
// );
//

const mapStateToProps = (state: State): AppStateMappedProps => {
  const canUndo = state.history.past.length > 0;
  const canRedo = state.history.future.length > 0;

  return {
    state: {
      ...state,
      paths: getSimplifiedPaths(state),
    },
    canUndo,
    canRedo,
  };
};

export type Dispatcher = (Action) => void;

type AppHandlers = {
  dispatch: Dispatcher,
  handleTouchStart: (e: SyntheticTouchEvent) => void,
  handleTouchMove: (e: SyntheticTouchEvent) => void,
  handleTouchEnd: (e: SyntheticTouchEvent) => void,
  handleMouseDown: (e: SyntheticMouseEvent) => void,
  handleMouseMove: (e: SyntheticMouseEvent) => void,
  handleMouseUp: (e: SyntheticMouseEvent) => void,
  handleWheel: (e: SyntheticWheelEvent) => void,
  handleKeyDown: (e: SyntheticKeyboardEvent) => void,
  handleKeyUp: (e: SyntheticKeyboardEvent) => void,
  handleToolChanged: (tool: Tool) => void,
  handleColorChanged: (color: Color) => void,
  handleStrokeWidthChanged: (strokeWidth: number) => void,
  handlePinchStart: (e: Object) => void,
  handlePinchMove: (e: {zoom: number}) => void,
  handlePinchEnd: (e: Object) => void,
};

const mapDispatchToProps = (dispatch: Dispatcher): AppHandlers => {
  return {
    dispatch,
    handleTouchMove: (event: SyntheticTouchEvent) => {
      event.preventDefault();

      const {
        changedTouches: [{pageX, pageY}],
      }: {
        changedTouches: [{pageX: number, pageY: number}],
      } = event;
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

      const {
        changedTouches: [{pageX, pageY}],
      }: {
        changedTouches: [{pageX: number, pageY: number}],
      } = event;
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

    handleToolChanged: tool => {
      dispatch({
        type: 'TOOL_CHANGED',
        payload: tool,
      });
    },
    handleColorChanged: color => {
      dispatch({
        type: 'COLOR_CHANGED',
        payload: color,
      });
    },
    handleStrokeWidthChanged: strokeWidth => {
      dispatch({
        type: 'STROKE_WIDTH_CHANGED',
        payload: strokeWidth,
      });
    },
    handlePinchStart: () => {
      dispatch({
        type: 'PINCH_STARTED',
      });
    },
    handlePinchMove: ({zoom}) => {
      dispatch({
        type: 'PINCH_MOVED',
        payload: {zoomMultiple: zoom},
      });
    },
    handlePinchEnd: () => {
      dispatch({
        type: 'PINCH_ENDED',
      });
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

    __setViewBoxDimensions: () => void = debounce(
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
      addEventListener('resize', this.__setViewBoxDimensions);
      this.__setViewBoxDimensions();
    }

    componentWillUnmount() {
      removeEventListener('resize', this.__setViewBoxDimensions);
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

type Props = AppRequiredProps & AppHandlers & ViewBoxProps & AppStateMappedProps;

import Controls from './Controls';

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
      handleColorChanged,
      handleStrokeWidthChanged,
      handlePinchStart,
      handlePinchMove,
      handlePinchEnd,
      tileSize,
      dispatch,
      state: {
        mousePageX,
        mousePageY,
        mousePressed,
        paths,
        zoom,
        transformType,
        tool,
        strokeWidth,
        color,
      },
      canUndo,
      canRedo,
      viewBoxWidth,
      viewBoxHeight,
    } = this.props;

    const {
      createTransformer,
      getTileDimensions,
    } = transformConfigs[transformType];
    const {
      tileWidth,
      tileHeight,
    } = getTileDimensions(tileSize);

    const transform = createTransformer(tileWidth, tileHeight);

    return (
      <div
        style={{
          height: '100%',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Pinchable
          onKeyDown={false}
          onKeyUp={false}
          onTouchStart={false}
          onTouchMove={false}
          onTouchEnd={false}
          onMouseDown={false}
          onMouseUp={false}
          onMouseMove={false}
          onMouseOut={false}
          onPinchStart={handlePinchStart}
          onPinchMove={handlePinchMove}
          onPinchEnd={handlePinchEnd}
        >
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
        </Pinchable>
        {!mousePressed &&
          <Controls
            tool={tool}
            color={color}
            strokeWidth={strokeWidth}
            dispatch={dispatch}
            onColorChanged={handleColorChanged}
            onStrokeWidthChanged={handleStrokeWidthChanged}
            canUndo={canUndo}
            canRedo={canRedo}
          />}
      </div>
    );
  }
}

const App: Component<AppRequiredProps> = compose(
  withViewBoxDimensions,
  connect(mapStateToProps, mapDispatchToProps),
)(PureApp);

export default App;
