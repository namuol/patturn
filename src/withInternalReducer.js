// @flow
import React, {Component} from 'react';

type Action = *;

type Reducer<State> = (state?: State, action: Action) => State;
type ReducerFactory<State, InputProps> = (props: InputProps) => Reducer<State>;

type StateMapper<State, Props> = (state: State) => Props;
type Dispatcher = (action: Action) => void;
type DispatchMapper<Props> = (dispatch: Dispatcher) => Props;

const withInternalReducer = <InputProps: Object, State, Props: Object>(
  getReducer: ReducerFactory<State, InputProps>,
  mapStateToProps: StateMapper<State, Props>,
  mapDispatchToProps: DispatchMapper<Props>
) =>
  (WrappedComponent: Component<*, Props, *>) => {
    return class extends React.Component {
      props: InputProps;

      state: State = getReducer(this.props)(undefined, {
        type: '@@INIT',
      });

      dispatch: Dispatcher = (action: Action) => {
        this.setState((state: State, props: InputProps) => {
          return getReducer(props)(state, action);
        });
      };

      render() {
        const props = {
          ...mapStateToProps(this.state),
          ...mapDispatchToProps(this.dispatch),
        };

        // $FlowFixMe
        return <WrappedComponent {...props} />;
      }
    };
  };

export default withInternalReducer;
