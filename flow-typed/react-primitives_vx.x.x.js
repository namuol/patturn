type StyleSheetConfig<T> = {
  [key: $Keys<T>]: Object,
};
type StyleSheet<T> = {
  [key: $Keys<T>]: Object,
};

declare module 'react-primitives' {
  declare module.exports: {
    View: any,
    Touchable: any,
    StyleSheet: {
      create: <T> (StyleSheetConfig<T>) => StyleSheet<T>,
    },
  };
}
