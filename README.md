
# React Native sample

## Getting started

This release contains the source code for a basic sample application and SDK bridge code for iOS and Android. The SDK binaries are provided separately.

1. Install React Native and Cocoapods
    
    [React Native](https://reactnative.dev/docs/integration-with-existing-apps?language=apple&package-manager=npm)

2. Unzip sample files

    `$ unzip Daon.FIDO.ReactNative-1.1.x.zip`

3. Install the iOS SDK with Swift Package Manager

    The iOS project already declares the Daon FIDO SDK package. Xcode resolves it automatically when you open or build `ios/FIDOProject.xcworkspace`; do not copy `.xcframework` files into `ios/Frameworks`.

    | Setting | Value |
    | --- | --- |
    | Package URL | `https://github.com/daoninc/fido-sdk-ios` |
    | Version rule | From `4.10.46` up to, but not including, `5.0.0` |
    | Linked products | `DaonFIDOSDK`, `DaonAuthenticatorPasscode` |

    The resolved version is committed in `ios/FIDOProject.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved`. To refresh the package, open `ios/FIDOProject.xcworkspace` in Xcode and choose **File > Packages > Update to Latest Package Versions**. Review and commit the resulting `Package.resolved` change when upgrading.

    To add the same dependency to another iOS target, choose **File > Add Package Dependencies…**, enter the package URL above, select the version rule, and add both listed products to the target. The React Native bridge imports `DaonFIDOSDK` directly.

4. Install and update node modules

    `$ npm install`

5. Install and update CocoaPods

    `$ cd ios`
   
    `$ pod install`

6. Update server settings in network.js

    ```
    let server          = 'https://my-server.com/my-app/IdentityXServices/rest/v1/';
    let username        = "username";
    let password        = "password";
    ```

7. Update the facets on the IdentityX Admin Console

    iOS: `ios:bundle-id:com.daon.sdk.react.FIDOProject`

8. Run sample

    `$ npm start`

    Or:

    `$ npm run android`    

    `$ npm run ios`


## Sample
The SDK will call the IXUAFServiceDelegate delegate for handling FIDO related communication with the server. It is up to the application to provide an implementation of the IXUAFServiceDelegate protocol. 

This means that the IXUAFServiceDelegate has to be done entirely in native code or we need to map the delegate calls to JavaScript, so that the server communication can be done from JavaScript.

React Native provides a couple of ways to communicate between native code and JavaScript, e.g. callbacks, events, etc. For our sample we chose to use events to map the delegate calls back to JavaScript.

The flow is as follows:

![](react-native-comms-seq.png)

- The React Native application calls authenticate() with the given AAID and optional data (e.g. a passcode).
- The FIDO SDK (IXUAF API) sends a FIDO authentication request message to the IXUAFServiceDelegate, JS Service.
- The JS Service uses NativeEventEmitter to send the event to the React Native JavaScript application.
- The application communicates with the server using IdentityX REST API (or RPSA, etc.).
- The application receives the response from the server and notifies the SDK by calling the `notifyWithResponse` SDK method.
- The SDK provides a FIDO authentication message to the JS Service.
- The JS Service sends the message to the application.
- The application sends the message to the server.
- The application receives the response from the server and notifies the SDK by calling `notifyWithResponse`.
- The authenticate method provides the application with a response.


