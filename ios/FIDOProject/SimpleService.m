//
//  SingleShotService.m
//  SingleShot-ObjC
//
//  Created by Jonny Mortensen on 1/18/19.
//  Copyright © 2019-25 Daon. All rights reserved.
//

#import "SimpleService.h"

//static NSString * const kAAID = @"D409#2601"; // Silent
static NSString * const kAAID = @"D409#2301"; // Passcode

@implementation SimpleService


- (void)serviceRequestRegistrationWithParameters:(NSDictionary<NSString *,id> *)params
                                         handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
 
    NSString *request = [IXUAFMessageWriter registrationRequestWithApplication:nil         // Use default FIDO appID
                                                                      username:params[kIXUAFServiceParameterUsername]];
    handler(request, nil, nil);
}


- (void) serviceRequestAuthenticationWithParameters:(NSDictionary<NSString *, id> *)params
                                            handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
 
    NSString * fidoAppID = params[kIXUAFServiceParameterApplication];
    
    NSString *request = [IXUAFMessageWriter authenticationRequestWithApplication:fidoAppID];
    
    handler(request, nil, nil);
}

- (void) serviceRequestDeregistrationWithAaid:(NSString *)aaid
                                  parameters:(NSDictionary<NSString *,id> *)params
                                     handler:(void (^)(NSString *, NSError *))handler {

    NSString *request = [IXUAFMessageWriter deregistrationRequestWithAaid:kAAID
                                                              application:params[kIXUAFServiceParameterApplication]];
    
    handler(request, nil);
}

- (void) serviceAuthenticateWithMessage:(NSString *)uafMessage
                             parameters:(NSDictionary<NSString *,id> *)params
                                handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
    // Ignore. No server. Not used.
    handler(uafMessage, nil, nil);
}

- (void)serviceRegisterWithMessage:(NSString *)uafMessage
                        parameters:(NSDictionary<NSString *,id> *)params
                           handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {

    // Ignore. No server. Not used.
    handler(uafMessage, nil, nil);
}


- (void) serviceUpdateWithAttempt:(NSDictionary<NSString *,id> *)info
                       parameters:(NSDictionary<NSString *,id> *)params
                          handler:(void (^)(NSString *, NSError *))handler {
    // Ignore. No server. Not used.
}

- (void) serviceUpdateWithMessage:(NSString *)uafMessage
                         username:(NSString *)username
                       parameters:(NSDictionary<NSString *,id> *)params
                          handler:(void (^)(NSString *, NSDictionary<NSString *,id> *, NSError *))handler {
    // Ignore. No server. Not used.
}


@end
