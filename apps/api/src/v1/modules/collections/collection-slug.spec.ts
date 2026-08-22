import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import {
  AI_QUEUE,
  USER_METRICS_QUEUE,
} from '@repo/common-lib/constants/queues';
import { API_ERRORS } from '@repo/common-lib/constants/api-errors';
import { ApiException } from 'src/common/exceptions/api-exception';
import { Helpers } from 'src/common/services/helpers.service';
import { RequestService } from 'src/common/services/request.service';
import { CollectionRepository } from './collection.repository';
import { CollectionService } from './collection.service';
import { UserExtraDataService } from '../user-extra-data/user-extra-data.service';

/**
 * Covers the invariants of title-derived, per-user-unique, creation-frozen slugs.
 * Collections stand in for all three entities (portfolios/services/collections share the
 * shape); they are the cheapest to exercise since they have no thumbnail upload.
 */
describe('CollectionService slug derivation', () => {
  let service: CollectionService;
  let collectionRepository: {
    slugExists: jest.Mock;
    titleExists: jest.Mock;
    create: jest.Mock;
    updateById: jest.Mock;
    getOneCompact: jest.Mock;
    countHighlights: jest.Mock;
  };

  const USER_ID = 7;
  const media = [{ id: 1, position: 1 }];

  beforeEach(async () => {
    collectionRepository = {
      slugExists: jest.fn().mockResolvedValue(false),
      titleExists: jest.fn().mockResolvedValue(false),
      create: jest.fn(async (input) => ({ id: 42, ...input })),
      updateById: jest.fn(async (id, input) => ({ id, ...input })),
      getOneCompact: jest.fn(),
      countHighlights: jest.fn().mockResolvedValue(0),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionService,
        { provide: CollectionRepository, useValue: collectionRepository },
        { provide: RequestService, useValue: { user: { id: USER_ID } } },
        {
          provide: UserExtraDataService,
          useValue: { enforceUserLimits: jest.fn() },
        },
        {
          provide: Helpers,
          useValue: {
            deleteCached: jest.fn(),
            deleteManyCached: jest.fn(),
            cacheRemember: jest.fn(),
          },
        },
        { provide: getQueueToken(AI_QUEUE), useValue: { add: jest.fn() } },
        { provide: getQueueToken(USER_METRICS_QUEUE), useValue: { add: jest.fn() } },
      ],
    }).compile();

    service = module.get(CollectionService);
  });

  describe('create', () => {
    it('derives the slug from the title', async () => {
      await service.create({
        title: 'My Work',
        user_id: USER_ID,
        media,
      } as never);

      expect(collectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-work' }),
      );
    });

    it('ignores any slug the client smuggles in and derives from the title', async () => {
      await service.create({
        title: 'My Work',
        slug: 'client-chosen-slug',
        user_id: USER_ID,
        media,
      } as never);

      expect(collectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-work' }),
      );
    });

    it('appends a suffix when the derived slug is taken by the same user', async () => {
      collectionRepository.slugExists.mockImplementation(
        async (candidate: string) => candidate === 'my-work',
      );

      await service.create({
        title: 'My  Work!',
        user_id: USER_ID,
        media,
      } as never);

      expect(collectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'my-work-2' }),
      );
    });

    it('scopes the collision check to the owning user', async () => {
      await service.create({
        title: 'My Work',
        user_id: USER_ID,
        media,
      } as never);

      expect(collectionRepository.slugExists).toHaveBeenCalledWith(
        'my-work',
        USER_ID,
      );
    });

    it('falls back to the entity prefix for a title with no Latin characters', async () => {
      await service.create({
        title: 'Привет',
        user_id: USER_ID,
        media,
      } as never);

      expect(collectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'collection' }),
      );
    });

    it('folds diacritics rather than stripping the accented letters', async () => {
      await service.create({
        title: 'Ação Café',
        user_id: USER_ID,
        media,
      } as never);

      expect(collectionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'acao-cafe' }),
      );
    });

    it('rejects a duplicate title before doing any other work', async () => {
      collectionRepository.titleExists.mockResolvedValue(true);

      await expect(
        service.create({ title: 'My Work', user_id: USER_ID, media } as never),
      ).rejects.toMatchObject({
        API_ERROR_CODE: API_ERRORS.TITLE_ALREADY_EXISTS,
      });

      expect(collectionRepository.slugExists).not.toHaveBeenCalled();
      expect(collectionRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const existing = {
      id: 42,
      user_id: USER_ID,
      title: 'My Work',
      slug: 'my-work',
      is_highlight: false,
    };

    beforeEach(() => {
      collectionRepository.getOneCompact.mockResolvedValue(existing);
    });

    it('never writes slug, so a rename cannot change the public URL', async () => {
      await service.update(42, { title: 'Something Else', media } as never);

      const [, payload] = collectionRepository.updateById.mock.calls[0];
      expect(payload).not.toHaveProperty('slug');
    });

    it('excludes the row itself so re-saving an unchanged title is allowed', async () => {
      await service.update(42, { title: 'My Work', media } as never);

      expect(collectionRepository.titleExists).toHaveBeenCalledWith(
        'My Work',
        USER_ID,
        42,
      );
    });

    it('rejects renaming onto another item of the same user', async () => {
      collectionRepository.titleExists.mockResolvedValue(true);

      await expect(
        service.update(42, { title: 'Taken Title', media } as never),
      ).rejects.toBeInstanceOf(ApiException);

      expect(collectionRepository.updateById).not.toHaveBeenCalled();
    });
  });
});
