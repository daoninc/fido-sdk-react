/**
 * Version: 1.1.28 06-04-2020
 */
package com.daon.fidoproject;

import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.fragment.app.FragmentActivity;

import com.daon.fido.client.sdk.ErrorInfo;
import com.daon.fido.client.sdk.Fido;
import com.daon.fido.client.sdk.IXUAF;
import com.daon.fido.client.sdk.IXUAFCallback;
import com.daon.fido.client.sdk.IXUAFCommService;
import com.daon.fido.client.sdk.IXUAFCommServiceListener;
import com.daon.fido.client.sdk.IXUAFDeregisterEventListener;
import com.daon.fido.client.sdk.IXUAFInitialiseListener;
import com.daon.fido.client.sdk.ServerCommResult;
import com.daon.fido.client.sdk.core.Error;
import com.daon.fido.client.sdk.core.ErrorFactory;
import com.daon.fido.client.sdk.core.FidoConstants;
import com.daon.fido.client.sdk.core.IUafCancellableClientOperation;
import com.daon.fido.client.sdk.core.SingleShotAuthenticationRequest;
import com.daon.fido.client.sdk.core.SingleShotDeregistrationRequest;
import com.daon.fido.client.sdk.model.Authenticator;
import com.daon.fido.client.sdk.model.DiscoveryData;
import com.daon.fido.client.sdk.model.Operation;
import com.daon.fido.client.sdk.model.UafProtocolMessageBase;
import com.daon.fido.client.sdk.uaf.UafMessageUtils;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.List;

public class RNFIDOModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    private IXUAF fido;
    private IXUAFCommService service;

    //private final static String AAID_PASSCODE = "D409#0302";
    private final static String AAID_PASSCODE = "D409#8302"; // ADOS SRP
    private final static String AAID_BIOMETRIC = "D409#0102";

    class JavaScriptService implements IXUAFCommService {

        IXUAFCommServiceListener listener;

        public void notifyWithResponse(String response) {

            if (listener == null)
                return;

            ServerCommResult result = new ServerCommResult();

            result.setResponseCode(SimpleService.OPERATION_COMPLETED);
            result.setResponse(response);

            listener.onComplete(result);
        }

        public void notifyWithError(int code, String message, String response) {

            if (listener == null)
                return;

            ServerCommResult result = new ServerCommResult();

            if (code == FidoConstants.ADOS_STATUS_USER_AUTH_FAILED) { // RETRY
                result.setResponseCode((short)code);
                if (response != null)
                    result.setResponse(response);
            } else {
                result.setErrorInfo(new ErrorInfo(code, message));
            }

            listener.onComplete(result);
        }

        @Override
        public void serviceRequestRegistrationWithUsername(String username, IXUAFCommServiceListener listener) {

            this.listener = listener;

            WritableMap map = Arguments.createMap();
            map.putString("type", "request");
            map.putString("username", username);

            sendEvent(reactContext, "registration", map);
        }

        @Override
        public void serviceRegister(String registrationResponse, IXUAFCommServiceListener listener) {

            this.listener = listener;

            WritableMap map = Arguments.createMap();
            map.putString("type", "response");
            map.putString("message", registrationResponse);

            sendEvent(reactContext, "registration", map);
        }

        @Override
        public void serviceRequestAuthenticationWithParams(Bundle params, IXUAFCommServiceListener listener) {

            this.listener = listener;

            WritableMap map = Arguments.createMap();
            map.putString("type", "request");
            if (params != null) {
                for (String key : params.keySet())
                    map.putString(key, params.getString(key));
            }
            sendEvent(reactContext, "authentication", map);
        }

        @Override
        public void serviceAuthenticate(String authenticationRequest, String authenticationResponse, String username, IXUAFCommServiceListener listener) {

            this.listener = listener;

            WritableMap map = Arguments.createMap();
            map.putString("type", "response");
            map.putString("message", authenticationResponse);
            map.putString("request", authenticationRequest);
            sendEvent(reactContext, "authentication", map);
        }

        @Override
        public void serviceUpdate(String authenticationResponse, String username, IXUAFCommServiceListener listener) {
            this.listener = listener;

            WritableMap map = Arguments.createMap();
            map.putString("type", "response");
            map.putString("message", authenticationResponse);
            if (username != null)
                map.putString("username", username);

            UafProtocolMessageBase[] uafRequests = UafMessageUtils.validateUafMessage(reactContext, authenticationResponse, UafMessageUtils.OpDirection.Response, null);
            if (uafRequests != null) {
                if (uafRequests[0].header.op == Operation.Reg)
                    sendEvent(reactContext, "registration", map);
                else
                    sendEvent(reactContext, "authentication", map);
            }
        }

        @Override
        public void serviceRequestRegistrationPolicy(IXUAFCommServiceListener listener) {

            this.listener = listener;

            WritableMap map = Arguments.createMap();
            map.putString("type", "policy");

            sendEvent(reactContext, "registration", map);
        }

        @Override
        public void serviceRequestDeregistration(String authenticatorId, IXUAFCommServiceListener listener) {

            this.listener = listener;

            // NOTE. Not used since we do not have an authenticator id
            // See deregister(String aaid, String username, final Promise promise) below.

            WritableMap map = Arguments.createMap();
            map.putString("type", "request");
            map.putString("id", authenticatorId);

            sendEvent(reactContext, "deregistration", map);
        }

        @Override
        public void serviceSubmitFailedAuthData(Bundle bundle, IXUAFCommServiceListener listener) {

            WritableMap map = Arguments.createMap();
            map.putString("type", "attempt");

            for (String key : bundle.keySet()) {
                Object value = bundle.get(key);
                if (value instanceof Integer)
                    map.putInt(key, (Integer) value);
                else
                    map.putString(key, (String) value);
            }

            sendEvent(reactContext, "authentication", map);

            // We do not care about the response
            ServerCommResult result = new ServerCommResult();
            listener.onComplete(result);
        }
    }

    public RNFIDOModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        fido = Fido.getInstance(getReactApplicationContext());
    }

    private void sendEvent(ReactContext reactContext,
                           String eventName,
                           @Nullable WritableMap params) {
        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
    }

    @Override
    public String getName() {
        return "RNFIDOModule";
    }

    @ReactMethod
    public void addListener(String eventName) {
    }

    @ReactMethod
    public void removeListeners(Integer count) {
    }

    private boolean isInitialized(Promise promise) {
        if (fido.isInitialised())
            return true;

        promise.reject(String.valueOf(ErrorFactory.SDK_NOT_INITIALISED_CODE), ErrorFactory.getErrorMessage(reactContext, ErrorFactory.SDK_NOT_INITIALISED_CODE));
        return false;
    }

    private void register(String aaid, String username, String data, final Promise promise) {

        if (isInitialized(promise)) {

            IXUAFCallback callback = new IXUAFCallback() {
                @Override
                public void onAuthenticationComplete(Bundle bundle) {
                    promise.resolve("0");
                }

                @Override
                public void onAuthenticationFailed(int code, String message) {
                    promise.reject(String.valueOf(code), message);
                }
            };

            fido.registerWithAaid(aaid, username, data, (FragmentActivity) getCurrentActivity(), callback);
        }
    }

    private void authenticate(String aaid, String username, String description, String data, final Promise promise) {

        if (isInitialized(promise)) {
            IXUAFCallback callback = new IXUAFCallback() {
                @Override
                public void onAuthenticationComplete(Bundle bundle) {
                    promise.resolve("0");
                }

                @Override
                public void onAuthenticationFailed(int code, String message) {

                    if (code != ErrorFactory.VERIFICATION_ATTEMPT_FAILED_CODE && code != ErrorFactory.NO_SUITABLE_AUTHENTICATOR_CODE) {

                        IUafCancellableClientOperation op = (IUafCancellableClientOperation) fido.getCurrentFidoOperation();
                        if (op != null)
                            op.cancelAuthenticationUI();
                    }
                    
                    promise.reject(String.valueOf(code), message);
                    
                }

            };

            fido.authenticateWithAaid(aaid, username, description, null, data, (FragmentActivity) getCurrentActivity(), callback);
        }
    }

    private void deregister(String aaid, String username, final Promise promise) {

        if (isInitialized(promise)) {

            try {
                SingleShotDeregistrationRequest request = SingleShotDeregistrationRequest.createWithAuthenticatorForSingleAccount(reactContext, null, username, aaid);


                fido.deregisterWithMessage(request.toString(), new IXUAFDeregisterEventListener() {
                    @Override
                    public void onDeregistrationComplete() {

                        // NOTE: This call will not invoke the communication service, so notify explicitly!
                        WritableMap map = Arguments.createMap();
                        map.putString("type", "request");
                        map.putString("aaid", aaid);
                        map.putString("username", username);

                        sendEvent(reactContext, "deregistration", map);

                        promise.resolve("0");
                    }

                    @Override
                    public void onDeregistrationFailed(int code, String message) {
                        promise.reject(String.valueOf(code), message);
                    }
                });

            } catch (Exception e) {
                promise.reject(String.valueOf(ErrorFactory.PROTOCOL_ERROR_CODE), e.getMessage());
            }


        }
    }

    @ReactMethod
    public void initialize(boolean JSService, final Promise promise) {

        if (fido.isInitialised() && fido.getCurrentFidoOperation() != null) {
            fido.cancelCurrentOperation();
        }

        service = JSService ? new JavaScriptService() : new SimpleService(reactContext);

        Bundle parameters = new Bundle();
        parameters.putString("com.daon.sdk.log","true");
        parameters.putString("com.daon.sdk.ados.enabled", "true");
        parameters.putString("com.daon.sdk.passcode.ados.version", "2"); // SRP
        parameters.putString("com.daon.sdk.ignoreNativeClients", "true");

        // Fido is a process-wide singleton. Rebinding the service on every
        // bridge initialization keeps reloads connected to the current JS
        // context instead of the context that created the singleton.
        fido.initWithService(parameters, service, new IXUAFInitialiseListener() {
            @Override
            public void onInitialiseComplete() {
                promise.resolve("0");
            }

            @Override
            public void onInitialiseFailed(int code, String message) {
                promise.reject(String.valueOf(code), message);
            }

            @Override
            public void onInitialiseWarnings(List<Error> list) {
                for (Error error : list) {
                    Log.w("DAON", error.getMessage());
                }
            }
        });

        String facetId = getFacetId();
        if (facetId != null)
            Log.i("DAON", "Facet ID: " + facetId);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String deviceIdentifier() {
        return Settings.Secure.getString(getReactApplicationContext().getContentResolver(), Settings.Secure.ANDROID_ID);
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    @Nullable
    public String getFacetId() {
        try {
            return UafMessageUtils.getFacetId(getReactApplicationContext());
        } catch (Exception e) {
            Log.w("DAON", "Failed to get Facet ID", e);
            return null;
        }
    }

    @ReactMethod
    public void reset(final Promise promise) {
        fido.reset(new IXUAFDeregisterEventListener() {
            @Override
            public void onDeregistrationComplete() {
                promise.resolve("0");
            }

            @Override
            public void onDeregistrationFailed(int code, String message) {
                promise.reject(String.valueOf(code), message);
            }
        });
    }

    @ReactMethod
    public void notifyWithResponse(String response) {
        if (service instanceof JavaScriptService)
            ((JavaScriptService) service).notifyWithResponse(response);
    }

    @ReactMethod
    public void notifyWithError(int code, String message, String response) {
        if (service instanceof JavaScriptService)
            ((JavaScriptService) service).notifyWithError(code, message, response);
    }

    @ReactMethod
    public void notifyWithUnknownError() {
        notifyWithError(ErrorFactory.PROTOCOL_ERROR_CODE, ErrorFactory.getErrorMessage(reactContext, ErrorFactory.PROTOCOL_ERROR_CODE), null);
    }

    @ReactMethod
    public void notifyWithUserNotEnrolledError() {
        notifyWithError(ErrorFactory.USER_NOT_ENROLLED_CODE, ErrorFactory.getErrorMessage(reactContext, ErrorFactory.USER_NOT_ENROLLED_CODE), null);
    }

    @ReactMethod
    public void singleShotAuthenticationRequest(String appID, String username, ReadableMap extensions, Promise promise) {

        try {
            SingleShotAuthenticationRequest ssar = username != null
                    ? SingleShotAuthenticationRequest.createUserAuthWithAllRegisteredAuthenticators(reactContext, appID, username)
                    : SingleShotAuthenticationRequest.createLoginWithOpenPolicy(reactContext, appID);

            ReadableMapKeySetIterator iterator = extensions.keySetIterator();
            while (iterator.hasNextKey()) {
                String key = iterator.nextKey();
                ssar.addExtension(key, extensions.getString(key));
            }

            promise.resolve(ssar.toString());

        } catch (Exception e) {
            promise.reject(String.valueOf(ErrorFactory.PROTOCOL_ERROR_CODE), e.getMessage());
        }
    }

    // PASSCODE

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isPasscodeRegistered(String username) {
        try {
            return fido.isRegistered(AAID_PASSCODE, username, null);
        } catch (Exception e) {
            Log.w("DAON", "Failed to check passcode registration", e);
            return false;
        }
    }

    @ReactMethod
    public void registerPasscode(String username, String passcode, Promise promise) {

        if (passcode == null || passcode.isEmpty())
            promise.reject(String.valueOf(ErrorFactory.PROTOCOL_ERROR_CODE), ErrorFactory.getErrorMessage(reactContext, ErrorFactory.PROTOCOL_ERROR_CODE));
        else
            register(AAID_PASSCODE, username, passcode, promise);
    }

    @ReactMethod
    public void authenticatePasscode(String username, String passcode, String description, Promise promise) {
        if (passcode == null || passcode.isEmpty())
            promise.reject(String.valueOf(ErrorFactory.PROTOCOL_ERROR_CODE), ErrorFactory.getErrorMessage(reactContext, ErrorFactory.PROTOCOL_ERROR_CODE));
        else
            authenticate(AAID_PASSCODE, username, description, passcode, promise);
    }

    @ReactMethod
    public void deregisterPasscode(String username, Promise promise) {
        deregister(AAID_PASSCODE, username, promise);
    }

    // FINGERPRINT

    @ReactMethod(isBlockingSynchronousMethod = true)
    public boolean isDeviceBiometricRegistered(String username) {
        try {
            return fido.isRegistered(AAID_BIOMETRIC, username, null);
        } catch (Exception e) {
            Log.w("DAON", "Failed to check biometric registration", e);
            return false;
        }
    }

    @ReactMethod
    public void registerDeviceBiometric(String username, Promise promise) {
        register(AAID_BIOMETRIC, username, null, promise);
    }

    @ReactMethod
    public void authenticateDeviceBiometric(String username, String description, Promise promise) {
        authenticate(AAID_BIOMETRIC, username, description, null, promise);
    }

    @ReactMethod
    public void deregisterDeviceBiometric(String username, final Promise promise) {
        deregister(AAID_BIOMETRIC, username, promise);
    }


//    @ReactMethod
//    public void deregister(String aaid, String username, final Promise promise) {
//
//        if (isInitialized(promise)) {
//            fido.deregister(aaid, username, new IXUAFDeregisterEventListener() {
//                @Override
//                public void onDeregistrationComplete() {
//                    promise.resolve("0");
//                }
//
//                @Override
//                public void onDeregistrationFailed(int code, String message) {
//                    promise.reject(String.valueOf(code), message);
//                }
//            });
//        }
//    }

    @ReactMethod
    public void discover(Promise promise) {

        WritableArray list = Arguments.createArray();

        try {
            DiscoveryData data = fido.discover();
            for (Authenticator authenticator : data.getAvailableAuthenticators()) {
                list.pushString(authenticator.getAaid());
            }

            promise.resolve(list);
        } catch (Exception e) {
            promise.reject(String.valueOf(ErrorFactory.PROTOCOL_ERROR_CODE), e.getMessage());
        }
    }

}
