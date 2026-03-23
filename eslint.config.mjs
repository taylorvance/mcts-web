import defineReactAppConfig from '@taylorvance/tv-shared-config/eslint/react-app';

export default [
  ...defineReactAppConfig({
    ignores: ['dist-benchmark/**'],
  }),
  {
    files: ['src/games/Onitama/Board.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];
