import {
  AuthenticationStrategy,
  Environment,
  EventKind,
  Layout,
  MessageKind,
  Position,
  SerializedTransferIframeParams,
  TransferConfiguration,
  TransferExperienceMode,
  TransferStatus,
} from "@meso-network/meso-js";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import WebView, { WebViewMessageEvent } from "react-native-webview";
import { validateTransferConfiguration } from "./validateTransferConfiguration";

const DEFAULT_LAYOUT: Required<Layout> = {
  position: Position.TOP_RIGHT,
  offset: "0",
};

const serializeConfiguration = (
  configuration: TransferConfiguration
): SerializedTransferIframeParams => {
  const mergedLayout = { ...DEFAULT_LAYOUT, ...configuration.layout };

  return {
    partnerId: configuration.partnerId,
    network: configuration.network,
    walletAddress: configuration.walletAddress,
    sourceAmount: configuration.sourceAmount,
    destinationAsset: configuration.destinationAsset,
    layoutPosition: mergedLayout.position,
    layoutOffset:
      typeof mergedLayout.offset === "string"
        ? mergedLayout.offset
        : JSON.stringify(mergedLayout.offset),
    version: `react-native:${Platform.OS}`,
    authenticationStrategy:
      configuration.authenticationStrategy ??
      AuthenticationStrategy.WALLET_VERIFICATION,
    mode: TransferExperienceMode.WEBVIEW,
  };
};

const getBaseUrl = (environment: Environment): string => {
  switch (environment) {
    case Environment.SANDBOX:
      return "https://api.sandbox.meso.network";
    case Environment.PRODUCTION:
      return "https://api.meso.network";
  }

  throw new Error(`Unable to determine host for ${environment}.`);
};

/**
 * Present a Meso transfer UI via a WebView.
 */
export const MesoTransfer = ({
  configuration,
}: {
  configuration: TransferConfiguration;
}) => {
  const [webViewIsReady, setWebViewIsReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (validateTransferConfiguration(configuration)) {
      setWebViewIsReady(true);
      return;
    }
  }, []);

  if (!webViewIsReady) {
    return <></>;
  }

  return (
    <WebView
      ref={webViewRef}
      webviewDebuggingEnabled={true}
      source={{
        uri: `${getBaseUrl(
          configuration.environment
        )}/app?${new URLSearchParams(serializeConfiguration(configuration))}`,
      }}
      onMessage={async (event: WebViewMessageEvent) => {
        // Attempt to parse message
        if (event.nativeEvent.data.trim().startsWith("{")) {
          const parsedData = JSON.parse(event.nativeEvent.data);
          if (parsedData.kind === MessageKind.REQUEST_SIGNED_MESSAGE) {
            const result = await configuration.onSignMessageRequest(
              parsedData.payload.messageToSign
            );

            if (webViewRef.current) {
              webViewRef.current.postMessage(
                JSON.stringify({
                  kind: MessageKind.RETURN_SIGNED_MESSAGE_RESULT,
                  payload: { signedMessage: result },
                })
              );
            }
          } else {
            if (parsedData.kind === MessageKind.TRANSFER_UPDATE) {
              configuration.onEvent({
                kind:
                  parsedData.payload.status === TransferStatus.APPROVED
                    ? EventKind.TRANSFER_APPROVED
                    : EventKind.TRANSFER_COMPLETE,
                payload: { transfer: parsedData.payload },
              });
            }
            configuration.onEvent(parsedData);
          }
        }
        // Otherwise, just drop the message on the floor.
      }}
    />
  );
};
