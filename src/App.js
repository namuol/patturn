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

const getPolylinePointsString = (points: Array<Point>) => {
  return points.map(({x, y}) => [x, y].join(',')).join(' ');
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
      {tilePaths.map(({points, intersectsGrid}, idx) => {
        if (intersectsGrid) {
          return (
            <TilablePolyline
              strokeWidth={2}
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
              strokeWidth={2}
              stroke="black"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              key={idx}
              points={points.map(({x, y}) => [x, y].join(',')).join(' ')}
            />
          );
        }
      })}

      <TileableCircle
        cx={0}
        cy={0}
        r={3 / zoom}
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
  }: CanvasProps,
) => {
  let simplifiedPaths = paths;
  // const simplifyPath = ({points, ...rest}) => ({
  //   ...rest,
  //   points: simplify(points, 0.5 / zoom, true),
  // });
  //
  // if (mousePressed) {
  //   simplifiedPaths = paths
  //     .slice(0, -1)
  //     .map(simplifyPath)
  //     .concat(paths.slice(-1));
  // } else {
  //   simplifiedPaths = paths.map(simplifyPath);
  // }

  return (
    <svg viewBox={`0 0 ${viewBoxWidth / zoom} ${viewBoxHeight / zoom}`}>
      <Tile
        id="patturnTile"
        tileWidth={tileWidth}
        tileHeight={tileHeight}
        mousePageX={mousePageX}
        mousePageY={mousePageY}
        mousePressed={mousePressed}
        paths={simplifiedPaths}
        zoom={zoom}
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
  mousePressed: boolean,
  paths: Array<Path>,
  zoom: number,
  transformType: $Keys<typeof transforms>,
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
    }
  | {type: 'ZOOMED', payload: {amount: number}};

const defaultState: State = {
  mousePageX: 0,
  mousePageY: 0,
  zoom: 1,
  mousePressed: false,
  paths: [],
  transformType: 'p3',
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

      if (state.mousePressed) {
        updatedPaths = [
          ...paths.slice(0, paths.length - 1),
          {
            points: [
              ...paths[paths.length - 1].points,
              {x: mousePageX, y: mousePageY},
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
      const {mousePageX, mousePageY} = state;
      return {
        ...state,
        mousePressed: true,
        paths: [...state.paths, {points: [{x: mousePageX, y: mousePageY}]}],
      };
    }

    if (action.type === 'MOUSE_RELEASED') {
      return {
        ...state,
        mousePressed: false,
      };
    }

    if (action.type === 'ZOOMED') {
      const {zoom} = state;
      const {payload: {amount}} = action;
      return {
        ...state,
        zoom: clamp(zoom - amount * (zoom * 0.002), 0.5, 10),
      };
    }

    return state;
  };

const mapStateToProps = (state: State): {state: State} => {
  return {state};
};

type AppHandlers = {
  handleMouseMove: (e: SyntheticMouseEvent) => void,
  handleMouseDown: (e: SyntheticMouseEvent) => void,
  handleMouseUp: (e: SyntheticMouseEvent) => void,
  handleWheel: (e: SyntheticWheelEvent) => void,
};

const mapDispatchToProps = (dispatch): AppHandlers => {
  return {
    handleMouseMove: (event: SyntheticMouseEvent) => {
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
      dispatch({type: 'MOUSE_PRESSED'});
    },

    handleMouseUp: () => {
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
  };
};

type ViewBoxProps = {
  viewBoxWidth: number,
  viewBoxHeight: number,
};

const withViewBoxDimensions: Provider<ViewBoxProps> = <VBRP: Object>(
  WrappedComponent: Component<VBRP & ViewBoxProps>,
): Component<VBRP> => {
  class ViewBoxProvider extends React.Component {
    props: VBRP;
    state: ViewBoxProps = {
      viewBoxWidth: 0,
      viewBoxHeight: 0,
    };

    componentDidMount() {
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
      handleMouseMove,
      handleMouseDown,
      handleMouseUp,
      handleWheel,
      tileSize,
      state: {
        mousePageX,
        mousePageY,
        mousePressed,
        paths,
        zoom,
        transformType,
      },
      viewBoxWidth,
      viewBoxHeight,
    } = this.props;
    const tileWidth = tileSize * Math.sqrt(3);
    const tileHeight = tileSize * 3;

    const transform = transforms[transformType](tileWidth, tileHeight);

    return (
      <div
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
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
