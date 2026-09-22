/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Version: 1.1.28 06-04-2020
 *
 * @format
 * @flow
 */

import * as React from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  NativeEventEmitter,
  NativeModules,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { IdentityX } from "./network";

let FIDO = NativeModules.RNFIDOModule;

let Service = new IdentityX(FIDO);

const instructions = Platform.select({
  ios: "Press Cmd+R to reload,\n" + "Cmd+D or shake for dev menu\n",
  android:
    "Double tap R on your keyboard to reload,\n" +
    "Shake or press menu button for dev menu\n",
});

//
// Components
//

class ModalBusy extends React.Component {
  render() {
    if (!this.props.busy) {
      return null;
    }

    return (
      <View style={styles.indicator} pointerEvents="auto">
        <ActivityIndicator size="large" animating={true} />
        <Text style={styles.title}>Please wait... </Text>
      </View>
    );
  }
}

//
// Screens
//

function HomeScreen({ navigation, route }) {
  const action = route.params != null ? route.params.action : "none";
  console.log("Home: Action: " + action);

  const [username, setUsername] = React.useState("NA");

  AsyncStorage.getItem("username").then((value) => {
    if (value !== null) {
      setUsername(value);
    } else {
      setUsername(createUsername());
    }
  });

  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.welcome}>Daon FIDO React Native</Text>
        <Text style={styles.instructions}>{instructions}</Text>
        <Text style={styles.instructions}>Username</Text>
        <Text style={{ textAlign: "center", fontWeight: "bold" }}>
          {username}
        </Text>
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-evenly",
        }}
      >
        <Button
          title="Biometric"
          onPress={() => {
            navigation.navigate("Biometric", { username: username });
          }}
        />

        <Button
          title="Passcode"
          onPress={() => {
            navigation.navigate("Passcode", { username: username });
          }}
        />

        <Button
          title="Discover"
          onPress={() => {
            discover();
          }}
        />

        <Button
          title="Settings"
          onPress={() => {
            navigation.navigate("Settings", { username: username });
          }}
        />
      </View>
    </View>
  );
}

function PasscodeScreen({ navigation, route }) {
  const { username } = route.params;

  const [busy, setBusy] = React.useState(false);
  const [text, setText] = React.useState("");

  const registered = FIDO.isPasscodeRegistered(username);

  function done(title) {
    Alert.alert(title, "Success");
    navigation.goBack();
  }

  function error(title, e) {
    Alert.alert(title, e.code + ": " + e.message, [
      { text: "OK", onPress: () => setBusy(false) },
    ]);
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <View style={styles.indicator}>
        <ModalBusy busy={busy} />
      </View>
      <Text style={styles.title}>Enter passcode </Text>
      <TextInput
        style={styles.input}
        secureTextEntry={true}
        placeholder="Type passcode here!"
        onChangeText={(text) => setText(text)}
      />

      {registered ? (
        <View style={styles.buttons}>
          <Button
            title="Authenticate"
            onPress={() => {
              setBusy(true);

              FIDO.authenticatePasscode(username, text, "Login")
                .then(() => {
                  done("Authenticate");
                })
                .catch((e) => {
                  error("Authenticate", e);
                });
            }}
          />
          <View style={{ width: 5 }}></View>
          <Button
            title="Deregister"
            onPress={() => {
              setBusy(true);

              FIDO.deregisterPasscode(username)
                .then(() => {
                  done("Deregister");
                })
                .catch((e) => {
                  error("Deregister", e);
                });
            }}
          />
        </View>
      ) : (
        <Button
          title="Register"
          onPress={() => {
            setBusy(true);

            FIDO.registerPasscode(username, text)
              .then(() => {
                done("Register");
              })
              .catch((e) => {
                error("Register", e);
              });
          }}
        />
      )}
    </View>
  );
}

function BiometricScreen({ navigation, route }) {
  const { username } = route.params;

  const [busy, setBusy] = React.useState(false);

  const registered = FIDO.isDeviceBiometricRegistered(username);

  function done(title) {
    navigation.goBack();
    Alert.alert(title, "Success");
  }

  function error(title, e) {
    navigation.goBack();
    Alert.alert(title, e.code + ": " + e.message, [
      { text: "OK", onPress: () => setBusy(false) },
    ]);
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
      }}
    >
      <View style={styles.indicator}>
        <ModalBusy busy={busy} />
      </View>

      <Text style={styles.title}>Biometrics</Text>

      {registered ? (
        <View style={styles.buttons}>
          <Button
            title="Authenticate"
            onPress={() => {
              setBusy(true);

              FIDO.authenticateDeviceBiometric(username, "Login")
                .then(() => {
                  done("Authenticate");
                })
                .catch((e) => {
                  error("Authenticate", e);
                });
            }}
          />
          <View style={{ width: 5 }}></View>
          <Button
            title="Deregister"
            onPress={() => {
              setBusy(true);

              FIDO.deregisterDeviceBiometric(username)
                .then(() => {
                  done("Deregister");
                })
                .catch((e) => {
                  error("Deregister", e);
                });
            }}
          />
        </View>
      ) : (
        <Button
          title="Register"
          onPress={() => {
            setBusy(true);

            FIDO.registerDeviceBiometric(username)
              .then(() => {
                done("Register");
              })
              .catch((e) => {
                error("Register", e);
              });
          }}
        />
      )}
    </View>
  );
}

function SettingsScreen({ navigation, route }) {
  const { username } = route.params;

  const [isBusy, setBusy] = React.useState(false);
  const [facetId] = React.useState(() => FIDO.getFacetId() ?? "Unavailable");

  return (
    <View style={styles.settings}>
      <View style={styles.indicator}>
        <ModalBusy busy={isBusy} />
      </View>
      <Text>Username:</Text>
      <TextInput
        style={[styles.input, styles.settingsInput]}
        maxLength={40}
        placeholder="username"
        editable={false}
        defaultValue={username}
      />
      <Text>Facet ID:</Text>
      <Text selectable={true} style={styles.facetId}>
        {facetId}
      </Text>
      <Button
        title="Reset"
        onPress={() => {
          setBusy(true);
          reset(username)
            .then(() => {
              navigation.navigate("Home", { action: "reset" });
            })
            .catch((e) => {
              Alert.alert("Reset", e.message);
              setBusy(false);
            });
        }}
      />
    </View>
  );
}

//
// FIDO calls
//

async function init() {
  try {
    var res = await FIDO.initialize(true);
    if (res == 0)
      Alert.alert("Initialize", "The SDK was successfully initialized.");
    else
      Alert.alert(
        "Initialized",
        "The SDK was initialized with the return code: " + res
      );
  } catch (e) {
    Alert.alert("Initialize failed", e.code + ": " + e.message);
  }
}

async function discover() {
  try {
    var res = await FIDO.discover();
    var str = "";
    for (i = 0; i < res.length; i++) {
      str = str + res[i] + "\n";
    }
    Alert.alert("Available authenticators", str);
  } catch (e) {
    console.error(e);
  }
}

async function reset(username) {
  // Reset the SDK
  await FIDO.reset();

  // Archive the user
  await Service.archiveUser(username);

  await AsyncStorage.removeItem("username");

  // Re-initialize
  await init();
}

// Helper

function createUsername() {
  var name = "RN-" + uuid().toUpperCase();
  AsyncStorage.setItem("username", name);
  return name;
}

function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// App

const Stack = createStackNavigator();

function App() {
  // IXUAFServiceDelegate events, e.g. server communication

  const eventEmitter = new NativeEventEmitter(FIDO);

  eventEmitter.addListener("authentication", (event) => {
    console.log("Event: authentication: " + event.type);

    if (event.type == "request")
      Service.getAuthenticationRequest(event.username, event.description);
    else if (event.type == "response") Service.authenticate(event.message);
    else if (event.type == "attempt")
      Service.updateAuthenticationAttempt(
        event.userAuthKeyId,
        event.errorCode,
        event.score
      );
  });

  eventEmitter.addListener("registration", (event) => {
    console.log("Event: registration: " + event.type);

    if (event.type == "request") Service.getRegistrationRequest(event.username);
    else if (event.type == "response") Service.register(event.message);
    else if (event.type == "policy") Service.getRegistrationPolicy();
  });

  eventEmitter.addListener("deregistration", (event) => {
    console.log("Event: deregistration: " + event.type);

    Service.getDeRegistrationRequest(
      event.aaid,
      event.username,
      event.application
    );
  });

  // Initialize FIDO SDK
  init();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />
        <Stack.Screen
          name="Passcode"
          component={PasscodeScreen}
          options={{ title: "Passcode" }}
        />
        <Stack.Screen
          name="Biometric"
          component={BiometricScreen}
          options={{ title: "Biometric" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "Settings" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  settings: {
    flex: 1,
    flexDirection: "column",
    marginLeft: 5,
    marginRight: 5,
    backgroundColor: "#F5FCFF",
  },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
    margin: 10,
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
    margin: 10,
  },
  input: {
    marginTop: 5,
    marginBottom: 25,
    padding: 5,
    minWidth: 200,
    backgroundColor: "#CCCCCC",
  },
  settingsInput: {
    marginBottom: 5,
  },
  facetId: {
    marginTop: 5,
    marginBottom: 25,
    padding: 5,
    minWidth: 200,
    backgroundColor: "#CCCCCC",
  },
  buttons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  indicator: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
