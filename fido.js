/**
 * This exposes the native FIDO module as a JS module. 
 */
import { NativeModules } from 'react-native';
const { RNFIDOModule } = NativeModules;
export default RNFIDOModule;
