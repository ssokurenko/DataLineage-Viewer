import * as React from "react";
import * as ReactDOM from "react-dom";
import { Publisher } from "./publisher";
import { InputChannelSelector } from "./input-channel-selector";

class State {
    seed: string;
    inputsConfirmed: boolean = false;
    inputsAddress: string[] = [];
    hasError = false;
}

class App extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = new State();
    }

    private onSeedConfirmed(seed: string) {
        this.setState({ seed: seed, hasError: false });
    }

    private onInputsConfirmed(inputs: string[]) {
        if (!this.state.seed) {
            this.setState({ hasError: true });
            return;
        }
        this.setState({ inputsConfirmed: true, inputsAddress: inputs.map(a => a) });
    }

    render() {
        return <React.Fragment>
                   {this.state.hasError &&
                       <div className="alert alert-warning" role="alert">
                           Seed is missing.
                       </div>}
                   <Publisher seed={this.state.seed} inputsAddress={this.state.inputsAddress} inputsConfirmed={this.state.inputsConfirmed} onSeedConfirmed={this.onSeedConfirmed.bind(this)}/>
                   {!this.state.inputsConfirmed &&
                       <InputChannelSelector onInputsConfirmed={this.onInputsConfirmed.bind(this)}/>}
               </React.Fragment>;
    }
}

ReactDOM.render(<App />, document.getElementById("simlate-processor-app"));