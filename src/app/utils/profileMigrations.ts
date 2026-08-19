export const PROFILE_SCHEMA_VERSION = 1;

interface ProfileEnvelope {
  schemaVersion: number;
  profile: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function wrapProfilePayload(profile: unknown): ProfileEnvelope {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    profile,
  };
}

export function unwrapProfilePayload(value: unknown): unknown {
  if (!isRecord(value)) return value;

  if ('schemaVersion' in value && 'profile' in value) {
    const version = value.schemaVersion;
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
      throw new Error('Некорректная версия формата профиля AstroDay.');
    }

    if (version > PROFILE_SCHEMA_VERSION) {
      throw new Error('Профиль создан более новой версией AstroDay и пока не поддерживается.');
    }

    return value.profile;
  }

  // Legacy v0 payload: the profile object itself.
  return value;
}
