// @flow
import React from 'react';

type Action = *;

type Reducer<State> = (state?: State, action: Action) => State;
type ReducerFactory<State> = <RequiredProps: Object>(
  props: RequiredProps,
) => Reducer<State>;

type StateMapper<State, StateMappedProps: Object> = (
  state: State,
  ownProps: *,
) => StateMappedProps;
type Dispatcher = (action: Action) => void;
type DispatchMapper<DispatchMappedProps: Object> = (
  dispatch: Dispatcher,
  ownProps: *,
) => DispatchMappedProps;

import type {Component, Provider} from './types';

const withInternalReducer = <S, SMP: Object, DMP: Object>(
  getReducer: ReducerFactory<S>,
  mapStateToProps: StateMapper<S, SMP>,
  mapDispatchToProps: DispatchMapper<DMP>,
): Provider<SMP & DMP> =>
  <RP: Object>(WrappedComponent: Component<SMP & DMP & RP>): Component<RP> => {
    class WithInternalReducer extends React.Component {
      props: RP;

      state = getReducer(this.props)(undefined, {
        type: '@@INIT',
      });

      dispatch = (action: Action) => {
        this.setState((state: S, props: RP) => {
          return getReducer(props)(state, action);
        });
      };

      render() {
        const props = {
          ...this.props,
          ...mapStateToProps(this.state, this.props),
          ...mapDispatchToProps(this.dispatch, this.props),
        };
        return <WrappedComponent {...props} />;
      }
    }

    return WithInternalReducer;
  };

export default withInternalReducer;
