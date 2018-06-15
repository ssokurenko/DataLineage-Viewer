import * as React from "react";

export interface IProp {
    onInputsConfirmed(inputsAddress: string[]);
}

class State {
    inputsAddress: string[] = [];
    hasError = false;
}

export class InputChannelSelector extends React.Component<IProp, State> {
    constructor(props: IProp) {
        super(props);
        this.state = new State();
    }
    private onAddressChanged(index: number, event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({
            inputsAddress: this.state.inputsAddress.map((a, i) => i === index ? event.target.value : a),
            hasError: false
        });
    }

    private onAddClicked(event: Event) {
        this.setState({ inputsAddress: this.state.inputsAddress.concat([""]), hasError: false });
    }
    private onRemoveClicked(index: number, event: Event) {
        this.setState({ inputsAddress: this.state.inputsAddress.filter((a, i) => i !== index), hasError: false });
    }

    private onInputsConfirmClicked(event: Event) {
        if (this.state.inputsAddress.filter(a => {
                if (!a) return false;
                return a.trim();
            }).length > 0) {
            this.props.onInputsConfirmed(this.state.inputsAddress);
        } else {
            this.setState({hasError: true});
        }
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
            {this.state.hasError && <div className="alert alert-warning" role="alert">
                                        Need one channel address at least.
                                    </div>}
            <div className="form-group row">
                <div className="col-auto">
                    <button type="button" className="btn btn-primary" onClick={this.onAddClicked.bind(this)}>Add Channel</button>
                </div>
                <div className="col-auto">
                    <button type="button" className="btn btn-success" onClick={this.onInputsConfirmClicked.bind(this)}>OK</button>
                </div>
            </div>
            {this.state.inputsAddress.map((a,i)=>this.renderOnePublisherInput(i, a))}
        </React.Fragment>;
    }
}