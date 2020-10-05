/*!
 * Copyright 2019 Palantir Technologies, Inc. All rights reserved.
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
