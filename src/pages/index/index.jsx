import React from 'react';
import { Tabs, Row, Col } from 'antd';
import Cointable from '../cointable/Cointable'
import { Button } from 'antd'
class HomeIndex extends React.Component {
  constructor(props){
    super(props)
    this.handleSee = this.handleSee.bind(this);
    this.state = {
      sp:0
    }
  }
  handleSee(){
    let index = document.getElementById("index-box")
    let btn = document.getElementById("btn")
    this.setState({
      sp:!this.state.sp
    })
    if(this.state.sp){
      index.style.height = "100%" 
      btn.innerHTML = "Hidden"
    }else{
      index.style.height = "740px"
      btn.innerHTML = "Click me to show all"
    }
  }
  render() {
    const { TabPane } = Tabs;
    return (
      <div style={{ marginLeft: 100 }}>
        <Row id="index-box" type='flex' justify='center' style={{ marginTop: 10, marginRight: 194, height: 740, overflow: "hidden", boxSizing: "border-box" }}>
          <Col span={24} >
            <Tabs type="card">
              <TabPane tab="Bitcoin" key="1">
                <Cointable type="BTC" />
              </TabPane>
              <TabPane tab="Ethereum" key="2">
                <Cointable type="ETH" />
              </TabPane>
              <TabPane tab="Litecoin" key="3">
                <Cointable type="LTC" />
              </TabPane>
            </Tabs>
          </Col>
        </Row>
        <div style={{ marginTop:50, padding: 10 }}>
          <Button id="btn" type="primary" danger onClick={this.handleSee}>Click me to show all</Button>
        </div>
      </div>
    )
  }
}

export default HomeIndex


