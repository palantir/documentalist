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

/**
 * Exported function.
 * @param first The number passed to the function.
 * @param second The string passed to the function.
 */
export function numberAndString(first: number, second: string) {
    return first + second;
}

/**
 * Non-exported function.
 * @param str The string parameter.
 * @param bool The boolean parameter.
 */
function stringAndBoolean(str: string, bool: boolean) {
    return str + bool;
}
