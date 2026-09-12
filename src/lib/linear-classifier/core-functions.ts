/**
 * @param inputVector - Input vector. e.g., [1, 2, 3] - 3 features
 * @param weights - Weight matrix. e.g., [[1, 2, 3], [4, 5, 6]] - 2 classes, 3 features
 * @param bias - Bias vector. e.g., [1, 2] - 2 classes
 * @returns Scores for each class, including bias. e.g., [15, 34].
 */
export function linearClassifier(
    inputVector: number[],
    weights: number[][],
    bias: number[],
): number[] {
    if (weights.length === 0) {
        throw new Error('Weight matrix must contain at least one class')
    }
    if (weights.some((row) => row.length !== inputVector.length)) {
        throw new Error(
            'Input vector length must match weight matrix column length (num of features)',
        )
    }
    if (bias.length !== weights.length) {
        throw new Error('Bias vector length must match weight matrix row length (num of classes)')
    }

    return weights.map((row, index) =>
        row.reduce((score, weight, feature) => score + weight * inputVector[feature], bias[index]),
    )
}

/**
 * @param scores - Vector of scores for each class. e.g., [14, 32]
 * @param correctClassIndex - Index of the "correct" class. i.e., which of the classes is the one that the inputVector was expected to be in.
 * @param margin
 * @returns Total loss for input scores (how poor the weights that produced the input scores are at correctly classifying the input)
 */
export function calculateLoss(scores: number[], correctClassIndex: number, margin = 1): number {
    if (
        !Number.isInteger(correctClassIndex) ||
        correctClassIndex < 0 ||
        correctClassIndex >= scores.length
    ) {
        throw new Error('Correct class index must be within scores vector bounds')
    }
    if (!Number.isFinite(margin) || margin < 0) {
        throw new Error('Margin must be a finite non-negative number')
    }

    const correctClassScore = scores[correctClassIndex]

    let totalLoss = 0
    for (let i = 0; i < scores.length; i++) {
        if (i === correctClassIndex) {
            continue
        }

        totalLoss += Math.max(0, scores[i] - correctClassScore + margin)
    }
    return totalLoss
}
