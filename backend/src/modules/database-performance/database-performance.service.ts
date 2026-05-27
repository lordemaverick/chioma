import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabasePerformanceService {
  private readonly logger = new Logger(DatabasePerformanceService.name);

  constructor(private readonly dataSource: DataSource) {}

  async getIndexUsage() {
    return this.dataSource.query(`
      SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC;
    `);
  }

  async getIndexSizes() {
    return this.dataSource.query(`
      SELECT
          tablename,
          indexname,
          pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
          pg_relation_size(indexrelid) as index_size_bytes
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY pg_relation_size(indexrelid) DESC;
    `);
  }

  async getTableSizes() {
    return this.dataSource.query(`
      SELECT
          relname as table_name,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size,
          pg_size_pretty(pg_relation_size(relid)) as table_size,
          pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as external_size,
          pg_total_relation_size(relid) as total_size_bytes
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(relid) DESC;
    `);
  }

  async getSlowQueries(limit = 10) {
    try {
      return await this.dataSource.query(
        `
        SELECT
            query,
            calls,
            total_exec_time,
            min_exec_time,
            max_exec_time,
            mean_exec_time,
            stddev_exec_time,
            rows,
            shared_blks_hit,
            shared_blks_read
        FROM pg_stat_statements
        ORDER BY total_exec_time DESC
        LIMIT $1;
      `,
        [limit],
      );
    } catch (error) {
      this.logger.warn(
        'pg_stat_statements not available or accessible:',
        error.message,
      );
      return [];
    }
  }

  async getDatabaseSettings() {
    const settings = [
      'max_connections',
      'shared_buffers',
      'effective_cache_size',
      'maintenance_work_mem',
      'checkpoint_completion_target',
      'wal_buffers',
      'default_statistics_target',
      'random_page_cost',
      'effective_io_concurrency',
      'work_mem',
      'min_wal_size',
      'max_wal_size',
    ];

    return this.dataSource.query(
      `
      SELECT name, setting, unit, description
      FROM pg_settings
      WHERE name = ANY($1);
    `,
      [settings],
    );
  }

  async getPerformanceReport() {
    const [indexUsage, indexSizes, tableSizes, slowQueries, settings] =
      await Promise.all([
        this.getIndexUsage(),
        this.getIndexSizes(),
        this.getTableSizes(),
        this.getSlowQueries(),
        this.getDatabaseSettings(),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      indexUsage,
      indexSizes,
      tableSizes,
      slowQueries,
      settings,
    };
  }
}
