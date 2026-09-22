package com.daon.fidoproject;

import android.content.Context;
import android.os.Bundle;

import com.daon.fido.client.sdk.ErrorInfo;
import com.daon.fido.client.sdk.IXUAF;
import com.daon.fido.client.sdk.IXUAFCommService;
import com.daon.fido.client.sdk.IXUAFCommServiceListener;
import com.daon.fido.client.sdk.ServerCommResult;
import com.daon.fido.client.sdk.core.ErrorFactory;
import com.daon.fido.client.sdk.core.SingleShotAuthenticationRequest;
import com.daon.fido.client.sdk.core.SingleShotRegistrationRequest;

public class SimpleService implements IXUAFCommService {

    public final static short OPERATION_COMPLETED = 1200;

    private Context context;

    public SimpleService(Context context) {
        this.context = context;
    }

    @Override
    public void serviceRequestRegistrationWithUsername(String username, IXUAFCommServiceListener listener) {

        ServerCommResult result = new ServerCommResult();

        try {
            SingleShotRegistrationRequest ssrr = SingleShotRegistrationRequest.createWithOpenPolicy(context, null, username);
            result.setResponse(ssrr.toString());

        } catch (Exception e) {
            result.setErrorInfo(new ErrorInfo(ErrorFactory.PROTOCOL_ERROR_CODE, e.getMessage()));
        }

        listener.onComplete(result);
    }

    @Override
    public void serviceRegister(String registrationResponse, IXUAFCommServiceListener listener) {

        ServerCommResult result = new ServerCommResult();
        result.setResponseCode(OPERATION_COMPLETED);
        result.setResponse(registrationResponse);
        result.setResponseMessage("Success");
        listener.onComplete(result);
    }

    @Override
    public void serviceRequestAuthenticationWithParams(Bundle bundle, IXUAFCommServiceListener listener) {

        ServerCommResult result = new ServerCommResult();

        String username = bundle != null ? bundle.getString(IXUAF.IXUAF_SERVICE_PARAM_USERNAME) : null;

        try {
            SingleShotAuthenticationRequest ssar =
                    SingleShotAuthenticationRequest.createUserAuthWithAllRegisteredAuthenticators(context, null, username);
            ssar.addExtension("com.daon.sdk.deviceInfo", "true");
            result.setResponse(ssar.toString());

        } catch (Exception e) {
            result.setErrorInfo(new ErrorInfo(ErrorFactory.PROTOCOL_ERROR_CODE, e.getMessage()));
        }

        listener.onComplete(result);
    }

    @Override
    public void serviceAuthenticate(String authenticationRequest, String authenticationResponse, String username, IXUAFCommServiceListener listener) {
        ServerCommResult result = new ServerCommResult();
        result.setResponseCode(OPERATION_COMPLETED);
        result.setResponse(authenticationResponse);
        result.setResponseMessage("Success");
        listener.onComplete(result);
    }

    @Override
    public void serviceUpdate(String authenticationResponse, String username, IXUAFCommServiceListener listener) {

    }

    @Override
    public void serviceRequestRegistrationPolicy(IXUAFCommServiceListener listener) {
        String policy = "{\"accepted\":[[{\"aaid\":null,\"vendorID\":null,\"keyIDs\":null,\"userVerification\":1023,\"keyProtection\":null,\"matcherProtection\":null,\"attachmentHint\":null,\"tcDisplay\":null,\"authenticationAlgorithms\":[1,2,3,4,5,6,7,8,9],\"assertionSchemes\":[\"UAFV1TLV\"],\"attestationTypes\":null,\"authenticatorVersion\":null,\"exts\":null}]],\"disallowed\":null,\"registrationInfoRequests\":null,\"authenticationInfoRequests\":null}";
        listener.onComplete(new ServerCommResult(policy));
    }

    @Override
    public void serviceRequestDeregistration(String authenticatorId, IXUAFCommServiceListener listener) {

//        ServerCommResult result = new ServerCommResult();
//
//        try {
//            SingleShotDeregistrationRequest ssdr = SingleShotDeregistrationRequest.createWithAuthenticatorForSingleAccount(null, username, aaid);
//            result.setResponse(ssdr.toString());
//        } catch (Exception e) {
//            result.setErrorInfo(new ErrorInfo(Error.PROTOCOL_ERROR.getCode(), e.getMessage()));
//        }
//
//        listener.onComplete(result);
    }

    @Override
    public void serviceSubmitFailedAuthData(Bundle bundle, IXUAFCommServiceListener listener) {
        listener.onComplete(new ServerCommResult());
    }


}
