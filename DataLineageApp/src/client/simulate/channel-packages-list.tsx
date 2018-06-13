import * as React from "react";
import { IDataPackage, PacakgeHelper } from "../../server/data-package";

export interface IProp {
    rootAddress: string;
    onPackageSelected(pkg: IDataPackage, selected: boolean);
}

interface IPackageState {
    package: IDataPackage;
    selected: boolean;
}

class State {
    packages: IPackageState[];
}

export class ChannelPackagesList extends React.Component<IProp, State> {
    constructor(props: IProp) {
        super(props);
    }

    private static getValueOrSignature(pkg: IDataPackage): string {
        if (PacakgeHelper.isLightWeight(pkg)) return pkg.data;
        if (PacakgeHelper.isStandard(pkg)) return pkg.signature;
        return "";
    }

    private onSelectChanged(pkg: IDataPackage, event: React.ChangeEvent<HTMLInputElement>) {
        const selected = event.target.checked;
        this.setState({
            packages: this.state.packages.map(ps => {
                if (ps.package.dataPackageId !== pkg.dataPackageId) return ps;
                return { ...ps, selected: selected}
            })
        });
        this.props.onPackageSelected(pkg, selected);
    }

    async componentWillMount(): Promise<void> {
        const pkgs = await $.get(`/api/address/channel/${this.props.rootAddress}`);
        this.setState({
            packages: pkgs.map(p => ({
                package: p,
                selected: false
            }))
        });
    }

    render() {
        return <div className="card" key={this.props.rootAddress}>
                   <div className="card-header">
                       {`Packages in the channel ${this.props.rootAddress}`}
                   </div>
                   <div className="card-body">
                       <table className="table table-striped">
                           <thead>
                           <tr>
                               <th scope="col"></th>
                               <th scope="col">Id</th>
                               <th scope="col">Value/Signature</th>
                           </tr>
                           </thead>
                           <tbody>
                           {this.state.packages.map(ps => <tr key={ps.package.dataPackageId}>
                                                              <th scope="row"><input checked={ps.selected} onChange={this.onSelectChanged.bind(this, ps.package)} type="checkbox"/></th>
                                                              <td>{ps.package.dataPackageId}</td>
                                                              <td>{ChannelPackagesList.getValueOrSignature(ps.package)
                                                              }</td>
                                                          </tr>)}
                           </tbody>
                       </table>
                   </div>
               </div>;
    }
}