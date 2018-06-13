import * as React from "react";

export interface IProp {
    
}

class State {
    publisherRootAddress: string[] = [];
}

export class PublishersSelector extends React.Component<IProp, State> {
    constructor(props: IProp) {
        super(props);
        this.state = new State();
    }
    private onAddressChanged(event: React.ChangeEvent<HTMLInputElement>) {

    }

    private renderOnePublisherInput(index: number, address: string) {
        const id = `publisher-root-address-input-${index}`;
        return <div className="form-group row">
                   <label htmlFor={id} className="col-sm-2 col-form-label">Channel root address</label>
                   <div className="col-sm-10">
                       <input type="text" value={address} className="form-control-plaintext" id={id}  onChange={this.onAddressChanged.bind(this)}/>
                   </div>
               </div>;
    }
}