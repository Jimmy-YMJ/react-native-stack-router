import { PureComponent } from 'react';
import checkWrapperUsage from './utils/checkWrapperUsage';
import reactMixin from 'react-mixin';
import timerMixin from 'react-timer-mixin';

export default class PureComponentBase extends PureComponent{
  constructor(props){
    super(props);
    checkWrapperUsage(this);
  }
}

reactMixin(PureComponentBase.prototype, timerMixin);
