import type { LocationInput } from '@repo/common-lib/types/location';
import type { CityRepository } from './city.repository';
import type { CountryRepository } from './country.repository';
import type { LocationRepository } from './location.repository';
import { LocationService } from './location.service';
import type { StateRepository } from './state.repository';

/**
 * `resolve` is what a media create/update calls in-request, so its hierarchy rules decide which
 * place pages a media will ever list under. The repositories are mocked: their single-statement
 * upserts are exercised against Postgres by the migration's verification, not here.
 */
describe('LocationService', () => {
  const countryRepository = { upsertCountry: jest.fn() };
  const stateRepository = { upsertState: jest.fn() };
  const cityRepository = { upsertCity: jest.fn() };
  const locationRepository = { upsertByPlaceId: jest.fn(), getSummaryById: jest.fn() };

  const service = new LocationService(
    countryRepository as unknown as CountryRepository,
    stateRepository as unknown as StateRepository,
    cityRepository as unknown as CityRepository,
    locationRepository as unknown as LocationRepository,
  );

  const pick = (overrides: Partial<LocationInput> = {}): LocationInput => ({
    place_id: ' p-madrid ',
    formatted: ' Madrid, Community of Madrid, Spain ',
    name: ' Madrid ',
    result_type: 'city',
    latitude: 40.4,
    longitude: -3.7,
    country: 'Spain',
    country_code: 'ES',
    state: 'Community of Madrid',
    city: 'Madrid',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    countryRepository.upsertCountry.mockResolvedValue({ id: 1 });
    stateRepository.upsertState.mockResolvedValue({ id: 2 });
    cityRepository.upsertCity.mockResolvedValue({ id: 3 });
    locationRepository.upsertByPlaceId.mockImplementation((row) =>
      Promise.resolve({ id: 9, ...row }),
    );
  });

  it('links the picked place to every hierarchy level it names', async () => {
    const location = await service.resolve(pick());

    expect(countryRepository.upsertCountry).toHaveBeenCalledWith({
      name: 'Spain',
      country_code: 'es',
    });
    expect(stateRepository.upsertState).toHaveBeenCalledWith({
      country_id: 1,
      name: 'Community of Madrid',
    });
    expect(cityRepository.upsertCity).toHaveBeenCalledWith({
      country_id: 1,
      state_id: 2,
      name: 'Madrid',
    });
    expect(locationRepository.upsertByPlaceId).toHaveBeenCalledWith({
      place_id: 'p-madrid',
      formatted: 'Madrid, Community of Madrid, Spain',
      name: 'Madrid',
      result_type: 'city',
      latitude: 40.4,
      longitude: -3.7,
      country_id: 1,
      state_id: 2,
      city_id: 3,
    });
    expect(location.id).toBe(9);
  });

  it('keeps a city the geocoder gave no state for', async () => {
    await service.resolve(pick({ state: null, city: 'Monaco', country: 'Monaco', country_code: 'mc' }));

    expect(stateRepository.upsertState).not.toHaveBeenCalled();
    expect(cityRepository.upsertCity).toHaveBeenCalledWith({
      country_id: 1,
      state_id: null,
      name: 'Monaco',
    });
    expect(locationRepository.upsertByPlaceId).toHaveBeenCalledWith(
      expect.objectContaining({ state_id: null, city_id: 3 }),
    );
  });

  it('stores a country-level pick with no state or city', async () => {
    await service.resolve(pick({ state: undefined, city: undefined, result_type: 'country' }));

    expect(stateRepository.upsertState).not.toHaveBeenCalled();
    expect(cityRepository.upsertCity).not.toHaveBeenCalled();
    expect(locationRepository.upsertByPlaceId).toHaveBeenCalledWith(
      expect.objectContaining({ country_id: 1, state_id: null, city_id: null }),
    );
  });

  it('refuses a place with no country', async () => {
    await expect(service.resolve(pick({ country: '  ' }))).rejects.toThrow('A location needs a country');
    expect(locationRepository.upsertByPlaceId).not.toHaveBeenCalled();
  });
});
