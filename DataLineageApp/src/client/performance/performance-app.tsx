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
    newIotaProviders: string;
    password?: string;
    isTesting: boolean;
    isSubmitting: boolean;
}

enum InputFor {
    Urls,
    TestAddress,
    NewProviders,
    Password
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
            newIotaProviders: "",
            isTesting: false,
            isSubmitting: false
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

    async onSubmitBtnClick() {
        if (this.state.isSubmitting || !this.state.password||!this.state.newIotaProviders) return;
        const providers = this.state.newIotaProviders.split(",").map(p => p.trim()).filter(p => p);
        if (providers.length <= 0) {
            return;
        }
        this.setState({ isSubmitting: true });
        try {
            const result = await $.ajax("/api/performance/config/iotaProviders",
                {
                    method: "POST",
                    data: JSON.stringify({ iota: providers, password: this.state.password }),
                    contentType: "application/json",
                    dataType: "json"
                });
            if (result) {
                alert(`Server iota config is changed to ${JSON.stringify(result)}`);
            }
        } catch (e) {
            alert(`failed to change server iota config with error ${e}`);
            console.error(e);
        }
        this.setState({ isSubmitting: false });
    }

    onInputChanged(forField: InputFor, e: React.ChangeEvent<HTMLInputElement>) {
        switch (forField) {
            case InputFor.Urls:
                this.setState({ urlsStr: e.target.value });
                return;
            case InputFor.TestAddress:
                this.setState({ customTestAddress: e.target.value });
                return;
            case InputFor.NewProviders:
                this.setState({ newIotaProviders: e.target.value });
                return;
            case InputFor.Password:
                this.setState({ password: e.target.value });
                return;
            
        default:
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
                           <input value={this.state.urlsStr} onChange={this.onInputChanged.bind(this, InputFor.Urls)} type="text" className="form-control" placeholder="Input the url start with http(s) and seperated by ,"/>
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
                           <input type="text" value={this.state.customTestAddress} onChange={this.onInputChanged.bind(this, InputFor.TestAddress)} className="form-control" placeholder="CBVXWVGB9EJQYRRXNNTYEIGFVRFCLP9UUNCCGOARE9EJZXDFD9FDQZCQJNBCAMPRUESQSGYCMRJNOEWMV"/>
                       </div>
                   </div>
                   <div>
                       <button type="button" disabled={this.state.isTesting} className="btn btn-primary" onClick={this.onTestBtnClick.bind(this)}>
                           <i className={`fas ${this.state.isTesting ? "fa-sync-alt fa-spin" : "fa-signal"}`}></i>&nbsp;Test
                       </button>
                   </div>
                   <div className="form-group">
                       <label>Change IOTA providers to</label>
                       <div className="input-group">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fa-link"></i></div>
                           </div>
                           <input value={this.state.newIotaProviders} onChange={this.onInputChanged.bind(this, InputFor.NewProviders)} type="text" className="form-control" placeholder="Input the new url for providersstart with http(s) and seperated by ,"/>
                       </div>
                   </div>
                   <div className="form-group">
                       <label>Password</label>
                       <div className="input-group">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fas-key"></i></div>
                           </div>
                           <input value={this.state.password} onChange={this.onInputChanged.bind(this, InputFor.Password)} type="password" className="form-control" />
                       </div>
                   </div>
                   <div>
                       <button type="button" disabled={this.state.isSubmitting} className="btn btn-primary" onClick={this.onSubmitBtnClick.bind(this)}>
                           <i className={`fas ${this.state.isSubmitting ? "fa-sync-alt fa-spin" : "fa-exchange-alt"}`}></i>&nbsp;Change Config
                       </button>
                   </div>
                   <div className="row">
                       <div className="col-sm-12">
                           <LogOutput log={this.state.testResults.map(r => `${r.message}${r.testResult ? `${JSON.stringify(r.testResult, null, 4)}` : ""}`)} />
                       </div>
                   </div>
               </div>;
    }
}

ReactDOM.render(<App />, document.getElementById("testContainer"));
