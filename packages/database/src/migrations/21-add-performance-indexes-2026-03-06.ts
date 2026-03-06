import { Schema } from '../lib/facades';

const up = async () => {
  // Add indexes for frequently queried tables based on repository usage patterns

  // Plan subscriptions - active subscription lookups
  await Schema.table('plan_subscriptions').createIndexIfNotExists(
    ['user_id', 'is_active']
  );

  // Plan prices - foreign key joins from plans
  await Schema.table('plan_prices').createIndexIfNotExists(
    'plan_id'
  );

  // Portfolios - slug existence checks and user listings
  await Schema.table('portfolios').createIndexIfNotExists(
    ['user_id', 'slug']
  );

  // Portfolios - paginated user listings with recent ordering
  await Schema.table('portfolios').createIndexIfNotExists(
    ['user_id', 'created_at DESC']
  );

  // Media - user media listings with recent ordering
  await Schema.table('media').createIndexIfNotExists(
    ['user_id', 'created_at DESC']
  );

  // User auth devices - device reuse detection
  await Schema.table('user_auth_devices').createIndexIfNotExists(
    ['user_id', 'user_agent', 'ip_address']
  );

  // User sessions - session lookups with optional token
  await Schema.table('user_sessions').createIndexIfNotExists(
    ['user_id', 'token']
  );

  // Password recovery attempts - user-specific non-expired attempts
  await Schema.table('password_recovery_attempts').createIndexIfNotExists(
    ['user_id', 'expires_at']
  );

  // User storage requests - daily usage tracking
  await Schema.table('user_storage_requests').createIndexIfNotExists(
    ['user_id', 'created_at']
  );

  // LLM tokens usage - user usage tracking and metrics aggregation
  await Schema.table('llm_tokens_usage').createIndexIfNotExists(
    ['user_id', 'created_at DESC']
  );

  // Media moderations - user moderation tracking and strike counting
  await Schema.table('media_moderations').createIndexIfNotExists(
    ['user_id', 'is_allowed', 'created_at DESC']
  );

  // Projects, services, clients - user metrics counting (bulk operations)
  await Schema.table('projects').createIndexIfNotExists(
    'user_id'
  );

  await Schema.table('services').createIndexIfNotExists(
    'user_id'
  );

  await Schema.table('clients').createIndexIfNotExists(
    'user_id'
  );
};

const down = async () => {
  // Drop indexes in reverse order

  await Schema.table('clients').dropIndexIfExists('idx_clients_user_id');
  await Schema.table('services').dropIndexIfExists('idx_services_user_id');
  await Schema.table('projects').dropIndexIfExists('idx_projects_user_id');

  await Schema.table('media_moderations').dropIndexIfExists('idx_media_moderations_user_id_is_allowed_created_at');
  await Schema.table('llm_tokens_usage').dropIndexIfExists('idx_llm_tokens_usage_user_id_created_at');

  await Schema.table('user_storage_requests').dropIndexIfExists('idx_user_storage_requests_user_id_created_at');
  await Schema.table('password_recovery_attempts').dropIndexIfExists('idx_password_recovery_attempts_user_id_expires_at');
  await Schema.table('user_sessions').dropIndexIfExists('idx_user_sessions_user_id_token');
  await Schema.table('user_auth_devices').dropIndexIfExists('idx_user_auth_devices_user_id_user_agent_ip_address');

  await Schema.table('media').dropIndexIfExists('idx_media_user_id_created_at');
  await Schema.table('portfolios').dropIndexIfExists('idx_portfolios_user_id_created_at');
  await Schema.table('portfolios').dropIndexIfExists('idx_portfolios_user_id_slug');

  await Schema.table('plan_prices').dropIndexIfExists('idx_plan_prices_plan_id');
  await Schema.table('plan_subscriptions').dropIndexIfExists('idx_plan_subscriptions_user_id_is_active');
};

export { up, down };