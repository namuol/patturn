// @flow
import React from 'react';
import ReactDOM from 'react-dom';

import { compose } from 'ramda';
import withInternalReducer from './withInternalReducer';

const getTileCoordFromPageCoord = (
  {
    x,
    y,
    tileHeight,
    tileWidth,
  }
) => {
  return [
    x - Math.floor(x / tileWidth) * tileWidth,
    y - Math.floor(y / tileHeight) * tileHeight,
  ];
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

type Point = [number, number];
type Path = Array<Point>;
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

  const tilePaths = paths.map(points => {
    return points.map(([x, y]) => {
      return getTileCoordFromPageCoord({
        x,
        y,
        tileWidth,
        tileHeight,
      });
    });
  });

  return (
    <pattern
      id={id}
      width={tileWidth}
      height={tileHeight}
      patternUnits="userSpaceOnUse"
    >
      {tilePaths.map((points, idx) => {
        // return (
        //   <g>
        //     {points.map(([x, y]) => {
        //       return <circle cx={x} cy={y} r={2} fill="black" />;
        //     })}
        //   </g>
        // );
        return (
          <polyline
            stroke="black"
            fill="transparent"
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
        fill={mousePressed ? 'red' : 'blue'}
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
        tileWidth={100}
        tileHeight={100}
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
          [...paths[paths.length - 1], [mousePageX, mousePageY]],
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
        paths: [...state.paths, []],
      };
    }

    if (action.type === 'MOUSE_RELEASED') {
      const { paths } = state;
      const lastPath = paths[paths.length - 1];
      let updatedPaths;

      if (lastPath && lastPath.length === 0) {
        updatedPaths = paths.slice(0, paths.length - 1);
      } else {
        updatedPaths = paths;
      }

      return {
        ...state,
        mousePressed: false,
        paths: updatedPaths,
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
