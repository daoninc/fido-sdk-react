//
//  Version: 1.1.28 06-04-2020
//
//  Created by Jonny Mortensen on 1/18/19.
//  Copyright © 2019-2025 Daon. All rights reserved.
//

#import <DaonFIDOSDK/DaonFIDOSDK.h>

#import "RNFIDOModule.h"
#import "SimpleService.h"

@interface RNFIDOModule () {
  
  IXUAF * _fido;
}
@end

//static NSString * const kAAIDPasscode = @"D409#2301"; // Passcode
static NSString * const kAAIDPasscode = @"D409#9302"; // SRP Passcode

@implementation RNFIDOModule

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}
RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
  return @[@"authentication", @"registration", @"deregistration"];
}

- (NSString*) stringWithCode:(IXUAFErrorCode)code {
  return [NSString stringWithFormat:@"%ld", (long)code];
}

- (BOOL) isInitialized:(RCTPromiseRejectBlock)reject {
  if (_fido != nil && _fido.initialized)
    return YES;
  
  reject([self stringWithCode:IXUAFErrorCodeSdkNotInitialised], @"SDK is not initialised", [IXUAFError errorWithCode:IXUAFErrorCodeSdkNotInitialised]);
  return NO;
}


- (void) registerWithAaid:(NSString*)aaid
                 username:(NSString*)username
                     data:(id)data
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject {
  
  if ([self isInitialized:reject]) {
    [_fido registerWithAaid:aaid
                   username:username
                       data:data
                 parameters:nil
                    handler:^(NSDictionary<NSString *,id> *response, NSError *error) {
      if (error == nil)
        resolve(response);
      else
        reject([self stringWithCode:[error code]], [error localizedDescription], error);
    }];
  }
}

- (void) authenticateWithAaid:(NSString*)aaid
                     username:(NSString*)username
                         data:(id)data
                  description:(NSString*)description
                     resolver:(RCTPromiseResolveBlock)resolve
                     rejecter:(RCTPromiseRejectBlock)reject {
  
  if ([self isInitialized:reject]) {
    [_fido authenticateWithAaid:aaid
                       username:username
                           data:data
                    description:description
                     parameters:nil
                        handler:^(NSDictionary<NSString *,id> *response, NSError *error) {
      if (error == nil)
        resolve(response);
      else
        reject([self stringWithCode:[error code]], [error localizedDescription], error);
    }];
  }
}

- (void) deregisterWithAaid:(NSString*)aaid
                   username:(NSString*)username
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject {
  
  if ([self isInitialized:reject]) {
    [_fido deregisterWithAaid:aaid
                     username:username
                      handler:^(NSError *error) {
      
      if (error == nil)
        resolve(@"De-register complete");
      else
        reject([self stringWithCode:[error code]], [error localizedDescription], error);
    }];
  }
}

RCT_REMAP_METHOD(initialize,
                 jsservice:(BOOL)js
                 initializeWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  if (_fido == nil) {
    _service = js ? [[JavaScriptService alloc] initWithModule:self] : [SimpleService new];
    
    _fido = [[IXUAF alloc] initWithService:_service];
    _fido.logging = YES;
    _fido.delegate = self;
    
    NSDictionary * params = @{@"com.daon.sdk.ados.enabled" : @"true"};
    
    [_fido initializeWithParameters:params completion:^(IXUAFErrorCode code, NSArray<NSNumber*> *warnings) {
      
      if (code == IXUAFErrorCodeSdkNotInitialised)
        reject([self stringWithCode:code], @"IXUAFErrorCodeSdkNotInitialised", [IXUAFError errorWithCode:code]);
      else
        resolve([self stringWithCode:code]);
    }];
  }
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(id, deviceIdentifier) {
  return [DaonFIDO deviceId];
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(id, getFacetId) {
  NSString *bundleIdentifier = [[NSBundle mainBundle] bundleIdentifier];
  return bundleIdentifier == nil ? nil : [NSString stringWithFormat:@"ios:bundle-id:%@", bundleIdentifier];
}

RCT_EXPORT_METHOD(notifyWithResponse:(NSString*)response) {
  [_service performSelector:@selector(notifyHandlerWithResponse:)
                 withObject:response];
}

RCT_EXPORT_METHOD(notifyWithError:(NSInteger)code message:(NSString*)message response:(NSString*)response) {
  
  if ([_service isKindOfClass:[JavaScriptService class]]) {
    [(JavaScriptService*)_service notifyHandlerWithError:[NSNumber numberWithInteger:code] message:message response:response];
  }
}

RCT_EXPORT_METHOD(notifyWithUnknownError) {
  [self notifyWithError:IXUAFErrorCodeProtocolError message:nil response:nil];
}

RCT_EXPORT_METHOD(notifyWithUserNotEnrolledError) {
  [self notifyWithError:IXUAFErrorCodeUserNotEnrolled message:nil response:nil];
}


RCT_REMAP_METHOD(discover,
                 discoverWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  if ([self isInitialized:reject]) {
    [_fido discoverWithCompletionHandler:^(IXUAFDiscoveryData *response, NSError *error) {
      
      NSMutableArray<NSString*> * authenticators = [NSMutableArray new];
      for (IXUAFAuthenticator * a in response.availableAuthenticators) {
        [authenticators addObject:a.aaid];
      }
      resolve(authenticators);
    }];
  }
}

- (NSNumber*) isRegisteredAaid:(NSString*)aaid username:(NSString*)username {
  BOOL registered = NO;
  
  if (_fido != nil && _fido.initialized)
    registered = [_fido isRegisteredAaid:aaid username:username];
  
  return [NSNumber numberWithBool:registered];
}


// - (void) isRegisteredAaid:(NSString*)aaid
//                  username:(NSString*)username
//                  resolver:(RCTPromiseResolveBlock)resolve
//                  rejecter:(RCTPromiseRejectBlock)reject {
//    if ([self isInitialized:reject]) {
//      BOOL registered = [_fido isRegisteredAaid:aaid username:username];
//      resolve([NSNumber numberWithBool:registered]);
//    }
// }

RCT_REMAP_METHOD(singleShotAuthenticationRequest,
                 appid:(NSString*)fidoAppID
                 username:(NSString*)username
                 extensions:(NSDictionary*)extensions
                 singleShotAuthenticationRequestWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  NSString *request = [IXUAFMessageWriter authenticationRequestWithApplication:fidoAppID];
  if (request != nil) {
    // if we have a user, make it a stepup.
    if (username != nil)
      request = [IXUAFMessageWriter updateRequest:request username:username];
    
    // Add additional extensions if needed
    if (extensions != nil)
      request = [IXUAFMessageWriter updateRequest:request extensions:extensions];
    
    resolve(request);
    
  } else {
    reject([self stringWithCode:IXUAFErrorCodeProtocolError],
           @"Request is nil",
           [IXUAFError errorWithCode:IXUAFErrorCodeProtocolError]);
  }
}

RCT_REMAP_METHOD(register,
                 username:(NSString*)username
                 registerWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  if ([self isInitialized:reject]) {
    [_fido registerWithUsername:username handler:^(NSDictionary<NSString *,id> *response, NSError *error) {
      if (error == nil)
        resolve(response);
      else
        reject([self stringWithCode:[error code]], [error localizedDescription], error);
    }];
  }
}

RCT_REMAP_METHOD(authenticate,
                 authenticateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  if ([self isInitialized:reject]) {
    [_fido authenticateWithCompletionHandler:^(NSDictionary<NSString *,id> *response, NSError *error) {
      if (error == nil)
        resolve(response);
      else
        reject([self stringWithCode:[error code]], [error localizedDescription], error);
    }];
  }
}

RCT_REMAP_METHOD(authenticateWithUsername,
                 username:(NSString*)username
                 description:(NSString*)description
                 authenticateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  if ([self isInitialized:reject]) {
    [_fido authenticateWithUsername:username description:description handler:^(NSDictionary<NSString *,id> *response, NSError *error) {
      if (error == nil)
        resolve(response);
      else
        reject([self stringWithCode:[error code]], [error localizedDescription], error);
    }];
  }
}

RCT_REMAP_METHOD(deregister,
                 aaid:(NSString*)aaid
                 username:(NSString*)username
                 deregisterWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self deregisterWithAaid:aaid username:username resolver:resolve rejecter:reject];
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(id, isPasscodeRegistered:(NSString*)username) {
  return [self isRegisteredAaid:kAAIDPasscode username:username];
}

// RCT_REMAP_METHOD(isPasscodeRegistered2,
//                  username:(NSString*)username
//                  isPasscodeRegisteredWithResolver:(RCTPromiseResolveBlock)resolve
//                  rejecter:(RCTPromiseRejectBlock)reject) {
//   [self isRegisteredAaid:kAAIDPasscode username:username resolver:resolve rejecter:reject];
// }


RCT_REMAP_METHOD(registerPasscode,
                 username:(NSString*)username
                 passcode:(NSString*)passcode
                 registerPasscodeWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self registerWithAaid:kAAIDPasscode
                username:username
                    data:passcode
                resolver:resolve
                rejecter:reject];
}

RCT_REMAP_METHOD(authenticatePasscode,
                 username:(NSString*)username
                 passcode:(NSString*)passcode
                 description:(NSString*)description
                 authenticatePasscodeWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self authenticateWithAaid:kAAIDPasscode
                    username:username
                        data:passcode
                 description:description
                    resolver:resolve
                    rejecter:reject];
}

RCT_REMAP_METHOD(deregisterPasscode,
                 username:(NSString*)username
                 deregisterPasscodeWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self deregisterWithAaid:kAAIDPasscode username:username resolver:resolve rejecter:reject];
}

RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(id, isDeviceBiometricRegistered:(NSString*)username) {
  return [self isRegisteredAaid:[DASUtils isFaceIDSupported] ? @"D409#2204" : @"D409#2101" username:username];
}

// RCT_REMAP_METHOD(isDeviceBiometricRegistered2,
//                  username:(NSString*)username
//                  isDeviceBiometricRegisteredWithResolver:(RCTPromiseResolveBlock)resolve
//                  rejecter:(RCTPromiseRejectBlock)reject) {

//   [self isRegisteredAaid:[DASUtils isFaceIDSupported] ? @"D409#2204" : @"D409#2101"
//             username:username
//             resolver:resolve
//             rejecter:reject];
// }

RCT_REMAP_METHOD(registerDeviceBiometric,
                 username:(NSString*)username
                 registerDeviceBiometricsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self registerWithAaid:[DASUtils isFaceIDSupported] ? @"D409#2204" : @"D409#2101"
                username:username
                    data:nil
                resolver:resolve
                rejecter:reject];
}

RCT_REMAP_METHOD(authenticateDeviceBiometric,
                 username:(NSString*)username
                 description:(NSString*)description
                 authenticateDeviceBiometricsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self authenticateWithAaid:[DASUtils isFaceIDSupported] ? @"D409#2204" : @"D409#2101"
                    username:username
                        data:nil
                 description:description
                    resolver:resolve
                    rejecter:reject];
}

RCT_REMAP_METHOD(deregisterDeviceBiometric,
                 username:(NSString*)username
                 deregisterDeviceBiometricsWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  [self deregisterWithAaid:[DASUtils isFaceIDSupported] ? @"D409#2204" : @"D409#2101"
                  username:username
                  resolver:resolve
                  rejecter:reject];
}

RCT_REMAP_METHOD(reset,
                 resetWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  
  dispatch_async(dispatch_get_global_queue( DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void) {
    [self->_fido reset];
    
    self->_fido = nil;
    
    dispatch_async( dispatch_get_main_queue(), ^{
      resolve(@"Reset complete");
    });
  });
  
  // reject([self stringWithCode:[error code]], [error localizedDescription], error);
}

@end


@implementation JavaScriptService

- (instancetype) initWithModule:(RNFIDOModule*)module {
  self = [super init];
  if (self) {
    _module = module;
  }
  return self;
}

- (void) notifyHandlerWithResponse:(NSString*)response {
  if (_handler != nil)
    _handler(response, nil, nil);
}

- (void) notifyHandlerWithError:(NSNumber*)code
                        message:(NSString*)message
                       response:(NSString*)response {
  if (_handler != nil)
    _handler(response, nil, [IXUAFError errorWithCode:[code integerValue] message:message]);
}

- (void) serviceRequestRegistrationWithParameters:(NSDictionary<NSString *,id> *)params
                                          handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
  
  _handler = handler;
  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"request"  forKey:@"type"];
  [body setObject:params[kIXUAFServiceParameterUsername] forKey:@"username"];
  
  [_module sendEventWithName:@"registration" body:body];
}

- (void) serviceRequestAuthenticationWithParameters:(NSDictionary<NSString *,id> *)params
                                            handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
  
  _handler = handler;
  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"request" forKey:@"type"];
  
  if (params != nil)
    [body addEntriesFromDictionary:params];
  
  [_module sendEventWithName:@"authentication" body:body];
}


- (void) serviceAuthenticateWithMessage:(NSString *)uafMessage
                             parameters:(NSDictionary<NSString *,id> *)params
                                handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
  
  _handler = handler;
  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"response" forKey:@"type"];
  [body setObject:uafMessage  forKey:@"message"];
  [body setObject:params[kIXUAFServiceParameterRequest] forKey:@"request"];
  [body setObject:params[kIXUAFServiceParameterUsername]    forKey:@"username"];
  
  [_module sendEventWithName:@"authentication" body:body];
}

- (void) serviceRegisterWithMessage:(NSString *)uafMessage
                         parameters:(NSDictionary<NSString *,id> *)params
                            handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
  
  _handler = handler;
  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"response" forKey:@"type"];
  [body setObject:uafMessage  forKey:@"message"];
  [body setObject:params[kIXUAFServiceParameterRequest] forKey:@"request"];
  
  [_module sendEventWithName:@"registration" body:body];
}


- (void) serviceRequestDeregistrationWithAaid:(NSString *)aaid
                                   parameters:(NSDictionary<NSString *,id> *)params
                                      handler:(void (^)(NSString *, NSError *))handler {
  
  _handler = ^(NSString *response, NSDictionary *data, NSError *error) {
    handler(response, error);
  };
  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"request"  forKey:@"type"];
  [body setObject:aaid        forKey:@"aaid"];
  [body setObject:params[kIXUAFServiceParameterUsername]    forKey:@"username"];
  [body setObject:params[kIXUAFServiceParameterApplication] forKey:@"application"]; // The FIDO application ID, not the IdentityX application
  
  [_module sendEventWithName:@"deregistration" body:body];
}


- (void)serviceUpdateWithAttempt:(NSDictionary<NSString *,id> *)info
                      parameters:(NSDictionary<NSString *,id> *)params
                         handler:(void (^)(NSString *, NSError *))handler {

  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"attempt" forKey:@"type"];
  
  if (info != nil)
    [body addEntriesFromDictionary:info];
  
  [_module sendEventWithName:@"authentication" body:body];
}

- (void)serviceUpdateWithMessage:(NSString *)uafMessage
                        username:(NSString *)username
                      parameters:(NSDictionary<NSString *,id> *)params
                         handler:( void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {

  _handler = handler;
  
  NSMutableDictionary * body = [NSMutableDictionary new];
  [body setObject:@"response" forKey:@"type"];
  [body setObject:uafMessage  forKey:@"message"];
  if (username != nil)
    [body setObject:username    forKey:@"username"];
  
  IXUAFMessageReader * mr = [IXUAFMessageReader readerWithMessage:uafMessage];
  if ([mr isRegistration])
    [_module sendEventWithName:@"registration" body:body];
  else
    [_module sendEventWithName:@"authentication" body:body];
}


@end
