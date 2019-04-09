/**
 * Copyright 2017-present Palantir Technologies, Inc. All rights reserved.
 * Licensed under the BSD-3 License as modified (the “License”); you may obtain
 * a copy of the license in the LICENSE and PATENTS files in the root of this
 * repository.
 */
// tslint:disable:max-classes-per-file

export class Animal {
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
