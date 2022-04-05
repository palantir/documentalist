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
/**
 * Route
 */
interface IRoute {
    route: string;
    render: () => string;
}
declare class Router {
    el: HTMLElement;
    private defaultRoute;
    private routes;
    private currentRoute;
    constructor(el: HTMLElement, defaultRoute?: string);
    start(): void;
    register(route: IRoute): void;
    route(): void;
}
declare function queryAll(element: Element, selector: string): HTMLElement[];
declare const nav: Element;
declare function selectCurrent(route: string): void;
declare const router: Router;
declare const routables: HTMLElement[];
