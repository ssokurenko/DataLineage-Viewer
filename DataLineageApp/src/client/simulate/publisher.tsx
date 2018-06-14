import * as React from "react";
import uuid = require("uuid/v4");
import { SeedInput } from "./seed-input";
import { LogOutput } from "./log-output";
import { ChannelPackagesList } from "./channel-packages-list";
import { IDataPackage } from "../../server/data-package";

const lightweight = "lightweight";
const standard = "standard";

export interface IProp {
    /**
     * The root address of the channel, which packages will be used to be selected as a input for current new package
     */
    inputsAddress: string[];
    seed?: string;
    onSeedConfirmed?(seed: string);
}

class State {
    constructor(seed?: string) {
        if (seed) {
            this.seed = seed;
        }
    }

    seed: string | undefined;
    value: any = "";
    packageType: "lightweight" | "standard" = lightweight;
    log: string[] = [];
    packageInputsAddress: string[] = [];
    isSubmitting: boolean = false;
}

export class Publisher extends React.Component<IProp, State> {
    private confirmeSeed(seed: string):void {
        this.setState({ seed: seed });
        if (this.props.onSeedConfirmed) {
            this.props.onSeedConfirmed(seed);
        }
    }

    constructor(props: any) {
        super(props);
        this.state = new State(props.seed);
    }

    private log(message: string):void {
        this.setState({ log: this.state.log.concat([message]) });
    }

    private async onAddClick(event: Event): Promise<void> {
        if (!this.state.value) {
            return;
        }
        const pkgId = uuid();
        this.log(`submitting package ${pkgId}`);
        this.setState({ isSubmitting: true });
        try {
            const pkg = await $.ajax(`/api/simulate/${this.state.packageType}/${this.state.seed}`,
                {
                    method: "POST",
                    data: JSON.stringify({
                        inputs: this.state.packageInputsAddress,
                        value: this.state.value,
                        dataPackageId: pkgId
                    }),
                    contentType: "application/json",
                    dataType: "json"
                });
            if (pkg) {
                this.setState({ value: "", packageInputsAddress: [] });
                this.log(`package ${JSON.stringify(pkg)} is submitted.`);
            } else {
                this.log(`package submitte failed.`);
            }
        } catch (e) {
            this.log(`package submitte failed with error ${JSON.stringify(e)}.`);
        } 
        this.setState({ isSubmitting: false });
        event.preventDefault();
    }

    private onValueChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({value: parseFloat(event.target.value)});
    }

    private onPackageTypeChanged(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({packageType: event.target.value as any});
    }

    private onPackageSelectedAsInput(pkg: IDataPackage, selected: boolean) {
        const index = this.state.packageInputsAddress.indexOf(pkg.mamAddress);
        if (selected) {
            if (index < 0) {
                this.setState({ packageInputsAddress: this.state.packageInputsAddress.concat([pkg.mamAddress]) });
            }
        } else {
            if (index >= 0) {
                this.setState({
                    packageInputsAddress: this.state.packageInputsAddress.filter(a => a !== pkg.mamAddress)
                });
            }
        }
    }

    private renderValueInput() {
        return <div className="row">
                   <div className="col-sm-12">
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
                               <legend className="col-form-label col-sm-2 pt-0">Protocol type</legend>
                               <div className="col-sm-10">
                                   <div className="form-check">
                                       <input onChange={this.onPackageTypeChanged.bind(this)} className="form-check-input" type="radio" name="packageType" id="packageTypeSimpleInput" value={lightweight} checked={this.state.packageType === lightweight}/>
                                       <label className="form-check-label" htmlFor="packageTypeSimpleInput">{`${lightweight} protocol`}</label>
                                   </div>
                                   <div className="form-check">
                                       <input onChange={this.onPackageTypeChanged.bind(this)} className="form-check-input" type="radio" name="packageType" id="packageTypeStandardInput" value={standard} checked={this.state.packageType === standard}/>
                                       <label className="form-check-label" htmlFor="packageTypeStandardInput">{`${standard} protocol`}</label>
                                   </div>
                               </div>
                           </div>
                       </fieldset>

                       <div className="form-group row">
                           <div className="col-sm-10">
                               <button type="button" className="btn btn-primary mb-2" onClick={this.onAddClick.bind(this)}>Add
                                   {this.state.isSubmitting && <i className="fas fa-sync-alt fa-spin" />}
                               </button>
                           </div>
                       </div></div>
               </div>;
    }

    private renderChannelPackages() {
        return <div className="row">
                   <div className="col-sm-12">
                       {this.props.inputsAddress &&
                           this.props.inputsAddress.map(a =>
                               <ChannelPackagesList key={a} rootAddress={a} selectedInputsAddress={this.state.packageInputsAddress} onPackageSelected={this.onPackageSelectedAsInput.bind(this)}/>)}
                   </div>
               </div>;
    }

    render() {
        return <React.Fragment>
                   <SeedInput seed={this.state.seed} onSeedConfirmed={this.confirmeSeed.bind(this)}/>
                   {this.renderChannelPackages()}
                   {this.state.seed && this.renderValueInput()}
                   <div className="row">
                       <div className="col-sm-12">
                           <LogOutput log={this.state.log}/></div>
                   </div>
               </React.Fragment>;
    }
}