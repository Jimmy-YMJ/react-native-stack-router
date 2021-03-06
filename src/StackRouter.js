import React, { Component } from 'react';
import { Animated, I18nManager, Easing, Dimensions, StyleSheet, View, PanResponder } from 'react-native';
import Page from './Page';
import PropTypes from 'prop-types';

const emptyFunc = () => {};
const window = Dimensions.get('window');

/**
 * The gesture distance threshold to trigger the back behavior. For instance,
 * `1/2` means that moving greater than 1/2 of the width of the screen will
 * trigger a back action
 */
const POSITION_THRESHOLD = window.width / 2;

/**
 * The threshold (in pixels) to start the gesture action.
 */
const RESPOND_THRESHOLD = 20;

/**
 * The distance of touch start from the edge of the screen where the gesture will be recognized
 */
const GESTURE_RESPONSE_DISTANCE_HORIZONTAL = 25;
const GESTURE_RESPONSE_DISTANCE_VERTICAL = 135;

export default class StackRouter extends Component {
  static propTypes = {
    refreshSame: PropTypes.bool,
    animationDuration: PropTypes.number.isRequired,
    defaultPage: PropTypes.shape({
      config: PropTypes.shape({
        component: PropTypes.any
      }).isRequired,
      props: PropTypes.object
    }).isRequired,
    footer: PropTypes.shape({
      component: PropTypes.func.isRequired,
      props: PropTypes.any
    }),
    footerHeight: PropTypes.number
  };

  static defaultProps = {
    refreshSame: false,
    animationDuration: 300,
    footer: null,
    footerHeight: 45
  };

  static childContextTypes = {
    pushPage: PropTypes.func.isRequired,
    popPage: PropTypes.func.isRequired,
    removeSleptPage: PropTypes.func.isRequired
  };

  constructor(props){
    super(props);
    this.footer = null;
    this._gestureStartValue = 0;

    this._rootPageCache = [];

    // tracks if a touch is currently happening
    this._isResponding = false;

    this.state = {
      pageStack: [this._createPageSpec(props.defaultPage.config, props.defaultPage.props)]
    };

    this._createPanHandler();
  }

  getChildContext() {
    return {
      pushPage: this._pushPage,
      popPage: this._popPage,
      removeSleptPage: this._removeSleptPage
    };
  }

  _findRootSpec = (pageConfig) => {
    let i = 0, len = this._rootPageCache.length, config;
    for(; i < len; i ++){
      config = this._rootPageCache[i].config;
      if(config.id === pageConfig.id){
        return this._rootPageCache.splice(i, 1)[0];
      }
    }
  };

  _checkLoop = (pageConfig) => {
    let stack = this.state.pageStack.slice();
    if(!pageConfig.id) return stack;
    let i = 0, len = stack.length;
    for(; i < len; i ++){
      if(stack[i].config.id === pageConfig.id){
        return stack.slice(0, i);
      }
    }
    return stack;
  };

  _createPageSpec(pageConfig, pageProps){
    if(pageConfig.isRoot){
      let spec = this._findRootSpec(pageConfig);
      if(spec){
        spec.props = pageProps;
        spec.animationValues.translateX.setValue(0);
        spec.animationValues.translateY.setValue(0);
        spec.animationValues.opacity.setValue(1);
        return spec;
      }
    }
    return {
      timestamp: Date.now(),
      ref: null,
      config: pageConfig,
      props: pageProps,
      animationValues: {
        translateX: new Animated.Value(pageConfig.isRoot ? 0 : window.width),
        translateY: new Animated.Value(0),
        opacity: new Animated.Value(1)
      }
    };
  }

  _shouldDisplayFooter(pageSpec){
    return !!this.props.footer && (
        (pageSpec.config.isRoot === true && pageSpec.config.showFooter !== false) ||
        (!pageSpec.config.isRoot !== true && pageSpec.config.showFooter === true)
      );
  }

  _createPage(pageSpec){
    return <Page bottom={this._shouldDisplayFooter(pageSpec) ? this.props.footerHeight : 0} key={pageSpec.timestamp} animationValues={pageSpec.animationValues} pageConfig={pageSpec.config} pageProps={pageSpec.props} ref={ele => {pageSpec.ref = ele}}/>;
  }

  _pushPage = (pageConfig, pageProps, cb) => {
    if(this._isResponding) return this._getStackLength();
    this._isResponding = true;
    if(typeof pageProps === 'function'){
      cb = pageProps;
      pageProps = {};
    }else{
      cb = typeof cb === 'function' ? cb : emptyFunc;
    }
    let stack = this.state.pageStack;
    // Disable the prev page
    if(pageConfig.isRoot){
      if(__DEV__ && !pageConfig.id){
        console.warn('root component must have an id');
      }
      let currentPage = this._getCurrentPage();
      if(currentPage.config.isRoot && currentPage.config.id === pageConfig.id){
        this._isResponding = false;
        return 1;
      }
      // Disable and sleep all pages
      this.state.pageStack.forEach(page => {
        page.ref && page.ref.setPointerEvents('none');
        page.ref && page.ref.sleepPage();
      });
      let prevRoot = this._getRootPage();
      if(prevRoot){
        prevRoot.ref && prevRoot.animationValues.translateX.setValue(window.width);
        this._rootPageCache.push(prevRoot);
      }
      stack = [this._createPageSpec(pageConfig, pageProps)];
    }else{
      let prevPage = this._getCurrentPage();
      prevPage.ref && prevPage.ref.setPointerEvents('none');
      prevPage.ref && prevPage.ref.sleepPage();
      stack = this._checkLoop(pageConfig);
      stack.push(this._createPageSpec(pageConfig, pageProps));
    }

    this.setState({ pageStack: stack }, () => {
      let currPage = this._getCurrentPage();
      if(this._isRootPage()) {
        currPage.ref && currPage.ref.setPointerEvents('auto');
        currPage.ref && currPage.ref.wakeUpPage();
        cb(this._getStackLength());
        this._isResponding = false;
        this.footer && typeof this.footer.setCurrentPage === 'function' && this.footer.setCurrentPage(this._getRootPage().config.id);
        return 1;
      }
      let currAnimation = this._currentAnimation();
      if(currPage.config.animation === false){
        currAnimation.translateX.setValue(0);
        let currPage = this._getCurrentPage();
        currPage.ref && currPage.ref.setPointerEvents('auto');
        currPage.ref && currPage.ref.wakeUpPage();
        cb(this._getStackLength());
        this._isResponding = false;
      }else{
        Animated.timing(currAnimation.translateX, {
          toValue: 0,
          duration: this.props.animationDuration,
          easing: Easing.linear(),
          useNativeDriver: true
        }).start(() => {
          let currPage = this._getCurrentPage();
          currPage.ref && currPage.ref.setPointerEvents('auto');
          currPage.ref && currPage.ref.wakeUpPage();
          cb(this._getStackLength());
          this._isResponding = false;
        });
      }
    });
    return stack.length;
  };

  _getStackLength = () => {
    return this.state.pageStack.length;
  };

  _removeSleptPage = (index) => {
    if(index < 1) return false;
    let stack = this.state.pageStack.slice();
    stack.splice(index, 1);
    this.setState({ pageStack: stack });
    return true;
  };

  /**
   * Should prevent pop when prev pop is uncompleted
   */
  _popPage = (duration, cb) => {
    if(this._isResponding) return this._isRootPage() ? 0 : this._getStackLength();
    this._isResponding = true;
    if(typeof duration === 'function'){
      cb = duration;
      duration = this.props.animationDuration;
    }else{
      cb = typeof cb === 'function' ? cb : emptyFunc;
    }
    duration = duration || this.props.animationDuration;
    let stack = this.state.pageStack,
      stackLen = stack.length;
    if(stackLen <= 1){
      this._isResponding = false;
      return this._isRootPage() ? 0 : 1;
    }
    let currentPage = this._getCurrentPage();
    currentPage.ref && currentPage.ref.setPointerEvents('none');
    currentPage.ref && currentPage.ref.sleepPage();
    let currAnimation = this._currentAnimation();
    if(currentPage.config.animation = false){
      currAnimation.translateX.setValue(window.width);
      this.setState({ pageStack: this.state.pageStack.slice(0, -1)}, () => {
        let currPage = this._getCurrentPage();
        currPage && currPage.ref && currPage.ref.setPointerEvents('auto');
        currPage && currPage.ref && currPage.ref.wakeUpPage();
        cb(this._getStackLength());
      });
      this._isResponding = false;
    }else {
      Animated.timing(currAnimation.translateX, {
        toValue: window.width,
        duration: duration,
        easing: Easing.linear(),
        useNativeDriver: true
      }).start(() => {
        this.setState({ pageStack: this.state.pageStack.slice(0, -1)}, () => {
          let currPage = this._getCurrentPage();
          currPage && currPage.ref && currPage.ref.setPointerEvents('auto');
          currPage && currPage.ref && currPage.ref.wakeUpPage();
          cb(this._getStackLength());
        });
        this._isResponding = false;
      });
    }
    return stackLen - 1;
  };

  _resetPage(duration) {
    let currAnimation = this._currentAnimation();
    Animated.timing(currAnimation.translateX, {
      toValue: 0,
      duration: duration,
      easing: Easing.linear(),
      useNativeDriver: true
    }).start(() => {
      this._gestureStartValue = 0;
    });
  }

  _getCurrentPage(){
    return this.state.pageStack[this.state.pageStack.length - 1];
  }

  _getNextPage(){
    return this.state.pageStack[this.state.pageStack.length - 2];
  }

  _getRootPage(){
    return this.state.pageStack[0];
  }

  _isRootPage(){
    return this.state.pageStack.length === 1;
  }

  _currentAnimation(){
    return this._getCurrentPage().animationValues;
  }

  _createPanHandler(){
    const isVertical = false;
    this._panResponder = PanResponder.create({
      onPanResponderTerminate: () => {
        this._isResponding = false;
        this._resetPage();
      },
      onPanResponderGrant: () => {
        let currAnimation = this._currentAnimation();
        (isVertical ? currAnimation.translateY : currAnimation.translateX).stopAnimation(() => {
          this._isResponding = true;
        });
      },
      onMoveShouldSetPanResponder: (event, gesture) => {
        if(this._isRootPage() || this._isResponding || this._getCurrentPage().config.animation === false) return false;
        const currentDragDistance = gesture[isVertical ? 'dy' : 'dx'];
        const currentDragPosition = event.nativeEvent[isVertical ? 'pageY' : 'pageX'];
        const axisLength = isVertical ? window.height : window.width;
        const axisHasBeenMeasured = !!axisLength;

        // Measure the distance from the touch to the edge of the screen
        const screenEdgeDistance = currentDragPosition - currentDragDistance;
        // Compare to the gesture distance relavant to card or modal
        const gestureResponseDistance = isVertical ? GESTURE_RESPONSE_DISTANCE_VERTICAL : GESTURE_RESPONSE_DISTANCE_HORIZONTAL;
        // GESTURE_RESPONSE_DISTANCE is about 25 or 30. Or 135 for modals
        if (screenEdgeDistance > gestureResponseDistance) {
          // Reject touches that started in the middle of the screen
          return false;
        }

        const hasDraggedEnough = Math.abs(currentDragDistance) > RESPOND_THRESHOLD;

        return hasDraggedEnough && axisHasBeenMeasured;
      },
      onPanResponderMove: (event, gesture) => {
        const startValue = this._gestureStartValue;
        const axis = isVertical ? 'dy' : 'dx';
        const currentValue = I18nManager.isRTL && axis === 'dx' ? gesture[axis] - startValue: startValue + gesture[axis];
        let currAnimation = this._currentAnimation();
        isVertical ? (currAnimation.translateY.setValue(currentValue)) : (currAnimation.translateX.setValue(currentValue));
      },
      onPanResponderTerminationRequest: () =>
        // Returning false will prevent other views from becoming responder while
        // the navigation view is the responder (mid-gesture)
        false,
      onPanResponderRelease: (event, gesture) => {
        if (!this._isResponding) {
          return;
        }
        this._isResponding = false;

        // Calculate animate duration according to gesture speed and moved distance
        const axisDistance = isVertical ? window.height : window.width;
        const movedDistance = gesture[isVertical ? 'moveY' : 'moveX'];
        const defaultVelocity = axisDistance / this.props.animationDuration;
        const gestureVelocity = gesture[isVertical ? 'vy' : 'vx'];
        const velocity = Math.max(gestureVelocity, defaultVelocity);
        const resetDuration = movedDistance / velocity;
        const goBackDuration = (axisDistance - movedDistance) / velocity;

        // To asyncronously get the current animated value, we need to run stopAnimation:
        let currAnimation = this._currentAnimation();
        (isVertical ? currAnimation.translateY : currAnimation.translateX).stopAnimation(value => {
          // If the speed of the gesture release is significant, use that as the indication
          // of intent
          if (gestureVelocity < -0.5) {
            this._resetPage(resetDuration);
            return;
          }
          if (gestureVelocity > 0.5) {
            this._popPage(goBackDuration);
            return;
          }

          // Then filter based on the distance the screen was moved. Over a third of the way swiped,
          // and the back will happen.
          if (value <= POSITION_THRESHOLD) {
            this._resetPage(resetDuration);
          } else {
            this._popPage(goBackDuration);
          }
        });
      }
    });
  }

  render() {
    let footer = this.props.footer;
    return (
      <View style={styles.container} {...this._panResponder.panHandlers}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: this.props.footerHeight }}>
          {footer && React.createElement(footer.component, Object.assign({}, footer.props || {}, { ref: ref => this.footer = ref }))}
        </View>
        {this._rootPageCache.concat(this.state.pageStack).map(pageSpec => this._createPage(pageSpec))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  }
});
