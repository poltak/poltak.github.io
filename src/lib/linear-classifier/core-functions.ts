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
