export default function (instance, props) {
  if(__DEV__ === true){
    setTimeout(() => {
      let componentName = instance.constructor.name;
      if((typeof instance._init === 'function' || typeof instance._clear === 'function') && props.__isWrapped !== true){
        console.warn(`${componentName}: _init or _clear is invalid if it is not wrapped by StackAwareWrapper`)
      }
      if(typeof instance._init === 'function' && typeof instance._clear !== 'function'){
        console.warn(`${componentName}: _init should be used with _clear`);
      }
    });
  }
}
