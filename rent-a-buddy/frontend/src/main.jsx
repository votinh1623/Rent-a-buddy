import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { createStore } from 'redux'
import allReducers from './reducer'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux';
import "./index.css";


const store = createStore(allReducers);
ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)