/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Version: 1.1.28 06-04-2020
 *
 */

let base64 = require("base64-js");

module.exports = {
  IdentityX: IdentityX,
};

let registrationChallenges = "registrationChallenges";
let authenticationRequests = "authenticationRequests";
let users = "users";
let authenticators = "authenticators";

let policies = "policies";

let server =
  "https://us-dev-env4.identityx-cloud.com/fido/IdentityXServices/rest/v1/";
let username = "admin2";
let password = "admin2";
let regPolicyId = "reg";
let authPolicyId = "auth";

function IdentityX(fido) {
  this.fido = fido;
  this.id;
}

IdentityX.prototype.getRegistrationRequest = async function (username) {
  try {
    let response = await this.post(server + registrationChallenges, {
      policy: {
        policyId: regPolicyId,
        application: {
          applicationId: "mobileteamfido",
        },
      },
      registration: {
        registrationId: username,
        application: {
          applicationId: "mobileteamfido",
        },
        user: {
          userId: username,
        },
      },
    });

    //console.log("getRegistrationRequest: " + JSON.stringify(response))

    if (response != null && response.id != undefined) {
      this.id = response.id;
      this.fido.notifyWithResponse(response.fidoRegistrationRequest);
    } else {
      this.notifyServerError(response);
    }
  } catch (error) {
    console.error(error);
    this.notifyRequestError(error);
  }
};

IdentityX.prototype.register = async function (message) {
  try {
    let response = await this.post(
      server + registrationChallenges + "/" + this.id,
      {
        id: this.id,
        status: "PENDING",
        fidoRegistrationResponse: message,
      }
    );

    if (response != null && response.fidoResponseCode == 1200)
      // No error
      this.fido.notifyWithResponse(response.fidoRegistrationResponse);
    else if (response != null && response.fidoResponseCode != undefined)
      this.fido.notifyWithError(
        response.fidoResponseCode,
        response.fidoResponseMsg,
        response.fidoRegistrationRequest
      );
    else this.notifyServerError(response);
  } catch (error) {
    console.error(error);
    this.notifyRequestError(error);
  }
};

IdentityX.prototype.getRegistrationPolicy = async function () {
  try {
    let response = await this.get(
      server + policies + "?status=ACTIVE&policyId=" + regPolicyId
    );

    let items = response != null ? response.items : null;
    if (items != null && items.length > 0) {
      let id = items[0].id;
      let policy = await this.get(server + policies + "/" + id);

      this.fido.notifyWithResponse(JSON.stringify(policy.fidoPolicy));
    } else {
      this.notifyServerError(response);
    }
  } catch (error) {
    console.error(error);
    this.notifyRequestError(error);
  }
};

IdentityX.prototype.getAuthenticationRequest = async function (
  username,
  description
) {
  try {
    let response = await this.post(server + authenticationRequests, {
      policy: {
        policyId: authPolicyId,
        application: {
          applicationId: "mobileteamfido",
        },
      },
      type: "FI",
      description: description,
      user: {
        userId: username,
      },
    });

    //console.log("getAuthenticationRequest: " + JSON.stringify(response))

    if (response != null && response.id != undefined) {
      this.id = response.id;
      this.fido.notifyWithResponse(response.fidoAuthenticationRequest);
    } else {
      this.notifyServerError(response);
    }
  } catch (error) {
    console.error(error);
    this.notifyRequestError(error);
  }
};

IdentityX.prototype.authenticate = async function (message) {
  try {
    let response = await this.post(
      server + authenticationRequests + "/" + this.id,
      {
        id: this.id,
        fidoAuthenticationResponse: message,
      }
    );

    //console.log("authenticate: " + JSON.stringify(response))

    if (response != null && response.fidoResponseCode == 1200)
      // No error
      this.fido.notifyWithResponse(response.fidoAuthenticationResponse);
    else if (response != null && response.fidoResponseCode != undefined)
      this.fido.notifyWithError(
        response.fidoResponseCode,
        response.fidoResponseMsg,
        response.fidoAuthenticationResponse
      );
    else this.notifyServerError(response);
  } catch (error) {
    console.error(error);
    this.notifyRequestError(error);
  }
};

IdentityX.prototype.updateAuthenticationAttempt = async function (
  key,
  code,
  score
) {
  try {
    let response = await this.post(
      server + authenticationRequests + "/" + this.id + "/appendFailedAttempt",
      {
        id: this.id,
        failedClientAttempt: {
          authKeyId: key,
          errorCode: code,
          score: score,
        },
      }
    );
  } catch (error) {
    console.error(error);
  }
};

IdentityX.prototype.getDeRegistrationRequest = async function (
  aaid,
  username,
  application
) {
  try {
    try {
      let authenticator = await this.getAuthenticator(aaid, username);
      if (authenticator != null) {
        let response = await this.post(
          server + authenticators + "/" + authenticator.id + "/archived",
          {}
        );

        //console.log("getDeRegistrationRequest: " + JSON.stringify(response))

        if (response.fidoDeregistrationRequest != undefined)
          this.fido.notifyWithResponse(response.fidoDeregistrationRequest);
        else if (response.fidoResponseCode != undefined)
          this.fido.notifyWithError(
            response.fidoResponseCode,
            response.fidoResponseMsg,
            null
          );
        else this.notifyServerError(response);
      } else {
        this.fido.notifyWithUserNotEnrolledError();
      }
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    console.error(error);
  }
};

IdentityX.prototype.notifyServerError = async function (response) {
  if (response != null && response.httpStatus != undefined) {
    this.fido.notifyWithError(response.code, response.developerMessage, null);
  } else {
    this.fido.notifyWithUnknownError();
  }
};

IdentityX.prototype.notifyRequestError = function (error) {
  this.fido.notifyWithError(0, error != null ? error.message : "Unknown error", null);
};

IdentityX.prototype.getUser = async function (username) {
  try {
    let response = await this.get(server + users + "?userId=" + username);

    if (response.items != undefined) {
      for (i = 0; i < response.items.length; i++) {
        // We do not want an archived user
        if (response.items[i].status == "ACTIVE") return response.items[i];
      }
    }
  } catch (error) {
    console.error(error);
  }

  return null;
};

IdentityX.prototype.archiveUser = async function (username) {
  try {
    let user = await this.getUser(username);
    if (user != null) {
      await this.post(server + users + "/" + user.id + "/archived", {});
    }
  } catch (error) {
    console.error(error);
  }
};

IdentityX.prototype.getAuthenticator = async function (aaid, username) {
  try {
    let user = await this.getUser(username);
    if (user != null) {
      let response = await this.get(
        server + users + "/" + user.id + "/authenticators?limit=1000"
      );

      if (response != undefined) {
        let deviceId = this.fido.deviceIdentifier();

        for (i = 0; i < response.items.length; i++) {
          let authenticator = response.items[i];

          if (authenticator.authenticatorAttestationId == aaid) {
            if (
              authenticator.deviceCorrelationId == "" ||
              authenticator.deviceCorrelationId == deviceId
            ) {
              if (authenticator.status == "ACTIVE") return authenticator;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  return null;
};

IdentityX.prototype.parseResponse = async function (response) {
  let text = await response.text();
  let json = null;

  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      json = {
        httpStatus: response.status,
        code: response.status,
        developerMessage: "Invalid JSON from server: " + error.message,
      };
    }
  }

  if (!response.ok) {
    if (json == null) {
      json = {
        httpStatus: response.status,
        code: response.status,
        developerMessage: response.statusText || "HTTP " + response.status,
      };
    } else if (json.httpStatus == undefined) {
      json.httpStatus = response.status;
      if (json.code == undefined) json.code = response.status;
      if (json.developerMessage == undefined)
        json.developerMessage = response.statusText || "HTTP " + response.status;
    }
  }

  return json;
};

IdentityX.prototype.post = async function (url, body) {
  let authorization = this.authorization();

  try {
    let response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
    });

    return await this.parseResponse(response);
  } catch (error) {
    console.error(error);
    return {
      httpStatus: 0,
      code: 0,
      developerMessage: error.message,
    };
  }
};

IdentityX.prototype.get = async function (url) {
  let authorization = this.authorization();

  try {
    let response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json; charset=utf-8",
        Authorization: authorization,
      },
    });

    return await this.parseResponse(response);
  } catch (error) {
    console.error(error);
    return {
      httpStatus: 0,
      code: 0,
      developerMessage: error.message,
    };
  }
};

IdentityX.prototype.authorization = function () {
  return (
    "Basic " +
    base64.fromByteArray(
      this.map(username + ":" + password, function (char) {
        return char.charCodeAt(0);
      })
    )
  );
};

IdentityX.prototype.map = function (arr, callback) {
  var res = [];
  var kValue, mappedValue;

  for (var k = 0, len = arr.length; k < len; k++) {
    if (typeof arr === "string" && !!arr.charAt(k)) {
      kValue = arr.charAt(k);
      mappedValue = callback(kValue, k, arr);
      res[k] = mappedValue;
    } else if (typeof arr !== "string" && k in arr) {
      kValue = arr[k];
      mappedValue = callback(kValue, k, arr);
      res[k] = mappedValue;
    }
  }
  return res;
};
