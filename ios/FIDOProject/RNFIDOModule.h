//
//  Version: 1.1.28 06-04-2020
//
//  Created by Jonny Mortensen on 1/18/19.
//  Copyright © 2019-2020 Daon. All rights reserved.
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#import <DaonFIDOSDK/DaonFIDOSDK.h>

@interface RNFIDOModule : RCTEventEmitter <IXUAFDelegate> {
  
  id<IXUAFServiceDelegate> _service;
}

@end
  
@interface JavaScriptService : NSObject <IXUAFServiceDelegate> {
  
  RNFIDOModule* _module;
  
  void (^_handler)(NSString* response, NSDictionary* data, NSError* error);
}

- (instancetype) initWithModule:(RNFIDOModule*)module;

- (void) notifyHandlerWithResponse:(NSString*)response;
- (void) notifyHandlerWithError:(NSNumber*)code message:(NSString*)message response:(NSString*)response;



@end
