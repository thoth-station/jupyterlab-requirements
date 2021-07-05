/* global module, require */
module.exports = {
    presets: [
      ['@babel/preset-env', {targets: {node: 'current'}}],
      ['@babel/preset-typescript'],
      '@babel/preset-react',
      ],
    plugins: [
      '@babel/plugin-transform-runtime',
      '@babel/proposal-class-properties',
      '@babel/transform-regenerator',
      '@babel/plugin-transform-template-literals',
      'react-hot-loader/babel',
    ],
};
