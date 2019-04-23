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

// HACKHACK(https://github.com/palantir/documentalist/issues/87)
// latest typedoc + handlebars fail to compile because they don't deal with ambient types correctly
// tslint:disable-next-line no-implicit-dependencies
import "handlebars";

export * from "./documentalist";
export * from "./plugins";
