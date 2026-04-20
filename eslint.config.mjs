import defineReactAppConfig from '@taylorvance/tv-shared-dev/eslint/react-app';

export default [
  ...defineReactAppConfig({
    extraIgnores: ['dist-benchmark/**'],
  }),
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },
  },
  {
    files: ['src/games/Onitama/Board.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
