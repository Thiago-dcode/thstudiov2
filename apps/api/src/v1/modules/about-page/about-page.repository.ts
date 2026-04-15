import { LogService } from '@repo/backend-lib/services/log-service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '@repo/database/repositories';
import { AboutPageSchemaColumns } from '@repo/common-lib/schemas/about-page';
import {
  AboutPage,
  CreateAboutPageInput,
  UpdateAboutPageInput,
} from '@repo/common-lib/types/about-page';

@Injectable()
export class AboutPageRepositoy extends BaseRepository {
  private readonly COLUMNS: AboutPageSchemaColumns[] = [
    'about_page.id',
    'about_page.title',
    'about_page.photo',
    'about_page.description',
  ];
  constructor(protected readonly logService: LogService) {
    super('about_page', logService, {
      softDelete: false,
    });
  }

  public async getOneById(id: number) {
    return await this.query()
      .select(this.COLUMNS)
      .where('id', '=', id)
      .first<AboutPage>();
  }

  public async getFirstByUser(id: number) {
    return await this.query()
      .select(this.COLUMNS)
      .where('user_id', '=', id)
      .first<AboutPage>();
  }

  public async create(data: CreateAboutPageInput) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    return await this.query().insertAndGet<AboutPage>(
      columns,
      values,
      this.COLUMNS,
    );
  }
  public async updateAndGet(id: number, data: UpdateAboutPageInput) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    if (columns.length)
      await this.query().where('id', '=', id).update(columns, values);
    return this.query()
      .where('id', '=', id)
      .select(this.COLUMNS)
      .first<AboutPage>();
  }
}
