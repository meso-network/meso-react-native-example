import { useCallback, useState } from "react";
import {
  Button,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MesoTransfer } from "./@meso-network/meso-react-native";
import {
  Asset,
  AuthenticationStrategy,
  Environment,
  EventKind,
  Network,
  Transfer,
} from "@meso-network/meso-js";

const availableAmounts = [
  { value: "50", display: "$50" },
  { value: "100", display: "$100" },
  { value: "200", display: "$200" },
  { value: "500", display: "$500" },
  { value: "1000", display: "$1,000" },
  { value: "0", display: "Custom" },
] as const;

export default function App() {
  const [showMeso, setShowMeso] = useState(false);
  const [transferDetails, setTransferDetails] = useState<Transfer>();
  const [sourceAmount, setSourceAmount] = useState<
    (typeof availableAmounts)[number]
  >(availableAmounts[0]);

  const toggleMeso = useCallback(() => {
    setShowMeso(!showMeso);
  }, [showMeso]);

  return (
    // TODO: `SafeAreaView` only works in iOS (https://reactnative.dev/docs/safeareaview)
    <SafeAreaView style={styles.container}>
      <View style={{ opacity: showMeso ? 0.4 : 1, padding: 20 }}>
        {/* <View style={{ backgroundColor: "blue", borderRadius: 20 }}> */}
        {availableAmounts.map((amount) => {
          return (
            <Button
              key={amount.value}
              title={amount.display}
              onPress={() => setSourceAmount(amount)}
              color={sourceAmount.value === amount.value ? "blue" : "gray"}
              disabled={amount.display === "Custom"}
            />
          );
        })}
        <View>
          <Button title={`Buy ${sourceAmount.display}`} onPress={toggleMeso} />
        </View>
      </View>
      {showMeso ? (
        <Modal animationType="none" transparent={true} visible={true}>
          <MesoTransfer
            configuration={{
              // Add your partnerId here
              partnerId: "YOUR_PARTNER_ID",
              sourceAmount: sourceAmount.value,
              destinationAsset: Asset.SOL,
              network: Network.SOLANA_MAINNET,
              // This is just a placeholder Solana address for testing
              walletAddress: "EN9B5dFJSn78KMGMaP3CwshiRm6B82GnaDJrd7qEFig2",
              authenticationStrategy:
                AuthenticationStrategy.WALLET_VERIFICATION,
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
        </Modal>
      ) : (
        <>
          {transferDetails && (
            <Text>{JSON.stringify(transferDetails, null, 2)}</Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 100,
  },
});
