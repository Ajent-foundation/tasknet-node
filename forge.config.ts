import type { ForgeConfig } from '@electron-forge/shared-types';

// Makers
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerPKG } from '@electron-forge/maker-pkg';
import MakerDmg from '@electron-forge/maker-dmg';
import { PublisherGithub } from '@electron-forge/publisher-github';

import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import ForgeExternalsPlugin from '@timfish/forge-externals-plugin';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';
import path from 'path';

// Load environment variables
import 'dotenv/config';

const config: ForgeConfig = {
    packagerConfig: {
        asar: {
            unpack: "**/node_modules/{sharp,node-fetch,@img,libvips}/**/*"
        },
        //name: "Tasknet Node",
        buildVersion: "1.0.0",
        extraResource: (() => {
            const resources: string[] = [
                path.resolve(__dirname, "images", "icon.png"),
                path.resolve(__dirname, "images", "iconFilled.png"),
                path.resolve(__dirname, "images", "iconWhite.png"),
                path.resolve(__dirname, "images", "dmg-background.png"),
                //path.resolve(__dirname, "src/services/scraper-service-ts/src/Extract/Prompts/"),
            ];

            return resources;
        })(),
        icon: './images/icon',
        osxSign: {
            identity: process.env.IDENTITY,
        },
        osxNotarize: {
            appleId: process.env.APPLE_ID || '',
            teamId: process.env.APPLE_TEAM_ID || '',
            appleIdPassword: process.env.APPLE_ID_PASSWORD || ''
        },
    },
    plugins: [
        new WebpackPlugin({
            mainConfig,
            renderer: {
                config: rendererConfig,
                entryPoints: [
                {
                    html: './public/index.html',
                    js: './src/renderer.ts',
                    name: 'main_window',
                    preload: {
                        js: './src/preload.ts',
                    },
                },
                ],
            },
        }),
        //@ts-ignore
        new ForgeExternalsPlugin({
            externals: ['sharp', 'node-fetch'],
            includeDeps: true,
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
          }),
    ],
    makers: [
        new MakerSquirrel({
            name: 'TaskNet',
            iconUrl: path.resolve(__dirname, 'images', 'icon.ico'),
            setupIcon: path.resolve(__dirname, 'images', 'icon.ico'),
            //certificateFile: "./certificates/cert.pfx",
            //certificatePassword: process.env.CERTIFICATE_PASSWORD,
            authors: 'Ajent Foundation',
        }, ['win32']), 
        new MakerZIP({}, 
            ['darwin', 'win32', 'linux']
        ), 
        //new MakerPKG({}, ['darwin']), 
        new MakerRpm({
            options:{
                name: 'TaskNet',
                icon: './images/icon.png',
            }
        }, ['linux']), 
        new MakerDmg({
            appPath: './out/Tasknet Node-darwin-arm64/Tasknet Node.app',
            background: './images/dmg-background.png',
            icon: './images/icon.icns',
            format: 'UDZO',
            contents: [
                {
                    x: 200,
                    y: 160,
                    type: 'file',
                    path: './out/Tasknet Node-darwin-arm64/Tasknet Node.app'
                },
                {
                    x: 400,
                    y: 160,
                    type: 'link',
                    path: '/Applications'
                }
            ]
        }, ['darwin']),
        new MakerDeb({
            options: {
                name: 'TaskNet',
                icon: './images/icon.png',
            }
        }, ['linux'])
    ],
    publishers: [
        new PublisherGithub({
            authToken: process.env.GITHUB_TOKEN,
            generateReleaseNotes: true,
            repository: {
                owner: 'Ajent-foundation',
                name: 'tasknet-node'
            },
        })
    ]
};

export default config;
