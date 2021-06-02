import React from 'react';
import {Switch, Route} from 'react-router-dom'
import './App.css';
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Cointable from "../../pages/cointable/Cointable";
import Home from "../../pages/index/index";

function App() {
  return (
    <div className="App">
        <Header/>
        <Switch>
            <Home/>
            {/* <Cointable /> */}
            {/*<Route path={'/'} exact component={Home}/>*/}
            {/*<Route path={'/page/:numPage'} exact component={Home}/>*/}
            {/*<Route path={'/coins/:id'} component={Coin}/>*/}
            {/*<Route path={'*'} component={PageNotFound} />*/}
        </Switch>
        <Footer/>
    </div>
  );
}

export default App;
