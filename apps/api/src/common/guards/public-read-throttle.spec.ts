// Importing the controllers to read their metadata pulls in `users.service`, which imports the
// stripe singleton, which builds a real `Stripe` client at module load. That throws
// "Neither apiKey nor config.authenticator provided" wherever STRIPE_SECRET_KEY is unset - CI
// has no such key, so the suite failed to load there while passing locally. Same mock as
// `auth.service.spec.ts`, for the same reason.
jest.mock('@repo/backend-lib/services/payment-service/stripe', () => ({
  stripe: {},
  stripeWebhookSecret: '',
}));

import { Reflector } from '@nestjs/core';
import { THROTTLER_LIMIT } from '@nestjs/throttler/dist/throttler.constants';
import { PUBLIC_READ_THROTTLE } from 'src/common/utils/constants';
import { UserController } from 'src/v1/modules/users/users.controller';
import { UserCollectionController } from 'src/v1/modules/user-collections/user-collection.controller';
import { UserPortfolioController } from 'src/v1/modules/user-portfolios/user-portfolio.controller';
import { UserServiceController } from 'src/v1/modules/user-services/user-service.controller';

/**
 * The public artist reads are hit several times per page render - `profile` from
 * `generateMetadata`, `exists` from the page body, plus whichever resource list the page
 * shows - and they are all Redis-cached, so the global write-sized budget (10/s) throttled
 * real visitors long before it protected anything. Production 429s on
 * `/users/exists/:username` and `/users/:username/services` are what prompted this.
 *
 * These assertions mirror how `ThrottlerGuard` actually resolves a limit, so they catch a
 * route that silently falls back to the global defaults - which is exactly how `exists`
 * was missed when `findAll` was widened.
 */
describe('public artist reads use PUBLIC_READ_THROTTLE', () => {
  const reflector = new Reflector();

  type ControllerClass = new (...args: never[]) => object;

  /**
   * Same lookup the guard performs: the route's own metadata wins over the controller's.
   * Resolving the handler by name here rather than at the call site keeps a mistyped method
   * from quietly returning `undefined` and making the "stays on the global defaults"
   * assertions below pass for the wrong reason.
   */
  const limitFor = (controller: ControllerClass, method: string) => {
    const handler = (controller.prototype as Record<string, unknown>)[method];

    if (typeof handler !== 'function') {
      throw new Error(`${controller.name}.${method} is not a route handler`);
    }

    return (['short', 'medium', 'long'] as const).map((name) =>
      reflector.getAllAndOverride<number | undefined>(THROTTLER_LIMIT + name, [
        handler,
        controller,
      ]),
    );
  };

  const publicReadLimits = [
    PUBLIC_READ_THROTTLE.short.limit,
    PUBLIC_READ_THROTTLE.medium.limit,
    PUBLIC_READ_THROTTLE.long.limit,
  ];

  const userController: ControllerClass = UserController;

  const publicArtistReads: [string, ControllerClass, string][] = [
    ['UserController', userController, 'findAll'],
    ['UserController', userController, 'getProfile'],
    ['UserController', userController, 'getCompacted'],
    ['UserController', userController, 'usernameExists'],
    ['UserPortfolioController', UserPortfolioController, 'getAllByUsername'],
    ['UserPortfolioController', UserPortfolioController, 'getByUsername'],
    ['UserCollectionController', UserCollectionController, 'getAllByUsername'],
    ['UserCollectionController', UserCollectionController, 'getByUsername'],
    ['UserServiceController', UserServiceController, 'getAllByUsername'],
    ['UserServiceController', UserServiceController, 'getByUsername'],
  ];

  // A plain loop rather than `it.each`: jest types the `each` callback's parameters as `any`,
  // which would discard the checking that `publicArtistReads` is annotated for.
  for (const [name, controller, method] of publicArtistReads) {
    it(`${name}.${method} resolves to the wider public-read budget`, () => {
      expect(limitFor(controller, method)).toEqual(publicReadLimits);
    });
  }

  // Widening is opt-in per route on `UserController` precisely so these do not inherit it:
  // no metadata means the guard falls through to the AppModule defaults.
  for (const method of ['findOne', 'findExtraData']) {
    it(`leaves the authenticated UserController.${method} on the stricter global defaults`, () => {
      expect(limitFor(userController, method)).toEqual([
        undefined,
        undefined,
        undefined,
      ]);
    });
  }
});
