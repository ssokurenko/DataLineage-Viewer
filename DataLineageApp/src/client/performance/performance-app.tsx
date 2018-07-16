import * as React from "react";
import * as ReactDOM from "react-dom";
import * as io from "socket.io-client";
import { IPerformanceTestMessage, ITestResult } from "../../common/socket-io-messages";
import { LogOutput } from "../simulate/log-output";

interface IState {
    urlsStr: string;
    useCustomTestAddress: boolean;
    customTestAddress: string;
    testResults: IPerformanceTestMessage[];
    isTesting: boolean;
}

class App extends React.Component<any, IState> {
    private readonly _socket: SocketIOClient.Socket;

    constructor(props: any, context?: any) {
        super(props, context);
        this.state = {
            urlsStr: "https://nodes.iota.fm, https://iotanode.us:443",
            useCustomTestAddress: false,
            customTestAddress: "",
            testResults: [],
            isTesting: false
        };
        this._socket = io.connect();
        this._socket.on("PerformanceTest", this.onPerformanceTest.bind(this));
    }

    private onPerformanceTest(msg: IPerformanceTestMessage): void {
        this.setState({ testResults: this.state.testResults.concat([msg]) });
    }

    async onTestBtnClick() {
        if (this.state.isTesting) return;
        this.setState({ isTesting: true, testResults: [] });
        console.log("Checking urls...");
        const urlsStr: string = this.state.urlsStr;
        if (!urlsStr) {
            return;
        }
        const urls = urlsStr.split(",").map(u => u.trim()).filter(u => u);
        try {
            console.log("Submitting testing request");
            const result: ITestResult[] = await $.ajax(`/api/performance/test${this.state.useCustomTestAddress?`/${this.state.customTestAddress}`:""}`,
                {
                    method: "POST",
                    data: JSON.stringify({ urls: urls, socketClientId: this._socket.id }),
                    contentType: "application/json",
                    dataType: "json"
                });
            if (result) {
                const newResults: IPerformanceTestMessage[] = result.map(r => ({ message: "", testResult: r }));
                newResults.unshift({ message: "Testing finished" });
                this.setState({ testResults: newResults });
            }
        } catch (e) {
            console.error(e);
        }
        this.setState({isTesting: false});
    }

    onInputChanged(isUrl:boolean, e: React.ChangeEvent<HTMLInputElement>) {
        if (isUrl) {
            this.setState({ urlsStr: e.target.value });
        } else {
            this.setState({ customTestAddress: e.target.value });
        }
    }

    onCheckChanged(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ useCustomTestAddress: e.target.checked });
    }

    render() {
        return <div>
                   <div className="form-group">
                       <label>Test IOTA urls</label>
                       <div className="input-group">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fa-link"></i></div>
                           </div>
                           <input value={this.state.urlsStr} onChange={this.onInputChanged.bind(this, true)} type="text" className="form-control" placeholder="Input the url start with http(s) and seperated by ,"/>
                       </div>
                   </div>
                   <div className="form-group">
                       <label>Using address for testing&nbsp;
                           <input type="checkbox" onChange={this.onCheckChanged.bind(this)} checked={this.state.useCustomTestAddress} className=""/>
                       </label>
                       <div className="input-group">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fa-map-marker-alt"></i></div>
                           </div>
                           <input type="text" value={this.state.customTestAddress} onChange={this.onInputChanged.bind(this, false)} className="form-control" placeholder="CBVXWVGB9EJQYRRXNNTYEIGFVRFCLP9UUNCCGOARE9EJZXDFD9FDQZCQJNBCAMPRUESQSGYCMRJNOEWMV"/>
                       </div>
                   </div>
                   <div>
                       <button type="button" disabled={this.state.isTesting} className="btn btn-primary" onClick={this.onTestBtnClick.bind(this)}>
                           <i className={`fas ${this.state.isTesting ? "fa-sync-alt fa-spin" : "fa-signal"}`}></i>&nbsp;Test
                       </button>
                   </div>
                   <div className="row">
                       <div className="col-sm-12">
                           <LogOutput log={this.state.testResults.map(r=>`${r.message}${r.testResult?`${JSON.stringify(r.testResult, null, 4)}`:""}`)}/>
                       </div>
                   </div>
               </div>;
    }
}

ReactDOM.render(<App />, document.getElementById("testContainer"));
