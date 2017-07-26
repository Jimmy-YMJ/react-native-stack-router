import { Component } from 'react';

export default class ElementRefUtil extends Component{
  constructor(props){
    super(props);
    typeof props.eleRef === 'function' && props.eleRef(this);
  }
}
