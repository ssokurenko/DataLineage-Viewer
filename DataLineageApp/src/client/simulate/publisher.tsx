import * as React from "react";
import * as ReactDOM from "react-dom";
import { SeedInput } from "./seed-input";

class State {
    seed: string | undefined;
}

class App extends React.Component<any, State> {
    private confirmeSeed(seed: string):void {
        this.setState({ seed: seed });
    }

    constructor(props: any) {
        super(props);
        this.state = new State();
    }

    private onAddClick(event: Event) {
        event.preventDefault();
    }

    private renderValueInput() {
        return <div className="form-row align-items-center">
                   <div className="col-sm-4 my-1">
                       <label className="sr-only" htmlFor="valueInput">Value</label>
                       <div className="input-group">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fa-code-branch"></i></div>
                           </div>
                           <input type="text" className="form-control" id="valueInput" placeholder="Input the new value"/>
                       </div>
                   </div>
                   <div className="col-auto">
                       <button type="button" className="btn btn-primary mb-2" onClick={this.onAddClick.bind(this)}>Add</button>
                   </div>
               </div>;
    }

    render() {
        return <React.Fragment>
                   <SeedInput onSeedConfirmed={this.confirmeSeed.bind(this)}/>
                   {this.state.seed && this.renderValueInput()}
               </React.Fragment>;
    }
}

ReactDOM.render(<App />, document.getElementById("simlate-publisher-app"));