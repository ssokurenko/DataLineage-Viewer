import * as React from "react";
import * as ReactDOM from "react-dom";
import { Publisher } from "./publisher";
import { InputChannelSelector } from "./input-channel-selector";

class State {
    seed: string;
    inputsConfirmed: boolean = false;
    inputsAddress: string[] = [];
}

class App extends React.Component<any, State> {
    constructor(props: any) {
        super(props);
        this.state = new State();
    }

    private onSeedConfirmed(seed: string) {
        this.setState({ seed: seed });
    }

    private onInputsConfirmed(inputs: string[]) {
        this.setState({ inputsConfirmed: true, inputsAddress: inputs.map(a => a) });
    }

    render() {
        return <React.Fragment>
                   <Publisher seed={this.state.seed} inputsAddress={this.state.inputsAddress} inputsConfirmed={this.state.inputsConfirmed} onSeedConfirmed={this.onSeedConfirmed.bind(this)}/>
                   {!this.state.inputsConfirmed && <InputChannelSelector onInputsConfirmed={this.onInputsConfirmed.bind(this)}/>}
               </React.Fragment>;
    }
}

ReactDOM.render(<App />, document.getElementById("simlate-processor-app"));