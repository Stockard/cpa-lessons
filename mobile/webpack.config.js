const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  config.devServer = {
    ...config.devServer,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  };
  
  return config;
};
