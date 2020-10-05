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

// tslint:disable:max-classes-per-file
export class Animal {
    /** Get the noise of the animal */
    public get accessorNoise(): string {
        return this.noise;
    }

    /** Set the noise for the animal */
    public set accessorNoise(newNoise: string) {
        this.noise = newNoise;
    }

    public constructor(private noise: string) {}

    /** Produce a noise. */
    public bark() {
        return this.noise;
    }

    /**
     * Public method.
     * @param food Name of the food to eat.
     */
    public eat(food: string) {
        this.consumePrivate(Food.retrieve(food), true);
    }

    /** Private method does not appear in output. */
    private consumePrivate(food: Food, allOfIt = false) {
        if (allOfIt) {
            food.destroy();
        }
    }
}

export class Dog extends Animal {
    public constructor() {
        super("arf");
    }
}

// non-exported class does not appear in output.
class Food {
    public static retrieve(name: string) {
        return new Food(name);
    }

    public constructor(public name: string) {}

    public destroy() {
        return true;
    }
}
