import { COUNTRY_CODES } from '@navis/shared';
import { getLocales } from 'expo-localization';

export function countryForRegion(region: string | null | undefined): string {
    const code = region?.toUpperCase();
    return code && COUNTRY_CODES.some((country) => country === code) ? code : 'ES';
}
export function deviceCountry(): string {
    return countryForRegion(getLocales()[0]?.regionCode);
}
