import React, { Component } from 'react';
import { Animated, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import deepEqual from 'deep-equal';

export default class Page extends Component{
  constructor(props){
    super(props);
    this.state = {
      pointerEvents: 'auto'
    };
    this._pageSlpet = false;
    this._pageSleepCallbacks = [];
    this._pageWakeCallbacks = [];
  }

  shouldComponentUpdate(nextProps, nextState){
    return !(
      this.props.pageConfig.component === nextProps.pageConfig.component &&
      deepEqual(this.props.pageProps, nextProps.pageProps) &&
        deepEqual(this.state, nextState)
    );
  }

  getChildContext() {
    return {
      onPageSleep: this._onPageSleep,
      onPageWake: this._onPageWake
    };
  }

  setPointerEvents(pointerEvents){
    this.setState({ pointerEvents: pointerEvents });
  }

  sleepPage(){
    if(this._pageSlpet) return void 0;
    this._pageSleepCallbacks = this._pageSleepCallbacks.filter(cb => cb() !== false );
    this._pageSlpet = true;
  }

  wakeUpPage(){
    if(!this._pageSlpet) return void 0;
    this._pageWakeCallbacks = this._pageWakeCallbacks.filter(cb => cb() !== false );
    this._pageSlpet = false;
  }

  _onPageSleep = cb => {
    this._pageSleepCallbacks.push(cb);
  };

  _onPageWake = cb => {
    this._pageWakeCallbacks.push(cb);
  };

  render(){
    let values = this.props.animationValues;
    let animationStyle = {
      transform: [{translateX: values.translateX}, {translateY:values.translateY}],
      opacity: values.opacity
    };
    return (
      <Animated.View
        style={[styles.container, animationStyle, { bottom: this.props.bottom }]}
        pointerEvents={this.state.pointerEvents}
      >
        {React.createElement(this.props.pageConfig.component, this.props.pageProps)}
      </Animated.View>
    );
  }
};

Page.propTypes = {
  bottom: PropTypes.number.isRequired,
  pageConfig: PropTypes.object,
  pageProps: PropTypes.any,
  animationValues: PropTypes.shape({
    translateX: PropTypes.instanceOf(Animated.Value),
    translateY: PropTypes.instanceOf(Animated.Value),
    opacity: PropTypes.instanceOf(Animated.Value)
  })
};

Page.childContextTypes = {
  onPageSleep: PropTypes.func.isRequired,
  onPageWake: PropTypes.func.isRequired
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
    left: 0,
    top: 0,
    right: 0,
    backgroundColor: 'white'
  }
});
