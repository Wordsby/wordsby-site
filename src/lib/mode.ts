import { settings } from './settings';

export type Mode = 'build' | 'care';

/** Which half of this site's life the repo is in. See content/settings.yaml. */
export const mode: Mode = settings.mode;

export const isBuildMode = mode === 'build';
