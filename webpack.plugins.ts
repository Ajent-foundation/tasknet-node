import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

export const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            { 
                from: path.resolve(__dirname, 'public'), 
                to: path.resolve(__dirname, '.webpack/renderer'), 
                globOptions: {
                    ignore: ['index.html'],
                }, 
            },
            // {
            //     from: 'src/services/scraper-service-ts/src/Extract/Prompts',
            //     to: path.resolve(__dirname, '.webpack/Prompts'), 
            // }
        ],
    }),
];