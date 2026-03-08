/**
 * Type declarations for the `tweakcc` package.
 * tweakcc is a Claude Code system-prompt patching utility.
 */
declare module "tweakcc" {
  export interface Installation {
    installPath: string;
    version?: string;
  }

  export interface TweakccConfig {
    [key: string]: unknown;
  }

  export interface HelpersAPI {
    globalReplace(content: string, from: string, to: string): string;
    showDiff(original: string, patched: string): void;
    findChalkVar(content: string): string | null;
    getModuleLoaderFunction(content: string): string | null;
    getReactVar(content: string): string | null;
    getRequireFuncName(content: string): string | null;
    findTextComponent(content: string): string | null;
    findBoxComponent(content: string): string | null;
    clearCaches(): void;
  }

  export const helpers: HelpersAPI;

  export function tryDetectInstallation(): Promise<Installation | null>;
  export function findAllInstallations(): Promise<Installation[]>;
  export function readContent(installation: Installation): Promise<string>;
  export function writeContent(
    installation: Installation,
    content: string
  ): Promise<void>;
  export function backupFile(src: string, dest: string): Promise<void>;
  export function restoreBackup(
    backupPath: string,
    targetPath: string
  ): Promise<void>;
  export function readTweakccConfig(): Promise<TweakccConfig>;
  export function getTweakccConfigDir(): string;
  export function getTweakccConfigPath(): string;
  export function getTweakccSystemPromptsDir(): string;
  export function showInteractiveInstallationPicker(): Promise<
    Installation | null
  >;
}
