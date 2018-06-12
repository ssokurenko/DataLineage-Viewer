import * as React from "react";
import * as ReactDOM from "react-dom";
import { SeedInput } from "./seed-input";

const simple = "simple";
const standard = "standard";
class State {
    seed: string | undefined;
    value = 0;
    packageType: "simple" | "standard" = simple;
}

class App extends React.Component<any, State> {
    private confirmeSeed(seed: string):void {
        this.setState({ seed: seed });
    }

    constructor(props: any) {
        super(props);
        this.state = new State();
    }

    private async onAddClick(event: Event): Promise<void> {
        if (!this.state.value) {
            return;
        }
        const address = await $.post(`/api/simulate/${this.state.packageType}/${this.state.seed}/${this.state.value}`);
        event.preventDefault();
    }

    private onValueChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({value: parseFloat(event.target.value)});
    }

    private onPackageTypeChanged(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({packageType: event.target.value as any});
    }

    private renderValueInput() {
        return <div>
                   <div className="form-group row">
                       <label htmlFor="valueInput" className="col-sm-2 col-form-label">Value</label>
                       <div className="col-sm-10">
                           <div className="input-group">
                               <div className="input-group-prepend">
                                   <div className="input-group-text"><i className="fas fa-code-branch"></i></div>
                               </div>
                               <input value={this.state.value} onChange={this.onValueChange.bind(this)} type="number" className="form-control" id="valueInput" placeholder="Input the new value"/>
                           </div>
                       </div>
                   </div>

                   <fieldset className="form-group">
                       <div className="row">
                           <legend className="col-form-label col-sm-2 pt-0">Package type</legend>
                           <div className="col-sm-10">
                               <div className="form-check">
                                   <input onChange={this.onPackageTypeChanged.bind(this)} className="form-check-input" type="radio" name="packageType" id="packageTypeSimpleInput" value={simple} checked={this.state.packageType === simple}/>
                                   <label className="form-check-label" htmlFor="packageTypeSimpleInput">Simple package</label>
                               </div>
                               <div className="form-check">
                                   <input onChange={this.onPackageTypeChanged.bind(this)} className="form-check-input" type="radio" name="packageType" id="packageTypeStandardInput" value={standard} checked={this.state.packageType === standard}/>
                                   <label className="form-check-label" htmlFor="packageTypeStandardInput">Standard package</label>
                               </div>

                           </div>
                       </div>
                   </fieldset>

                   <div className="form-group row">
                       <div className="col-sm-10">
                           <button type="button" className="btn btn-primary mb-2" onClick={this.onAddClick.bind(this)}>Add</button>
                       </div>
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