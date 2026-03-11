import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { EnterprisesModule } from './enterprises/enterprises.module'
import { ConnectionsModule } from './connections/connections.module'
import { SupabaseModule } from './supabase/supabase.module'
import { FeedModule } from './feed/feed.module'
import { OpportunitiesModule } from './opportunities/opportunities.module'
import { KnowledgeModule } from './knowledge/knowledge.module'
import { ActivitiesModule } from './activities/activities.module'
import { UploadsModule } from './uploads/uploads.module'
// v2 modules
import { AdminModule } from './admin/admin.module'
import { CompressionModule } from './compression/compression.module'
import { ProfileModule } from './profile/profile.module'
import { ProjectsModule } from './projects/projects.module'
import { VerificationModule } from './verification/verification.module'
import { ServicesModule } from './services/services.module'
import { SupportModule } from './support/support.module'
import { NotificationsModule } from './notifications/notifications.module'
import { SearchModule } from './search/search.module'
import { MessagingModule } from './messaging/messaging.module'
 // analytics
import { AnalyticsModule } from './analytics/analytics.module'
import { PlatformAnalyticsModule } from './platform-analytics/platform-analytics.module'
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    CompressionModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    EnterprisesModule,
    ConnectionsModule,
    FeedModule,
    OpportunitiesModule,
    KnowledgeModule,
    ActivitiesModule,
    UploadsModule,
    // v2
    AdminModule,
    ProfileModule,
    ProjectsModule,
    VerificationModule,
    ServicesModule,
    SupportModule,
    NotificationsModule,
    SearchModule,
    MessagingModule,
    AnalyticsModule,
    PlatformAnalyticsModule,
  ],
})
export class AppModule {}