// @flow
import React from 'react';
import {View, Touchable, StyleSheet} from 'react-primitives';
import chroma from 'chroma-js';
import materialPalette from 'material-palette';
import {compose} from 'ramda';

import {cadence} from './theme';
import type {Component, Color} from './types';
import withInternalReducer from './withInternalReducer';

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
    // backgroundColor: 'rgba(255,255,255,0.9)',
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
    // height: cadence * 7 * 4 + cadence,
    maxHeight: cadence * 8 * 4,
    flexWrap: 'wrap',
  },
});

type ControlProps = {
  onPress?: () => void,
  icon: any,
  selected?: boolean,
};
const Control = (props: ControlProps) => {
  return (
    <Touchable onPress={props.onPress}>
      <View style={[styles.control, props.selected && styles.selected]}>
        <View style={props.disabled && styles.disabled}>
          {props.icon}
        </View>
      </View>
    </Touchable>
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

const STROKE_WIDTHS = [1, 2, 4, 8, 14];
type StrokeWidthDropdownProps = {
  strokeWidth: number,
};
const StrokeWidthDropdown = (props: StrokeWidthDropdownProps) => {
  return (
    <View style={styles.strokeWidthDropdown}>
      {STROKE_WIDTHS.map(strokeWidth => (
        <Control
          selected={strokeWidth === props.strokeWidth}
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
    const palette = materialPalette({h, s: s * 100, l: l * 100});
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

type ColorDropdownProps = {
  color: Color,
};
const ColorDropdown = (props: ColorDropdownProps) => {
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

const noop = () => {};

type State = {
  mode: 'default' | 'color' | 'strokeWidth',
};

const defaultState: State = {
  mode: 'default',
};

const getReducer = () =>
  (state: State = defaultState, action): State => {
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

    return state;
  };

const mapStateToProps = state => ({state});

type Handlers = {
  handleColorControlPressed: () => void,
  handleStrokeWidthControlPressed: () => void,
};

const mapDispatchToProps = (dispatch): Handlers => ({
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
});

type RequiredProps = {
  color: Color,
  strokeWidth: number,
};

type Props = RequiredProps & Handlers & {
  state: State,
};
const PureControls = (props: Props) => {
  const {
    color,
    strokeWidth,
    handleColorControlPressed,
    handleStrokeWidthControlPressed,
    state: {
      mode,
    },
  } = props;

  return (
    <View style={styles.controls}>
      <Control onPress={noop} icon="✏️" />
      <Control
        onPress={handleColorControlPressed}
        icon={<ColorIcon color={color} />}
      />
      <Control
        onPress={handleStrokeWidthControlPressed}
        icon={<StrokeWidthIcon strokeWidth={strokeWidth} />}
      />
      <Control onPress={noop} icon="↩️" />
      <Control onPress={noop} icon="↪️" />

      {mode !== 'default' && <View style={styles.controlsOverlay} />}

      {mode === 'strokeWidth' &&
        <StrokeWidthDropdown strokeWidth={strokeWidth} />}

      {mode === 'color' && <ColorDropdown color={color} />}
    </View>
  );
};
const Controls: Component<RequiredProps> = compose(
  withInternalReducer(getReducer, mapStateToProps, mapDispatchToProps),
)(PureControls);
export default Controls;
