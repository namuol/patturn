// @flow
export type Point = {
  x: number,
  y: number,
};
export type Color = string;
export type Path = {
  points: Array<Point>,
  strokeWidth: number,
  smoothFactor: number,
  intersectsGrid?: boolean,
  color: Color,
};

export type FunctionComponent<A> = (props: A) => ?React$Element<any>;
export type ClassComponent<D, A, S> = Class<React$Component<D, A, S>>;
export type Component<A> = FunctionComponent<A> | ClassComponent<any, A, any>;

export type Provider<ProvidedProps: Object> = <RequiredProps: Object>(
  Component<ProvidedProps & RequiredProps>,
) => Component<RequiredProps>;
