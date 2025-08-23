import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        navigator: 'readonly',
        // Three.js globals
        THREE: 'readonly',
        // Audio context
        AudioContext: 'readonly',
        webkitAudioContext: 'readonly'
      }
    },
    rules: {
      // Enforce consistent indentation
      'indent': ['error', 2],
      
      // Enforce consistent quotes
      'quotes': ['error', 'single'],
      
      // Require semicolons
      'semi': ['error', 'always'],
      
      // Disallow unused variables
      'no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      
      // Disallow console statements (can be relaxed for development)
      'no-console': 'warn',
      
      // Enforce consistent spacing
      'space-before-blocks': 'error',
      'keyword-spacing': 'error',
      
      // Disallow trailing spaces
      'no-trailing-spaces': 'error',
      
      // Enforce consistent line endings
      'eol-last': 'error',
      
      // Disallow multiple empty lines
      'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }]
    }
  },
  {
    // Ignore common directories
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'public/**/*.js' // Ignore any JS files in public directory
    ]
  }
];
