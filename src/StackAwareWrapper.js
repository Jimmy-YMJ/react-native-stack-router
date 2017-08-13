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
      stackRouterPageStatus: PropTypes.object
    };
    static displayName = `StackAwareWrapper:${ComponentClass.displayName || ComponentClass.name || 'unknown'}`;

    /**
     * For none page component
     * **/
    static childContextTypes = {
      stackRouterPageStatus: PropTypes.object
    };

    constructor(props, context){
      super(props);
      this.componentEle = null;
      context.onPageSleep(this._clear);
      context.onPageWake(this._init);
      this.stackRouterPageStatus = {};
    }

    /**
     * For none page component
     * **/
    getChildContext() {
      return {
        stackRouterPageStatus: this.stackRouterPageStatus
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
      if(this._isComponentAvailable()){
        typeof this.componentEle._clearAllTimers === 'function' && this.componentEle._clearAllTimers();
        if(typeof this.componentEle._clear === 'function') return this.componentEle._clear();
      }
      return true;
    };

    componentDidMount(){
      if(this.props.isStackRouterPage){
        this.stackRouterPageStatus.didMount = true;
        return void 0;
      }
      if(this.context.stackRouterPageStatus.didMount){
        this._init();
      }
    }

    componentWillUnmount(){
      if(this.props.isStackRouterPage){
        this.stackRouterPageStatus.willUnmount = true;
        return void 0;
      }
      if(this.context.stackRouterPageStatus.willUnmount) return void 0;
      this._clear();
    }
    render(){
      return <ComponentClass ref={ ele => this.componentEle = ele } {...this.props} __isWrapped={true}/>;
    }
  }

  return StackAwareWrapper
};
