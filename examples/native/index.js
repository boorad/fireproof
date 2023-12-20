/**
 * @format
 */
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';
import Crypto from "react-native-quick-crypto";
polyfillGlobal('crypto', () => Crypto);
console.log('subtle', Crypto.subtle);

AppRegistry.registerComponent(appName, () => App);
