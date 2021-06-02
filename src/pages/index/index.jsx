import React, { Component } from 'react';
import { Tabs, Row, Col } from 'antd';
import Cointable from '../cointable/Cointable'
class HomeIndex extends Component {
  render() {
    const { TabPane } = Tabs;
    return (
      <div style={{marginLeft: 194}}>
        <Row type='flex' justify='center' style={{marginTop: 10,marginRight:194}}>  
          <Col span={20} >
            <Tabs type="card">
              <TabPane tab="Bitcoin" key="1">
                <Cointable type="BTC"/>5
              </TabPane>
              <TabPane tab="Ethereum" key="2">
                <Cointable type="ETH"/>
              </TabPane>
              <TabPane tab="Litecoin" key="3">
                <Cointable type="LTC"/>
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </div>
    )
  }
}

export default HomeIndex


