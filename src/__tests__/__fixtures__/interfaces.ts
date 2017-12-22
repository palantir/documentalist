/*
 * Copyright 2017-present Palantir Techologies.
 *
 * This file contains dummy code for testing the typescript plugin.
 */

export enum Intent {
    Primary,
    Success,
    Warning,
    Danger,
}
export type IconName = "add" | "remove" | "plus" | "minus";

export interface IActionProps {
    /** Whether this action is non-interactive. */
    disabled?: boolean;

    /** Name of the icon (the part after `pt-icon-`) to add to the button. */
    iconName?: IconName;

    /** Visual intent color to apply to element. */
    intent: Intent;

    /** Click event handler. */
    onClick: (event: MouseEvent) => void;

    /** Action text. */
    text: string;
}

export interface IButtonProps extends IActionProps {
    /**
     * If set to `true`, the button will display in an active state.
     * This is equivalent to setting `className="pt-active"`.
     * @default false
     */
    active?: boolean;

    /** A ref handler that receives the native HTML element backing this component. */
    elementRef?: (ref: HTMLElement) => any;

    /**
     * Name of the icon (the part after `pt-icon-`) to add to the button.
     * @deprecated since v1.2.3
     */
    rightIconName?: IconName;

    /**
     * If set to `true`, the button will display a centered loading spinner instead of its contents.
     * The width of the button is not affected by the value of this prop.
     * @default false
     * @deprecated
     */
    loading?: boolean;

    /**
     * HTML `type` attribute of button. Common values are `"button"` and `"submit"`.
     * Note that this prop has no effect on `AnchorButton`; it only affects `Button`.
     * @default "button"
     */
    type?: string;
}

/**
 * Each plugin receives a `Compiler` instance to aid in the processing of source files.
 */
export interface ICompiler {
    /**
     * Converts an array of entries into a map of key to entry, using given
     * callback to extract key from each item.
     */
    objectify<T>(array: T[], getKey: (item: T) => string): { [key: string]: T };

    /**
     * Render a block of content by extracting metadata (YAML front matter) and
     * splitting text content into markdown-rendered HTML strings and `{ tag,
     * value }` objects.
     *
     * To prevent special strings like "@include" from being parsed, a reserved
     * tag words array may be provided, in which case the line will be left as
     * is.
     */
    renderBlock(blockContent: string, reservedTagWords?: string[]): object;

    /**
     * Render a string of markdown to HTML, using the options from `Documentalist`.
     */
    renderMarkdown(markdown: string): string;
}
