import * as React from "react";
import Utilities from "../../common/utilities";


export interface IProp {
    onSeedConfirmed(seed: string): void;
}

class State {
    seed: string = "";
    isConfirmed: boolean;
}

export class SeedInput extends React.Component<IProp, State>{
    constructor(props: IProp) {
        super(props);
        this.state = new State();
    }

    private onSeedChanged(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ seed: event.target.value });
        event.preventDefault();
    }

    private onConfirmSeed(event: React.ChangeEvent<HTMLButtonElement>): void {
        let seed = this.state.seed;
        if (!this.state.seed) {
            seed = Utilities.randomSeed();
        }
        this.setState({ seed: seed, isConfirmed: true });
        this.props.onSeedConfirmed(seed as string);
        event.preventDefault();
    }

    private renderInputMode() {
        return <div className="form-row align-items-center">
                   <div className="col-sm-4">
                       <label className="sr-only" htmlFor="seedInput">Seed</label>
                       <div className="input-group mb-2">
                           <div className="input-group-prepend">
                               <div className="input-group-text"><i className="fas fa-seedling"></i></div>
                           </div>
                           <input value={this.state.seed} onChange={this.onSeedChanged.bind(this)} type="text" className="form-control" id="seedInput" placeholder="Input the seed or use generate button" />
                       </div>
                   </div>
                   <div className="col-auto">
                       <button onClick={this.onConfirmSeed.bind(this)} type="button" className="btn btn-primary mb-2">{this.state.seed ? "Next" : "Generate"}</button>
                   </div>
               </div>;
    }

    private renderConfirmedMode() {
        return <div className="form-group row">
                   <label htmlFor="inputPassword6" className="col-sm-1 col-form-label">Seed Value</label>
                   <div className="col-sm-8">
                       <input value={this.state.seed} type="text" id="seedReadonlyInput" readOnly={true} className="form-control"/>
                   </div>
               </div>;
    }

    render() {
        return <React.Fragment>
                   {this.state.isConfirmed ? this.renderConfirmedMode() : this.renderInputMode()}
               </React.Fragment>;
    }
}
