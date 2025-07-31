/**
 * @param inputVector - Input vector. e.g., [1, 2, 3] - 3 features
 * @param weights - Weight matrix. e.g., [[1, 2, 3], [4, 5, 6]] - 2 classes, 3 features
 * @param bias - Bias vector. e.g., [1, 2] - 2 classes
 * @returns Vector of inputVector scores for each class. e.g., [14, 32] - input more likely to be in second class.
 */
export function linearClassifier(
    inputVector: number[],
    weights: number[][],
    bias: number[],
): number[] {
    // Validate inputs
    if (inputVector.length !== weights[0].length) {
        throw new Error(
            'Input vector length must match weight matrix column length (num of features)',
        )
    }
    if (bias.length !== weights.length) {
        throw new Error('Bias vector length must match weight matrix row length (num of classes)')
    }

    // Calculate scores for each class (matrix multiply inputVector by weights)
    const classScores = new Array<number>(weights.length).fill(0)
    for (let i = 0; i < weights.length; i++) {
        const classTemplateWeights = weights[i]
        // Get the sum of all products of the input vector values with this particular class's weight values
        classScores[i] = classTemplateWeights.reduce(
            (acc, curr, j) => acc + curr * inputVector[j],
            0,
        )
    }

    return classScores
}

/**
 * @param scores - Vector of scores for each class. e.g., [14, 32]
 * @param correctClassIndex - Index of the "correct" class. i.e., which of the classes is the one that the inputVector was expected to be in.
 * @param margin
 * @returns Total loss for input scores (how poor the weights that produced the input scores are at correctly classifying the input)
 */
export function calculateLoss(scores: number[], correctClassIndex: number, margin = 1): number {
    // Validate inputs
    if (correctClassIndex < 0 || correctClassIndex >= scores.length) {
        throw new Error('Correct class index must be within scores vector bounds')
    }

    const correctClassScore = scores[correctClassIndex]

    const classLosses = new Array<number>(scores.length).fill(0)
    for (let i = 0; i < scores.length; i++) {
        // Skip the correct class
        if (i === correctClassIndex) {
            continue
        }

        const loss = scores[i] - correctClassScore + margin
        if (loss > 0) {
            classLosses[i] = loss
        }
    }

    const totalLoss = classLosses.reduce((a, b) => a + b, 0)
    return totalLoss
}
