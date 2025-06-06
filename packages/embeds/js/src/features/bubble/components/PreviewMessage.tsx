import {
  defaultPreviewMessageBackgroundColor,
  defaultPreviewMessageCloseButtonBackgroundColor,
  defaultPreviewMessageCloseButtonIconColor,
  defaultPreviewMessageTextColor,
} from "@typebot.io/theme/constants";
import { cx } from "@typebot.io/ui/lib/cva";
import { Show, createSignal } from "solid-js";
import type {
  BubbleTheme,
  ButtonTheme,
  PreviewMessageParams,
  PreviewMessageTheme,
} from "../types";

export type PreviewMessageProps = Pick<BubbleTheme, "placement"> &
  Pick<PreviewMessageParams, "avatarUrl" | "message"> & {
    buttonSize: ButtonTheme["size"];
    previewMessageTheme?: PreviewMessageTheme;
    onClick: () => void;
    onCloseClick: () => void;
  };

export const PreviewMessage = (props: PreviewMessageProps) => {
  const [isPreviewMessageHovered, setIsPreviewMessageHovered] =
    createSignal(false);
  const [touchStartPosition, setTouchStartPosition] = createSignal({
    x: 0,
    y: 0,
  });

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStartPosition({
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
    });
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const x = e.changedTouches[0]?.clientX ?? 0;
    const y = e.changedTouches[0]?.clientY ?? 0;

    if (
      Math.abs(x - touchStartPosition().x) > 10 ||
      y - touchStartPosition().y > 10
    )
      props.onCloseClick();

    setTouchStartPosition({ x: 0, y: 0 });
  };

  return (
    <div
      part="preview-message"
      onClick={() => props.onClick()}
      class={cx(
        "absolute bottom-[calc(100%+12px)] w-64 rounded-md duration-200 flex items-center gap-4 shadow-md animate-fade-in cursor-pointer hover:shadow-lg p-4",
        props.placement === "left" ? "left-0" : "right-0",
      )}
      style={{
        "background-color":
          props.previewMessageTheme?.backgroundColor ??
          defaultPreviewMessageBackgroundColor,
        color:
          props.previewMessageTheme?.textColor ??
          defaultPreviewMessageTextColor,
      }}
      onMouseEnter={() => setIsPreviewMessageHovered(true)}
      onMouseLeave={() => setIsPreviewMessageHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CloseButton
        isHovered={isPreviewMessageHovered()}
        previewMessageTheme={props.previewMessageTheme}
        onClick={props.onCloseClick}
      />
      <Show when={props.avatarUrl} keyed>
        {(avatarUrl) => (
          <img
            src={avatarUrl}
            class="rounded-full w-8 h-8 object-cover"
            alt="Bot avatar"
            elementtiming={"Bot avatar"}
            fetchpriority={"high"}
          />
        )}
      </Show>
      <p>{props.message}</p>
    </div>
  );
};

const CloseButton = (props: {
  isHovered: boolean;
  previewMessageTheme?: PreviewMessageTheme;
  onClick: () => void;
}) => (
  <button
    part="preview-message-close-button"
    aria-label="Close"
    class={
      `absolute -top-2 -right-2 rounded-full w-6 h-6 p-1 hover:brightness-95 active:brightness-90 transition-all border ` +
      (props.isHovered ? "opacity-100" : "opacity-0")
    }
    onClick={(e) => {
      e.stopPropagation();
      return props.onClick();
    }}
    style={{
      "background-color":
        props.previewMessageTheme?.closeButtonBackgroundColor ??
        defaultPreviewMessageCloseButtonBackgroundColor,
      color:
        props.previewMessageTheme?.closeButtonIconColor ??
        defaultPreviewMessageCloseButtonIconColor,
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  </button>
);
