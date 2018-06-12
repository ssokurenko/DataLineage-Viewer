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

    render() {
        return <React.Fragment>
                   <SeedInput onSeedConfirmed={this.confirmeSeed.bind(this)}/>
               </React.Fragment>;
    }
}

ReactDOM.render(<App />, document.getElementById("simlate-publisher-app"));