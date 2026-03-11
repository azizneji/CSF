// support.module.ts
import { Module } from '@nestjs/common'
import { SupportService } from './support.service'
import { SupportController } from './support.controller'

@Module({
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}


// ─── SQL: run in Supabase SQL editor ─────────────────────────────────────────
/*
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  email       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open',  -- open | in_progress | resolved | closed
  admin_note  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Superadmin can see all
CREATE POLICY "superadmin full access" ON public.support_tickets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Anyone can insert
CREATE POLICY "anyone can create ticket" ON public.support_tickets
  FOR INSERT WITH CHECK (true);
*/


// ─── Admin service addition: verifyOrganization ───────────────────────────────
// Add this method to admin.service.ts:
/*
  async verifyOrganization(orgId: string, adminId: string) {
    const { error } = await this.db()
      .from('organizations')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', orgId)
    if (error) throw new BadRequestException(error.message)
    await this.log(adminId, 'verify_organization', 'organization', orgId)
    return { message: 'Organization verified' }
  }
*/

// ─── Admin controller addition ────────────────────────────────────────────────
// Add this route to admin.controller.ts after the Delete organizations/:id route:
/*
  @Patch('organizations/:id/verify')
  @UseGuards(JwtAuthGuard, SuperadminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify an organization (makes it public)' })
  verifyOrg(@Param('id') orgId: string, @CurrentUser() user: any) {
    return this.adminService.verifyOrganization(orgId, user.id)
  }
*/
