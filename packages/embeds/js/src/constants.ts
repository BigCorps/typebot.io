import type { BotProps } from "./components/Bot";
import type { BubbleProps } from "./features/bubble/components/Bubble";
import type { PopupProps } from "./features/popup/components/Popup";

export const defaultBotProps: BotProps = {
  id: undefined,
  typebot: undefined,
  onNewInputBlock: undefined,
  onAnswer: undefined,
  onEnd: undefined,
  onInit: undefined,
  onNewLogs: undefined,
  onChatStatePersisted: undefined,
  onScriptExecutionSuccess: undefined,
  font: undefined,
  progressBarRef: undefined,
  isPreview: undefined,
  startFrom: undefined,
  prefilledVariables: undefined,
  apiHost: undefined,
  wsHost: undefined,
  resultId: undefined,
  sessionId: undefined,
};

export const defaultPopupProps: PopupProps = {
  ...defaultBotProps,
  onClose: undefined,
  onOpen: undefined,
  theme: undefined,
  autoShowDelay: undefined,
  isOpen: undefined,
  defaultOpen: undefined,
};

export const defaultBubbleProps: BubbleProps = {
  ...defaultBotProps,
  onClose: undefined,
  onOpen: undefined,
  theme: undefined,
  previewMessage: undefined,
  onPreviewMessageClick: undefined,
  onPreviewMessageDismissed: undefined,
  autoShowDelay: undefined,
  inlineStyle: undefined,
};
