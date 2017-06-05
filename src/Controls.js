// @flow
import React from 'react';
import {View, Touchable, StyleSheet} from 'react-primitives';
import chroma from 'chroma-js';
import materialPalette from 'material-palette';
import {compose} from 'ramda';

import {cadence} from './theme';
import type {Component, Color, Tool} from './types';
import withInternalReducer from './withInternalReducer';

const noop: (*) => * = () => {};

const styles = StyleSheet.create({
  control: {
    boxSizing: 'border-box',
    width: cadence * 6,
    height: cadence * 6,
    margin: cadence / 2,
    backgroundColor: 'white',
    borderColor: '#ddd',
    borderWidth: 2,
    borderRadius: cadence / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    borderColor: '#000',
  },
  disabled: {
    opacity: 0.25,
  },
  controls: {
    // backgroundColor: 'rgba(255,255,255,0.9)',
    padding: cadence / 2,
    borderRadius: cadence / 2,
    position: 'absolute',
    left: 0,
    top: 0,
    flexDirection: 'row',
  },
  controlsFullScreen: {
    width: '100%',
    height: '100%',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  colorIcon: {
    width: cadence * 3,
    height: cadence * 3,
    borderRadius: cadence / 2,
    borderColor: '#222',
    borderWidth: 1,
  },
  strokeWidthIcon: {
    backgroundColor: 'black',
    borderRadius: '50%',
  },
  strokeWidthDropdown: {
    position: 'absolute',
    top: 0,
    left: cadence * 7 * 2,
    padding: cadence / 2,
    borderRadius: cadence / 2,
  },
  colorDropdown: {
    position: 'absolute',
    top: cadence * 7,
    left: 0,
    padding: cadence / 2,
    maxHeight: cadence * 8 * 4,
    flexWrap: 'wrap',
  },
  toolDropdown: {
    position: 'absolute',
    top: 0,
    left: 0,
    padding: cadence / 2,
    borderRadius: cadence / 2,
  },
});

const stop = fn =>
  e => {
    e && e.preventDefault && e.preventDefault();
    e && e.stopPropagation && e.stopPropagation();
    fn && fn(e);
  };

type ControlProps = {
  onPress?: (*) => void,
  icon: any,
  selected?: boolean,
  disabled?: boolean,
};
const Control = (props: ControlProps) => {
  return (
    <Touchable onPressIn={props.disabled ? noop : stop(props.onPress)}>
      <View style={[styles.control, props.selected && styles.selected]}>
        <View style={props.disabled && styles.disabled}>
          {props.icon}
        </View>
      </View>
    </Touchable>
  );
};
const getToolDropdownHandler = onChange => // $FlowFixMe
  !onChange ? noop : tool => () => onChange(tool);
const TOOLS = {
  pen: {
    icon: '🖋',
  },
  line: {
    icon: '📉',
  },
};
type ToolDropdownProps = {
  tool: Tool,
  onChange?: (tool: Tool) => *,
};
const ToolDropdown = (props: ToolDropdownProps) => {
  const {onChange} = props;
  return (
    <View style={styles.toolDropdown}>
      {Object.keys(TOOLS).map(tool => (
        <Control
          key={tool}
          selected={tool === props.tool}
          onPress={getToolDropdownHandler(onChange)(tool)}
          icon={TOOLS[tool].icon}
        />
      ))}
    </View>
  );
};
type StrokeWidthIconProps = {
  strokeWidth: number,
};
const StrokeWidthIcon = (props: StrokeWidthIconProps) => {
  const {strokeWidth} = props;
  return (
    <View
      style={[
        styles.strokeWidthIcon,
        {
          width: strokeWidth * 2,
          height: strokeWidth * 2,
        },
      ]}
    />
  );
};
const getStrokeWidthChangeHandler = onChange => // $FlowFixMe
  !onChange ? noop : strokeWidth => () => onChange(strokeWidth);
const STROKE_WIDTHS = [1, 2, 4, 8, 14];
type StrokeWidthDropdownProps = {
  strokeWidth: number,
  onChange?: (strokeWidth: number) => *,
};
const StrokeWidthDropdown = (props: StrokeWidthDropdownProps) => {
  const {onChange} = props;
  return (
    <View style={styles.strokeWidthDropdown}>
      {STROKE_WIDTHS.map(strokeWidth => (
        <Control
          key={'strokeWidth:' + strokeWidth}
          selected={strokeWidth === props.strokeWidth}
          onPress={getStrokeWidthChangeHandler(onChange)(strokeWidth)}
          icon={<StrokeWidthIcon strokeWidth={strokeWidth} />}
        />
      ))}
    </View>
  );
};
type ColorIconProps = {
  color: Color,
};
const ColorIcon = (props: ColorIconProps) => (
  <View
    style={[
      styles.colorIcon,
      {
        backgroundColor: props.color,
      },
    ]}
  />
);
export const BASECOLORS = [
  '#000000',
  '#ffffff',
  '#607D8d',
  '#795548',
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#00BCD4',
  '#03A9F4',
  '#2196F3',
  '#3F51B5',
  '#CDDC39',
  '#8BC34A',
  '#4CAF50',
  '#009688',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
];
const SHADE_OVERRIDES = {
  '#ffffff': ['#ffffff', '#E0E0E0', '#9E9E9E', '#000000'],
  '#000000': ['#ffffff', '#E0E0E0', '#9E9E9E', '#000000'],
};
const SHADEKEYS = ['100', '300', '500', '900'];
const SHADES = BASECOLORS.reduce(
  (shades, baseColor) => {
    // $FlowFixMe
    const overriddenShades = SHADE_OVERRIDES[baseColor];
    if (overriddenShades) {
      return {
        ...shades,
        [baseColor]: overriddenShades,
      };
    }
    let [h, s, l] = chroma(baseColor).hsl();
    if (!h) {
      h = 0;
    }
    const palette = materialPalette({
      h,
      s: s * 100,
      l: l * 100,
    });
    palette['500'] = baseColor;
    return {
      ...shades,
      [baseColor]: SHADEKEYS.map(key => palette[key])
        .filter(v => {
          if (typeof v === 'string') {
            return true;
          }
          return typeof h === 'number' &&
            typeof s === 'number' &&
            typeof l === 'number';
        })
        .reduce(
          (results, v) => {
            if (typeof v === 'string') {
              return results.concat(v);
            }
            const {h, s, l} = v;
            return results.concat(chroma.hsl(h, s / 100, l / 100).hex());
          },
          [],
        ),
    };
  },
  {},
);
const SHADESMAP = Object.keys(SHADES).reduce(
  (shadeMap, baseColor) => {
    return {
      ...shadeMap,
      [baseColor]: baseColor,
      ...SHADES[baseColor].reduce(
        (baseColorShadeMap, shade) => ({
          ...baseColorShadeMap,
          [shade]: baseColor,
        }),
        {},
      ),
    };
  },
  {},
);
const getSelectedBaseColor = (color: Color) => {
  if (BASECOLORS.includes(color)) {
    return color;
  }
  return SHADESMAP[color];
};
const getColorChangedHandler = onChange => // $FlowFixMe
  !onChange ? noop : color => () => onChange(color);
type ColorDropdownProps = {
  color: Color,
  onChange?: (color: Color) => any,
};
const ColorDropdown = (props: ColorDropdownProps) => {
  const {onChange} = props;
  const selectedBaseColor = getSelectedBaseColor(props.color);
  let selectedShadeIndex = 3;
  const shades = SHADES[selectedBaseColor].map((shade, idx) => {
    const selected = shade === props.color;
    if (selected) {
      selectedShadeIndex = idx;
    }
    return (
      <Control
        key={shade}
        onPress={getColorChangedHandler(onChange)(shade)}
        selected={selected}
        icon={<ColorIcon color={shade} />}
      />
    );
  });
  return (
    <View style={styles.colorDropdown}>
      {BASECOLORS.map((baseColor, idx) => (
        <Control
          key={baseColor}
          onPress={getColorChangedHandler(onChange)(baseColor)}
          selected={baseColor === selectedBaseColor}
          icon={
            <ColorIcon
              color={
                idx < 2 || BASECOLORS.indexOf(props.color) < 2
                  ? baseColor
                  : SHADES[baseColor][selectedShadeIndex]
              }
            />
          }
        />
      ))}

      <View
        style={{
          width: cadence,
          height: cadence * 7 * 4,
        }}
      />

      {shades}
    </View>
  );
};
type RequiredProps = {
  color: Color,
  strokeWidth: number,
  tool: Tool,
  onToolChanged?: (tool: Tool) => *,
  onStrokeWidthChanged?: (strokeWidth: number) => *,
  onColorChanged?: (color: Color) => *,
  dispatch?: (*) => *,
  canUndo: boolean,
  canRedo: boolean,
};
type State = {
  mode: 'default' | 'tool' | 'color' | 'strokeWidth',
};
const defaultState: State = {
  mode: 'default',
};
const getReducer = () =>
  (state: State = defaultState, action): State => {
    if (action.type === 'TOOL_CONTROL_PRESSED') {
      return {
        ...state,
        mode: 'tool',
      };
    }
    if (action.type === 'COLOR_CONTROL_PRESSED') {
      return {
        ...state,
        mode: 'color',
      };
    }
    if (action.type === 'STROKE_WIDTH_CONTROL_PRESSED') {
      return {
        ...state,
        mode: 'strokeWidth',
      };
    }
    if (
      action.type === 'OVERLAY_PRESSED' ||
      action.type === 'TOOL_CHANGED' ||
      action.type === 'COLOR_CHANGED' ||
      action.type === 'STROKE_WIDTH_CHANGED'
    ) {
      return {
        ...state,
        mode: 'default',
      };
    }
    return state;
  };
const mapStateToProps = state => ({
  state,
});
type Handlers = {
  handleColorControlPressed: () => void,
  handleStrokeWidthControlPressed: () => void,
  handleOverlayPressed: () => void,
  handleToolControlPressed: (tool: Tool) => void,
  handleToolChanged: (tool: Tool) => void,
  handleStrokeWidthChanged: (strokeWidth: number) => void,
  handleColorChanged: (color: Color) => void,
  handleUndoControlPressed: () => void,
  handleRedoControlPressed: () => void,
};
const mapDispatchToProps = (dispatch, ownProps: RequiredProps): Handlers => {
  if (ownProps.dispatch) {
    const externalDispatch = ownProps.dispatch;
    const internalDispatch = dispatch;
    dispatch = (...args) => {
      internalDispatch(...args);
      externalDispatch(...args);
    };
  }
  return {
    handleToolControlPressed: () => {
      dispatch({
        type: 'TOOL_CONTROL_PRESSED',
      });
    },
    handleColorControlPressed: () => {
      dispatch({
        type: 'COLOR_CONTROL_PRESSED',
      });
    },
    handleStrokeWidthControlPressed: () => {
      dispatch({
        type: 'STROKE_WIDTH_CONTROL_PRESSED',
      });
    },
    handleOverlayPressed: () => {
      dispatch({
        type: 'OVERLAY_PRESSED',
      });
    },
    handleToolChanged: tool => {
      dispatch({
        type: 'TOOL_CHANGED',
        payload: tool,
      });
      ownProps.onToolChanged && ownProps.onToolChanged(tool);
    },
    handleStrokeWidthChanged: strokeWidth => {
      dispatch({
        type: 'STROKE_WIDTH_CHANGED',
        payload: strokeWidth,
      });
      ownProps.onStrokeWidthChanged &&
        ownProps.onStrokeWidthChanged(strokeWidth);
    },
    handleColorChanged: color => {
      dispatch({
        type: 'COLOR_CHANGED',
        payload: color,
      });
      ownProps.onColorChanged && ownProps.onColorChanged(color);
    },
    handleUndoControlPressed: () => {
      dispatch({
        type: 'UNDO_CONTROL_PRESSED',
      });
    },
    handleRedoControlPressed: () => {
      dispatch({
        type: 'REDO_CONTROL_PRESSED',
      });
    },
  };
};
type Props = RequiredProps & Handlers & {
  state: State,
};
const PureControls = (props: Props) => {
  const {
    color,
    strokeWidth,
    tool,
    handleToolControlPressed,
    handleColorControlPressed,
    handleStrokeWidthControlPressed,
    handleOverlayPressed,
    handleToolChanged,
    handleStrokeWidthChanged,
    handleColorChanged,
    handleUndoControlPressed,
    handleRedoControlPressed,
    state: {
      mode,
    },
    canUndo,
    canRedo,
  } = props;
  const overlayVisible = mode !== 'default';
  return (
    <View
      style={[styles.controls, overlayVisible && styles.controlsFullScreen]}
    >
      <Control onPress={handleToolControlPressed} icon={TOOLS[tool].icon} />
      <Control
        onPress={handleColorControlPressed}
        icon={<ColorIcon color={color} />}
      />
      <Control
        onPress={handleStrokeWidthControlPressed}
        icon={<StrokeWidthIcon strokeWidth={strokeWidth} />}
      />
      <Control
        onPress={handleUndoControlPressed}
        icon="↩️"
        disabled={!canUndo}
      />
      <Control
        onPress={handleRedoControlPressed}
        icon="↪️"
        disabled={!canRedo}
      />

      {mode !== 'default' &&
        <Touchable onPress={handleOverlayPressed}>
          <View style={styles.controlsOverlay} />
        </Touchable>}

      {mode === 'tool' &&
        <ToolDropdown onChange={handleToolChanged} tool={tool} />}

      {mode === 'strokeWidth' &&
        <StrokeWidthDropdown
          onChange={handleStrokeWidthChanged}
          strokeWidth={strokeWidth}
        />}

      {mode === 'color' &&
        <ColorDropdown onChange={handleColorChanged} color={color} />}
    </View>
  );
};
const Controls: Component<RequiredProps> = compose(
  withInternalReducer(getReducer, mapStateToProps, mapDispatchToProps),
)(PureControls);
export default Controls;
