/*
 * Copyright 2018-present Palantir Techologies.
 *
 * This file contains dummy code for testing the typescript plugin.
 */

/** classic typescript enum */
export enum Intent {
    PRIMARY = "primary",
    SUCCESS = "success",
    WARNING = "warning",
    DANGER = "danger",
}

/** const/type pair: enum & string literals */
export const IconName = {
    ADD: "add" as "add",
    REMOVE: "remove" as "remove",
    // tslint:disable-next-line:object-literal-sort-keys
    PLUS: "plus" as "plus",
    MINUS: "minus" as "minus",
};
export type IconName = "add" | "remove" | "plus" | "minus";

/** plain old object literal, *not* an enum */
export const Literal = {
    LEFT: "left",
    RIGHT: "right",
};
