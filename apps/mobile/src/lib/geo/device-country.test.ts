import { countryForRegion, deviceCountry } from './device-country';
import type * as Localization from 'expo-localization';
const localization = jest.requireMock<typeof Localization>('expo-localization');

it.each([
    ['CO', 'CO'],
    ['de', 'DE'],
    [null, 'ES'],
    [undefined, 'ES'],
    ['419', 'ES'],
    ['ZZ', 'ES'],
])('valida la región %s', (region, expected) => {
    expect(countryForRegion(region)).toBe(expected);
});
it('propone el país del dispositivo sin confundirlo con su idioma', () => {
    jest.spyOn(localization, 'getLocales').mockReturnValue([
        { languageCode: 'es', regionCode: 'CO' } as ReturnType<
            typeof localization.getLocales
        >[number],
    ]);
    expect(deviceCountry()).toBe('CO');
});

afterEach(() => jest.restoreAllMocks());
