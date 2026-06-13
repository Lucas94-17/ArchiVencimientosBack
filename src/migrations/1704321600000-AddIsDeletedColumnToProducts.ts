import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsDeletedColumnToProducts1704321600000 implements MigrationInterface {
  name = "ADD_IS_DELETED_COLUMN_TO_PRODUCTS_1704321600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "is_deleted" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_deleted"`);
  }
}
