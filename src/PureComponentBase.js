import { PureComponent } from 'react';
import checkWrapperUsage from './utils/checkWrapperUsage';
import reactMixin from 'react-mixin';
import timerMixin from 'react-timer-mixin';

class PureComponentBase extends PureComponent{
  constructor(props){
    super(props);
    checkWrapperUsage(this);
  }
}

export default reactMixin(PureComponentBase.prototype, timerMixin);
