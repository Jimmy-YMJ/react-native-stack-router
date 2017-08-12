import { Component } from 'react';
import checkWrapperUsage from './utils/checkWrapperUsage';
import reactMixin from 'react-mixin';
import timerMixin from 'react-timer-mixin';

class ComponentBase extends Component{
  constructor(props){
    super(props);
    checkWrapperUsage(this);
  }
}

export default reactMixin(ComponentBase.prototype, timerMixin);
