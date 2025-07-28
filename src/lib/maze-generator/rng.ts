import seedrandom from 'seedrandom'

export class RNGManager {
    private rngInstances = new Map<string, seedrandom.PRNG>()

    getRNG(seed: string): seedrandom.PRNG {
        if (!this.rngInstances.has(seed)) {
            this.rngInstances.set(seed, seedrandom(seed))
        }
        return this.rngInstances.get(seed)!
    }

    clearSeed(seed: string) {
        this.rngInstances.delete(seed)
    }

    clearAll() {
        this.rngInstances.clear()
    }
}

const rngManager = new RNGManager()

// Utility functions for managing RNG state
export function resetRNG(seed: string) {
    rngManager.clearSeed(seed)
}

export function resetAllRNG() {
    rngManager.clearAll()
}
