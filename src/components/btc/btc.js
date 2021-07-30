import React from "react";

class BTC extends React.Component {
    componentDidMount() {
        var script = document.createElement("script")
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js"
        script.innerHTML = `{
			"interval": "1m",
			"width": 325,
			"isTransparent": true,
			"height": 450,
			"symbol": "COINBASE:BTCUSD",
			"showIntervalTabs": true,
			"locale": "en",
			"colorTheme": "light"
		}`
        document.getElementById("box").appendChild(script);
        
    }
    render() {
        return (
            <div>
                <div className="tradingview-widget-container" id="box">
                    <div className="tradingview-widget-container__widget"></div>
                    <div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/symbols/BTCUSD/technicals/" rel="noopener" target="_blank"><span class="blue-text">Technical Analysis for BTCUSD</span></a> by TradingView</div>
                </div>
            </div>
        );
    }
}


export default BTC