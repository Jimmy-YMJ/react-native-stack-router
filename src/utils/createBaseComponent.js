const GLOBAL = typeof window === 'undefined' ? global : window;
const TIMER_TYPES = {
  TIMEOUT: 'TIMEOUT',
  INTERVAL: 'INTERVAL',
  IMMEDIATE: 'IMMEDIATE',
  ANIMATION_FRAME: 'ANIMATION_FRAME'
};


export default function (Component) {
  return class ComponentBase extends Component {
    static TIMER_TYPES = TIMER_TYPES;
    constructor(props) {
      super(props);
      this._intervalTimers = [];
      this._timeoutTimers = [];
      this._immediateTimers = [];
      this._animationFrameTimers = [];
      if(__DEV__ === true){
        setTimeout(() => {
          let componentName = this.constructor.name;
          if((typeof this._init === 'function' || typeof this._clear === 'function') && props.__isWrapped !== true){
            console.warn(`${componentName}: _init or _clear is invalid if it is not wrapped by StackAwareWrapper`)
          }
          if(typeof this._init === 'function' && typeof this._clear !== 'function'){
            console.warn(`${componentName}: _init should be used with _clear`);
          }
        });
      }
    }

    setTimeout(func, duration){
      let timer = GLOBAL.setTimeout(func, duration);
      this._timeoutTimers.push(timer);
      return timer;
    }

    clearTimeout(timerId){
      return GLOBAL.clearTimeout(timerId);
    }

    setImmediate(func){
      let timer = GLOBAL.setImmediate(func);
      this._immediateTimers.push(timer);
      return timer;
    }

    clearImmediate(timerId){
      return GLOBAL.clearImmediate(timerId);
    }

    setInterval(func, duration){
      let timer = GLOBAL.setInterval(func, duration);
      this._intervalTimers.push(timer);
      return timer;
    }

    clearInterval(timerId){
      return GLOBAL.clearInterval(timerId);
    }

    requestAnimationFrame(func){
      let timerId = GLOBAL.requestAnimationFrame(func);
      this._animationFrameTimers.push(timerId);
      return timerId;
    }

    cancelAnimationFrame(timerId){
      return GLOBAL.cancelAnimationFrame(timerId);
    }

    clearAllTimers(){
      this._clearAllTimers.apply(this, arguments);
    }

    _clearAllTimers(timerTypes){
      (Array.isArray(timerTypes) ? timerTypes : Object.keys(TIMER_TYPES)).forEach(timerType => {
        switch (timerType){
          case TIMER_TYPES.INTERVAL:
            this._intervalTimers.forEach(timerId => GLOBAL.clearInterval(timerId));
            break;
          case TIMER_TYPES.TIMEOUT:
            this._timeoutTimers.forEach(timerId => GLOBAL.clearTimeout(timerId));
            break;
          case TIMER_TYPES.IMMEDIATE:
            this._immediateTimers.forEach(timerId => GLOBAL.clearImmediate(timerId));
            break;
          case TIMER_TYPES.ANIMATION_FRAME:
            this._animationFrameTimers.forEach(timerId => GLOBAL.cancelAnimationFrame(timerId));
            break;
        }
      });
    }
  }
}
