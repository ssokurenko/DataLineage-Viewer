import * as React from "react";
import * as ReactDOM from "react-dom";

interface IState {
    urlsStr: string;
    useCustomTestAddress: boolean;
    customTestAddress: string;
}

class App extends React.Component<any, IState> {
    constructor(props: any, context?: any) {
        super(props, context);
        this.state = {
            urlsStr: "https://nodes.iota.fm, https://iotanode.us:443",
            useCustomTestAddress: false,
            customTestAddress: ""
        };
    }

    async onTestBtnClick() {
        const urlsStr: string = this.state.urlsStr;
        if (!urlsStr) {
            return;
        }
        const urls = urlsStr.split(",").map(u => u.trim()).filter(u => u);
        try {
            const result = await $.ajax(`/api/performance/test${this.state.useCustomTestAddress?`/${this.state.customTestAddress}`:""}`,
                {
                    method: "POST",
                    data: JSON.stringify({ urls: urls }),
                    contentType: "application/json",
                    dataType: "json"
                });
            if (result) {
                console.log(result);
            }
        } catch (e) {
            console.error(e);
        }
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
                   <button type="button" className="btn btn-primary"><i className="fas fa-signal" onClick={this.onTestBtnClick.bind(this)}></i>&nbsp;Test</button>
               </div>;
    }
}

ReactDOM.render(<App />, document.getElementById("testContainer"));