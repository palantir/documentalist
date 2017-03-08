
import * as React from "react";

export interface IInterfaceName {
    /**
     * The name of the object
     */
    name: string;

    /**
     * An optional object of options.
     *
     * @default {"true": false}
     */
    options?: any;
}

/**
 * These are the docs for the component. Make sure to
 * use the right props.
 *
 * @reference IInterfaceName
 */
export class Component extends React.Component<IInterfaceName, {}> {
}
