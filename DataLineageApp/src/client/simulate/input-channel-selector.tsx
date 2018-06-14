import * as React from "react";

export interface IProp {
    onInputsConfirmed(inputsAddress: string[]);
}

class State {
    inputsAddress: string[] = [];
}

export class InputChannelSelector extends React.Component<IProp, State> {
    constructor(props: IProp) {
        super(props);
        this.state = new State();
    }
    private onAddressChanged(index: number, event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            inputsAddress: this.state.inputsAddress.map((a, i) => i === index ? event.target.value : a)
        });
    }

    private onAddClicked(event: Event) {
        this.setState({ inputsAddress: this.state.inputsAddress.concat([""]) });
    }
    private onRemoveClicked(index: number, event: Event) {
        this.setState({ inputsAddress: this.state.inputsAddress.filter((a, i) => i !== index) });
    }

    private onInputsConfirmClicked(event: Event) {
        this.props.onInputsConfirmed(this.state.inputsAddress);
    }

    private renderOnePublisherInput(index: number, address: string) {
        const id = `publisher-root-address-input-${index}`;
        return <div className="form-group row" key={index}>
                   <label htmlFor={id} className="col-sm-2 col-form-label">Channel root address</label>
                   <div className="col-sm-10 input-group">
                       <div className="input-group-prepend" onClick={this.onRemoveClicked.bind(this, index)}>
                           <div className="input-group-text"><i className="fas fa-trash-alt"></i></div>
                       </div>
                       <input type="text" value={address} className="form-control" id={id} onChange={this.onAddressChanged.bind(this, index)}/>
                   </div>
               </div>;
    }

    render() {
        return <React.Fragment>
            <p className="h4">Add input channels:</p>
            <div className="form-group row">
                <div className="col-auto">
                    <button type="button" className="btn btn-primary mb-2" onClick={this.onAddClicked.bind(this)}>Add</button>
                </div>
                <div className="col-auto">
                    <button type="button" className="btn btn-success mb-2" onClick={this.onInputsConfirmClicked.bind(this)}>OK</button>
                </div>
            </div>
            {this.state.inputsAddress.map((a,i)=>this.renderOnePublisherInput(i, a))}
        </React.Fragment>;
    }
}