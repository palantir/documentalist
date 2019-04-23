/**
 * Copyright 2017 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/** All icon identifiers */
export type IconName = "add" | "remove" | "plus" | "minus";

export interface IActionProps {
    /** Whether this action is non-interactive. */
    disabled?: boolean;

    /** Name of the icon (the part after `pt-icon-`) to add to the button. */
    iconName?: IconName;

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

    /** Index signature for the masses. */
    [x: string]: any;
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
