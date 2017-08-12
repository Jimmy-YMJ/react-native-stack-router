import { Component } from 'react';
import checkWrapperUsage from './utils/checkWrapperUsage';
import reactMixin from 'react-mixin';
import timerMixin from 'react-timer-mixin';

export default class ComponentBase extends Component{
  constructor(props){
    super(props);
    checkWrapperUsage(this);
  }
}

reactMixin(ComponentBase.prototype, timerMixin);
