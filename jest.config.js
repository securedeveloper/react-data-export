module.exports = {
    name: 'react-data-export-jest',
    verbose: true,
    collectCoverage: true,
    coveragePathIgnorePatterns: [
        'node_modules',
    ],
    testEnvironment: 'node',
    testRegex: '(/test/unit.*\\.test)\\.js',
    setupFiles: [
        './test/global.js'
    ],
    modulePathIgnorePatterns: [
        'global.js'
    ],
    testPathIgnorePatterns: [
        '__snapshots__'
    ]
};
