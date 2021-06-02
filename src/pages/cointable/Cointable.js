import React, {Component} from 'react';
import './Cointtable.css'
import Coinmy from "../coinmy/Coinmy";

class Cointable extends Component {
    state = {
        bnbexchange_ist: ['ftx_spot','bitcoin_com'],
        exchange_ist: ['ftx_us','ftx_spot','hitbtc','bitcoin_com','bitbox','tokenize','bitfinex','bitstamp','gdax','gemini'],
        exchange_ist_name: ['FTX.US','Bitfinex','Bitstamp','Gdax,','Gemini'],
        isLoading: true
    };
    componentDidMount() {}
    render() {
        const {exchange_ist,bnbexchange_ist} = this.state;
        const { type } = this.props
        return (
            <div className={'container'}>
                <div className="current-coin-info-wrap">
                    <div className="current-coin-info">
                        <table className="table-my-class">
                            <tbody>
                            <tr>
                                <th >company name</th>
                                <th>price</th>
                                <th>volume</th>
                                <th>volume%</th>
                                <th>price trend</th>
                            </tr>
                            {
                                type === 'BNB'? bnbexchange_ist.map((coin, numCoin) => {
                                    return (
                                        <Coinmy exchanges_name={coin} key={numCoin} type={type}></Coinmy>
                                    )
                                }):
                                exchange_ist.map((coin, numCoin) => {
                                    return (
                                        <Coinmy exchanges_name={coin} key={numCoin} type={type}></Coinmy>
                                    )
                                })
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}
export default Cointable;
