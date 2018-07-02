import * as React from "react";

export interface IProp {
    log: string[]
}

export class LogOutput extends React.Component<IProp, any> {
    constructor(props: any) {
        super(props);
    }

    render() {
        const style: React.CSSProperties = { wordWrap: "break-word" };
        return <ul className="list-group" style={style}>
                   {this.props.log.map((l, i) => <li key={i} className="list-group-item"><pre>{l}</pre></li>)}
               </ul>;
    }
}