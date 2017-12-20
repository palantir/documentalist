/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */

export class Animal {
    public constructor(private noise: string) {}

    public bark() {
        return this.noise;
    }

    /**
     * Public method.
     * @param food Name of the food to eat.
     */
    public eat(food: string) {
        this.consume(Food.retrieve(food), true);
    }

    /** Private method does not appear in output. */
    private consume(food: Food, allOfIt = false) {
        if (allOfIt) {
            food.destroy();
        }
    }
}

// non-exported class does not appear in output.
// tslint:disable-next-line:max-classes-per-file
class Food {
    public static retrieve(name: string) {
        return new Food(name);
    }

    public constructor(public name: string) {}

    public destroy() {
        return true;
    }
}
