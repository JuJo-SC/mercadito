import type { KeyboardEvent } from "react";

export function submitMessageOnEnter(
  event: KeyboardEvent<HTMLTextAreaElement>,
  sending: boolean,
) {
  // Safari can finish composition before keydown while retaining keyCode 229.
  if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;

  event.preventDefault();
  if (event.repeat || sending || !event.currentTarget.value.trim()) return;

  event.currentTarget.form?.requestSubmit();
}
