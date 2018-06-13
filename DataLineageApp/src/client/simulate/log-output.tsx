import * as React from "react";

export interface IProp {
    log: string[]
}

export class LogOutput extends React.Component<IProp, any> {
    constructor(props: any) {
        super(props);
    }

    render() {
        return <ul className="list-group">
                   {this.props.log.map((l, i) => <li key={i} className="list-group-item">{l}</li>)}
               </ul>;
    }
}