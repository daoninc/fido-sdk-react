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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  NativeEventEmitter,
  NativeModules,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { IdentityX } from "./network";

let FIDO = NativeModules.RNFIDOModule;

let Service = new IdentityX(FIDO);

const SDKContext = React.createContext({
  status: "initializing",
  initialize: () => Promise.resolve(false),
});

const colors = {
  background: "#F6F8FC",
  surface: "#FFFFFF",
  ink: "#152238",
  muted: "#66748A",
  subtle: "#8A96A8",
  border: "#E1E7F0",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primarySoft: "#EAF1FF",
  success: "#11875D",
  successSoft: "#E8F7F0",
  danger: "#C2414D",
  dangerSoft: "#FFF0F1",
  overlay: "rgba(15, 23, 42, 0.28)",
};

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
      <View style={styles.busyOverlay} pointerEvents="auto">
        <View style={styles.busyCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.busyTitle}>Working...</Text>
          <Text style={styles.busyCopy}>
            Please wait while the SDK completes this action.
          </Text>
        </View>
      </View>
    );
  }
}

function StatusPill({ label, tone = "neutral" }) {
  return (
    <View
      style={[
        styles.statusPill,
        tone === "success" && styles.statusPillSuccess,
        tone === "loading" && styles.statusPillLoading,
        tone === "danger" && styles.statusPillDanger,
      ]}
    >
      <Text
        style={[
          styles.statusPillText,
          tone === "success" && styles.statusPillTextSuccess,
          tone === "loading" && styles.statusPillTextLoading,
          tone === "danger" && styles.statusPillTextDanger,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "secondary" && styles.actionButtonSecondary,
        variant === "danger" && styles.actionButtonDanger,
        pressed && !disabled && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
    >
      <Text
        style={[
          styles.actionButtonText,
          variant === "secondary" && styles.actionButtonTextSecondary,
          variant === "danger" && styles.actionButtonTextDanger,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function ActionCard({ index, title, description, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && !disabled && styles.actionCardPressed,
        disabled && styles.actionCardDisabled,
      ]}
    >
      <View style={styles.actionIndex}>
        <Text style={styles.actionIndexText}>{index}</Text>
      </View>
      <View style={styles.actionCardCopy}>
        <Text style={styles.actionCardTitle}>{title}</Text>
        <Text style={styles.actionCardDescription}>{description}</Text>
      </View>
      <Text style={styles.actionArrow}>&gt;</Text>
    </Pressable>
  );
}

function ScreenHeader({ navigation, title }) {
  return (
    <View style={styles.screenHeader}>
      <Pressable
        accessibilityLabel={`Go back from ${title}`}
        accessibilityRole="button"
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.backButtonPressed,
        ]}
      >
        <Text style={styles.backArrow}>&lt;</Text>
      </Pressable>
      <Text style={styles.screenHeaderTitle}>{title}</Text>
    </View>
  );
}

//
// Screens
//

function HomeScreen({ navigation, route }) {
  const { status: sdkStatus } = React.useContext(SDKContext);
  const [username, setUsername] = React.useState(
    route.params?.username ?? null
  );

  React.useEffect(() => {
    if (route.params?.username != null) {
      setUsername(route.params.username);
      return undefined;
    }

    let mounted = true;

    AsyncStorage.getItem("username")
      .then((value) => {
        if (!mounted) {
          return;
        }

        setUsername(value ?? createUsername());
      })
      .catch((error) => {
        console.error("Unable to load username", error);
        if (mounted) {
          setUsername(createUsername());
        }
      });

    return () => {
      mounted = false;
    };
  }, [route.params?.username]);

  const ready = username != null && sdkStatus === "ready";
  const statusLabel =
    sdkStatus === "failed" ? "Unavailable" : ready ? "Ready" : "Starting";
  const statusTone =
    sdkStatus === "failed" ? "danger" : ready ? "success" : "loading";

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.homeSafeArea}>
        <ScrollView
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>F</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>DAON FIDO SDK</Text>
              <Text style={styles.brandCaption}>React Native sample</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.heroKicker}>YOUR DIGITAL IDENTITY</Text>
            <Text style={styles.heroTitle}>xAuth FIDO</Text>
            <Text style={styles.heroCopy}>
              Explore biometric and passcode authentication powered by the Daon
              FIDO SDK.
            </Text>
          </View>

          <View style={styles.identityCard}>
            <View style={styles.identityHeader}>
              <Text style={styles.cardLabel}>ACTIVE IDENTITY</Text>
              <StatusPill label={statusLabel} tone={statusTone} />
            </View>
            <Text style={styles.username}>
              {username != null ? username : "Preparing your identity..."}
            </Text>
            <Text style={styles.identityHint}>
              {sdkStatus === "failed"
                ? "SDK initialization failed. Review the error and try again."
                : "This local identity is used for the sample authentication flows."}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Try an authentication flow</Text>
          <ActionCard
            index="01"
            title="Biometric"
            description="Use a fingerprint or face to authenticate."
            disabled={!ready}
            onPress={() => {
              navigation.navigate("Biometric", { username: username });
            }}
          />
          <ActionCard
            index="02"
            title="Passcode"
            description="Register or authenticate with a secure passcode."
            disabled={!ready}
            onPress={() => {
              navigation.navigate("Passcode", { username: username });
            }}
          />

          <Text style={[styles.sectionTitle, styles.secondarySectionTitle]}>
            More tools
          </Text>
          <ActionButton
            title="Discover authenticators"
            variant="secondary"
            disabled={!ready}
            onPress={() => {
              discover();
            }}
          />
          <ActionButton
            title="Settings"
            variant="secondary"
            disabled={username == null}
            onPress={() => {
              navigation.navigate("Settings", { username: username });
            }}
          />

          <Text style={styles.devInstructions}>{instructions}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function PasscodeScreen({ navigation, route }) {
  const username = route.params?.username ?? "";

  const [busy, setBusy] = React.useState(false);
  const [text, setText] = React.useState("");

  const registered = Boolean(username) && FIDO.isPasscodeRegistered(username);

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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader navigation={navigation} title="Passcode" />
          <View style={styles.screenIntro}>
            <View style={styles.screenIcon}>
              <Text style={styles.screenIconText}>P</Text>
            </View>
            <Text style={styles.screenTitle}>Use a passcode</Text>
            <Text style={styles.screenDescription}>
              Add a passcode to this identity or use the one already enrolled.
            </Text>
          </View>

          <View style={styles.stateCard}>
            <View>
              <Text style={styles.cardLabel}>PROFILE STATUS</Text>
              <Text style={styles.stateTitle}>
                {registered ? "Passcode is enrolled" : "No passcode enrolled"}
              </Text>
            </View>
            <StatusPill
              label={registered ? "Active" : "Not set"}
              tone={registered ? "success" : "neutral"}
            />
          </View>

          <Text style={styles.fieldLabel}>YOUR PASSCODE</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="number-pad"
            onChangeText={(value) => setText(value)}
            placeholder="Enter passcode"
            placeholderTextColor={colors.subtle}
            secureTextEntry={true}
            style={styles.textInput}
          />

          <ActionButton
            title={registered ? "Authenticate" : "Register passcode"}
            onPress={() => {
              setBusy(true);

              const request = registered
                ? FIDO.authenticatePasscode(username, text, "Login")
                : FIDO.registerPasscode(username, text);

              request
                .then(() => {
                  done(registered ? "Authenticate" : "Register");
                })
                .catch((e) => {
                  error(registered ? "Authenticate" : "Register", e);
                });
            }}
          />
          {registered && (
            <ActionButton
              title="Remove passcode"
              variant="danger"
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
          )}
          <Text style={styles.helperText}>
            Your passcode is handled by the native FIDO SDK and is never shown
            in this sample.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <ModalBusy busy={busy} />
    </SafeAreaView>
  );
}

function BiometricScreen({ navigation, route }) {
  const username = route.params?.username ?? "";

  const [busy, setBusy] = React.useState(false);

  const registered =
    Boolean(username) && FIDO.isDeviceBiometricRegistered(username);

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
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader navigation={navigation} title="Biometric" />
        <View style={styles.screenIntro}>
          <View style={styles.screenIcon}>
            <Text style={styles.screenIconText}>B</Text>
          </View>
          <Text style={styles.screenTitle}>Use biometrics</Text>
          <Text style={styles.screenDescription}>
            Use the biometric sensor on this device for a fast, private sign-in.
          </Text>
        </View>

        <View style={styles.stateCard}>
          <View>
            <Text style={styles.cardLabel}>PROFILE STATUS</Text>
            <Text style={styles.stateTitle}>
              {registered ? "Biometric is enrolled" : "No biometric enrolled"}
            </Text>
          </View>
          <StatusPill
            label={registered ? "Active" : "Not set"}
            tone={registered ? "success" : "neutral"}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Why use biometrics?</Text>
          <Text style={styles.infoCardCopy}>
            The native SDK keeps the biometric operation on the device, so the
            sample never receives or stores your biometric data.
          </Text>
        </View>

        <ActionButton
          title={registered ? "Authenticate" : "Register biometric"}
          onPress={() => {
            setBusy(true);

            const request = registered
              ? FIDO.authenticateDeviceBiometric(username, "Login")
              : FIDO.registerDeviceBiometric(username);

            request
              .then(() => {
                done(registered ? "Authenticate" : "Register");
              })
              .catch((e) => {
                error(registered ? "Authenticate" : "Register", e);
              });
          }}
        />
        {registered && (
          <ActionButton
            title="Remove biometric"
            variant="danger"
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
        )}
      </ScrollView>
      <ModalBusy busy={busy} />
    </SafeAreaView>
  );
}

function SettingsScreen({ navigation, route }) {
  const username = route.params?.username ?? "Unavailable";
  const { initialize } = React.useContext(SDKContext);

  const [isBusy, setBusy] = React.useState(false);
  const [facetId] = React.useState(() => FIDO.getFacetId() ?? "Unavailable");

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader navigation={navigation} title="Settings" />
        <View style={styles.screenIntro}>
          <View style={styles.screenIcon}>
            <Text style={styles.screenIconText}>S</Text>
          </View>
          <Text style={styles.screenTitle}>Identity details</Text>
          <Text style={styles.screenDescription}>
            Review the identifiers used by this sample application.
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.fieldLabel}>USERNAME</Text>
          <View style={styles.readOnlyField}>
            <Text
              ellipsizeMode="middle"
              numberOfLines={1}
              style={styles.readOnlyValue}
            >
              {username}
            </Text>
          </View>

          <Text style={styles.fieldLabel}>FACET ID</Text>
          <Text selectable={true} style={styles.facetId}>
            {facetId}
          </Text>
          <Text style={styles.helperText}>
            Select and copy this value into the trusted facets configuration in
            the IdentityX Admin Console.
          </Text>
        </View>

        <ActionButton
          title="Reset local enrollment"
          variant="danger"
          onPress={() => {
            setBusy(true);
            reset(username, initialize)
              .then(() => {
                navigation.navigate("Home", {
                  action: "reset",
                  username: createUsername(),
                });
              })
              .catch((e) => {
                Alert.alert("Reset", e.message);
                setBusy(false);
              });
          }}
        />
      </ScrollView>
      <ModalBusy busy={isBusy} />
    </SafeAreaView>
  );
}

//
// FIDO calls
//

async function init() {
  try {
    await FIDO.initialize(true);
    return true;
  } catch (e) {
    Alert.alert("Initialize failed", e.code + ": " + e.message);
    return false;
  }
}

async function discover() {
  try {
    var res = await FIDO.discover();
    var str = "";
    for (let i = 0; i < res.length; i++) {
      str = str + res[i] + "\n";
    }
    Alert.alert("Available authenticators", str);
  } catch (e) {
    Alert.alert("Discover failed", e.code + ": " + e.message);
  }
}

async function reset(username, initialize = init) {
  // Reset the SDK
  await FIDO.reset();

  // Archive the user
  await Service.archiveUser(username);

  await AsyncStorage.removeItem("username");

  // Re-initialize
  return initialize();
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
  const [sdkStatus, setSdkStatus] = React.useState("initializing");

  const initialize = React.useCallback(async () => {
    const initialized = await init();
    setSdkStatus(initialized ? "ready" : "failed");
    return initialized;
  }, []);

  React.useEffect(() => {
    // IXUAFServiceDelegate events, e.g. server communication
    const eventEmitter = new NativeEventEmitter(FIDO);
    const subscriptions = [
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
      }),
      eventEmitter.addListener("registration", (event) => {
        console.log("Event: registration: " + event.type);

        if (event.type == "request")
          Service.getRegistrationRequest(event.username);
        else if (event.type == "response") Service.register(event.message);
        else if (event.type == "policy") Service.getRegistrationPolicy();
      }),
      eventEmitter.addListener("deregistration", (event) => {
        console.log("Event: deregistration: " + event.type);

        Service.getDeRegistrationRequest(
          event.aaid,
          event.username,
          event.application
        );
      }),
    ];

    initialize();

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [initialize]);

  return (
    <SDKContext.Provider value={{ status: sdkStatus, initialize }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Passcode"
            component={PasscodeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Biometric"
            component={BiometricScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SDKContext.Provider>
  );
}

export default App;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  homeContent: {
    paddingBottom: 36,
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  homeSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 36 : 0,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 34,
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
  brandMarkText: {
    color: colors.surface,
    fontSize: 22,
    fontWeight: "800",
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  brandCaption: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3,
  },
  hero: {
    marginBottom: 26,
  },
  heroKicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  heroTitle: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 40,
    maxWidth: 380,
  },
  heroCopy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 390,
  },
  identityCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    padding: 20,
    shadowColor: "#152238",
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  identityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  username: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  identityHint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  statusPill: {
    backgroundColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  statusPillSuccess: {
    backgroundColor: colors.successSoft,
  },
  statusPillLoading: {
    backgroundColor: colors.primarySoft,
  },
  statusPillDanger: {
    backgroundColor: colors.dangerSoft,
  },
  statusPillText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  statusPillTextSuccess: {
    color: colors.success,
  },
  statusPillTextLoading: {
    color: colors.primary,
  },
  statusPillTextDanger: {
    color: colors.danger,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
    marginTop: 32,
  },
  secondarySectionTitle: {
    marginTop: 24,
  },
  actionCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 88,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  actionCardPressed: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionIndex: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    marginRight: 14,
    width: 42,
  },
  actionIndexText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  actionCardCopy: {
    flex: 1,
  },
  actionCardTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "700",
  },
  actionCardDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  actionArrow: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "500",
    marginLeft: 8,
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: "center",
    minHeight: 54,
    marginBottom: 12,
    paddingHorizontal: 18,
  },
  actionButtonSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  actionButtonDanger: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#F7D4D8",
    borderWidth: 1,
  },
  actionButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  actionButtonTextSecondary: {
    color: colors.ink,
  },
  actionButtonTextDanger: {
    color: colors.danger,
  },
  devInstructions: {
    color: colors.subtle,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 20,
    textAlign: "center",
  },
  formContent: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 36 : 20,
  },
  screenHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 28,
  },
  backButton: {
    alignItems: "center",
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    marginRight: 10,
    width: 44,
  },
  backButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  backArrow: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 40,
  },
  screenHeaderTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: "700",
  },
  screenIntro: {
    marginBottom: 26,
  },
  screenIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    height: 46,
    justifyContent: "center",
    marginBottom: 16,
    width: 46,
  },
  screenIconText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  screenDescription: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 9,
  },
  stateCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    padding: 18,
  },
  stateTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
    marginTop: 7,
  },
  fieldLabel: {
    color: colors.subtle,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 9,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 16,
    marginBottom: 18,
    minHeight: 54,
    paddingHorizontal: 16,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  infoCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: 18,
    marginBottom: 24,
    padding: 18,
  },
  infoCardTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "700",
  },
  infoCardCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    padding: 18,
  },
  readOnlyField: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  readOnlyValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  facetId: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 13,
    lineHeight: 19,
    padding: 14,
  },
  busyOverlay: {
    alignItems: "center",
    backgroundColor: colors.overlay,
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  busyCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    elevation: 8,
    maxWidth: 280,
    paddingHorizontal: 26,
    paddingVertical: 24,
    shadowColor: "#152238",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  busyTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 15,
  },
  busyCopy: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
});
