import React from 'react';
import {Switch, Route} from 'react-router-dom'
import './App.css';
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
// import Cointable from "../../pages/cointable/Cointable";
import Home from "../../pages/index/index";
// import ETH from "../../components/eth/eth";
import Login from "../../components/Login/Login";
import Signup from "../../components/Signup/Signup";
import Personal from "../../components/personal/personal";
function App() {
  let my = document.cookie
  if(my){
    let username = my.split("=")[1]
    localStorage.setItem("username",username)
  }else{
    localStorage.setItem("username","")
  }
  return (
    <div className="App">
        <Header/>
        <Switch>
            {/* <Home/> */}
            {/* <Cointable /> */}
            <Route path={'/'} exact component={Home}/>
            <Route path={'/personal'} exact component={Personal}/>
            <Route path={'/login'} exact component={Login} />
            <Route path={'/signup'} exact component={Signup} />
            {/*<Route path={'/page/:numPage'} exact component={Home}/>*/}
            {/*<Route path={'/coins/:id'} component={Coin}/>*/}
            {/*<Route path={'*'} component={PageNotFound} />*/}
        </Switch>
        <Footer/>
    </div>
  );
}

export default App;
