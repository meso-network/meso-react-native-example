# meso-react-native

An example integration of Meso's crypto on/off ramp in a React Native WebView.

This repo provides a basic [React Native](https://reactnative.dev/) application that integrates Meso's transfer experience using [react-native-webview](https://github.com/react-native-webview/react-native-webview).

> **Note:** This is not an official SDK, however there are plans to support an official library in the near future.

<details>
  <summary><strong>Contents</strong></summary>
- [meso-react-native](#meso-react-native)
  - [Requirements](#requirements)
    - [Account setup](#account-setup)
  - [Usage](#usage)
  - [Caveats](#caveats)

</details>

## Requirements

### Account setup

To use Meso, you must have a [Meso](https://meso.network) partner
account. You can reach out to
[support@meso.network](mailto:support@meso.network) to sign up. During the
onboarding process, you will need to specify the
[origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin) of your dApp
or web application to ensure the Meso window operates within your application. Meso
will then provide you with a `partnerId` for use with the SDK.

## Usage

The example Meso library lives inside the [meso](./@meso-network/meso-react-native/) package. You can initialize the transfer experience by rendering the `MesoTransfer` component:

```tsx
import { MesoTransfer } from "./@meso-network/meso-react-native";

const App = () => {
  return (
    <MesoTransfer
      configuration={{
        // Add your partnerId here
        partnerId: "YOUR_PARTNER_ID",
        sourceAmount: sourceAmount.value,
        destinationAsset: Asset.SOL,
        network: Network.SOLANA_MAINNET,
        // This is just a placeholder Solana address for testing
        walletAddress: "A_VALID_WALLET_ADDRESS",
        authenticationStrategy: AuthenticationStrategy.WALLET_VERIFICATION,
        environment: Environment.SANDBOX,
        onEvent(event) {
          switch (event.kind) {
            case EventKind.TRANSFER_APPROVED:
            case EventKind.TRANSFER_COMPLETE:
              setTransferDetails(event.payload.transfer);
              setShowMeso(false);
            case EventKind.CLOSE:
              setShowMeso(false);
            case EventKind.CONFIGURATION_ERROR:
            case EventKind.UNSUPPORTED_ASSET_ERROR:
            case EventKind.UNSUPPORTED_NETWORK_ERROR:
            case EventKind.ERROR:
              // Handle configuration error
              console.error(event.payload);
              setShowMeso(false);
          }
        },
        async onSignMessageRequest(messageToSign) {
          // Implement your message signing logic here
          // Returning `undefined` signals the user canceled or rejected the request.
          return undefined;
        },
      }}
    />
  );
};
```

This will render the Meso experience into a WebView into your application. To exit/remove the Meso experience, simply remove it from your component hierarchy.

```tsx
const App = () => {
  const [showMeso, setShowMeso] = useState(false);

  return (
    <View>
      <Button onPress={() => setShowMeso(true)} />

      {showMeso && <MesoTransfer {...props} />}
    </View>
  );
};
```

## Reference

The full reference for the configuration options can be found in the [meso-js docs](https://github.com/meso-network/meso-js/blob/main/packages/meso-js/README.md).
