import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default function (ComponentClass) {
  class StackAwareWrapper extends Component{
    static contextTypes = {
      onPageSleep: PropTypes.func.isRequired,
      onPageWake: PropTypes.func.isRequired,
      /**
       * Used by none page component
       * **/
      stackRouterPageMounted: PropTypes.bool,
      stackRouterPageWillUnmount: PropTypes.bool
    };
    static displayName = `StackAwareWrapper:${ComponentClass.displayName || ComponentClass.name || 'unknown'}`;

    /**
     * For none page component
     * **/
    static childContextTypes = {
      stackRouterPageMounted: PropTypes.bool,
      stackRouterPageWillUnmount: PropTypes.bool
    };

    constructor(props, context){
      super(props);
      this.componentEle = null;
      context.onPageSleep(this._clear);
      context.onPageWake(this._init);
    }

    /**
     * For none page component
     * **/
    getChildContext() {
      return {
        stackRouterPageMounted: this.stackRouterPageMounted === true,
        stackRouterPageWillUnmount: this.stackRouterPageWillUnmount === true
      };
    }

    _isComponentAvailable = () => {
      return this.componentEle;
    };

    _init = () => {
      if(this._isComponentAvailable() && typeof this.componentEle._init === 'function'){
        return this.componentEle._init();
      }
      return true;
    };

    _clear = () => {
      if(this._isComponentAvailable() && typeof this.componentEle._clear === 'function'){
        return this.componentEle._clear();
      }
      return true;
    };

    componentDidMount(){
      if(this.props.isStackRouterPage){
        this.stackRouterPageMounted = true;
        return void 0;
      }
      if(this.context.stackRouterPageMounted){
        this._init();
      }
    }

    componentWillUnmount(){
      if(this.props.isStackRouterPage){
        this.stackRouterPageWillUnmount = true;
        return void 0;
      }
      if(this.context.stackRouterPageWillUnmount) return void 0;
      this._clear();
    }
    render(){
      return <ComponentClass ref={ ele => this.componentEle = ele } {...this.props} __isWrapped={true}/>;
    }
  }

  return StackAwareWrapper
};
