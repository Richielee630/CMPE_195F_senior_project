import React from 'react';
import './Header.css'
import { Row, Col } from 'antd';
const Header = () => {
    return (
        <header className={'container header-flex'}>
            <div className="logo">
            <Row type="flex" justify="center">
                <Col span={12} style={{textAlign:'center'}}>
                    <span style={{fontSize:50 }}><b>Cryptocurrency data</b></span>
                </Col>
            </Row>
            </div>
            
        </header>
    );
};
export default Header;
