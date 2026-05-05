import type { WizardPrompter } from "../wizard/prompts.js";
import type { SecretInputMode } from "./provider-auth-types.js";

export type SecretInputModePromptCopy = {
  modeMessage?: string;
  plaintextLabel?: string;
  plaintextHint?: string;
  refLabel?: string;
  refHint?: string;
};

export async function resolveSecretInputModeForEnvSelection(params: {
  prompter: Pick<WizardPrompter, "select">;
  explicitMode?: SecretInputMode;
  copy?: SecretInputModePromptCopy;
}): Promise<SecretInputMode> {
  if (params.explicitMode) {
    return params.explicitMode;
  }
  if (typeof params.prompter.select !== "function") {
    return "plaintext";
  }
  const selected = await params.prompter.select<SecretInputMode>({
    message: params.copy?.modeMessage ?? "Как вы хотите передать этот API-ключ?",
    initialValue: "plaintext",
    options: [
      {
        value: "plaintext",
        label: params.copy?.plaintextLabel ?? "Вставить API-ключ сейчас",
        hint: params.copy?.plaintextHint ?? "Сохраняет ключ прямо в конфигурации OpenClaw",
      },
      {
        value: "ref",
        label: params.copy?.refLabel ?? "Использовать внешний секретный провайдер",
        hint:
          params.copy?.refHint ??
          "Сохраняет ссылку на переменную окружения или настроенный внешний провайдер секретов",
      },
    ],
  });
  return selected === "ref" ? "ref" : "plaintext";
}
