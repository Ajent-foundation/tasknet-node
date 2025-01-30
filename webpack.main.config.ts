import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

export const mainConfig: Configuration = {
    /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
    entry: './src/main.ts',
    // Put your normal webpack config below here
    module: {
        rules,
    },
    plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
        mainFields: ['main', 'module'],
        //alias: {
        //    sharp: require.resolve('sharp')
        //}
    },
    externals: {
        canvas: 'commonjs canvas',
        sharp: 'commonjs sharp',
        '@img/sharp-libvips-dev': 'commonjs @img/sharp-libvips-dev',
        '@img/sharp-wasm32': 'commonjs @img/sharp-wasm32',
    },
    node: {
        global: true,
        __dirname: false,
        __filename: false,
    }
};