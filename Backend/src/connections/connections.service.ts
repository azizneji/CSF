import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common'
import { SupabaseService } from '../supabase/supabase.service'
import { NotificationsService } from '../notifications/notifications.service'
import { CreateConnectionDto, UpdateConnectionDto, ConnectionStatus } from './dto/connection.dto'

@Injectable()
export class ConnectionsService {
  constructor(
    private supabase: SupabaseService,
    private notifications: NotificationsService,
  ) {}

  async requestConnection(dto: CreateConnectionDto) {
    const db = this.supabase.getAdminClient()

    // Check if connection already exists
    const { data: existing } = await db
      .from('connections')
      .select('id, status')
      .or(
        `and(requester_id.eq.${dto.requester_id},target_id.eq.${dto.target_id}),` +
        `and(requester_id.eq.${dto.target_id},target_id.eq.${dto.requester_id})`
      )
      .single()

    if (existing) {
      throw new BadRequestException(`A connection already exists with status: ${existing.status}`)
    }

    const { data, error } = await db
      .from('connections')
      .insert({
        requester_type: dto.requester_type,
        requester_id: dto.requester_id,
        target_type: dto.target_type,
        target_id: dto.target_id,
        status: ConnectionStatus.PENDING,
      })
      .select()
      .single()

    if (error) {
      throw new BadRequestException(error.message)
    }

    // 🔔 Notify target of connection request
    await this.notifications.onConnectionRequest(dto.requester_id, dto.target_id)

    return data
  }

  async respondToConnection(connectionId: string, userId: string, dto: UpdateConnectionDto) {
    const db = this.supabase.getAdminClient()

    const { data: connection, error } = await db
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      throw new NotFoundException('Connection not found')
    }

    if (connection.status !== ConnectionStatus.PENDING) {
      throw new BadRequestException('This connection has already been responded to')
    }

    // Only the target can respond
    if (connection.target_id !== userId) {
      throw new ForbiddenException('Only the connection target can respond')
    }

    const { data, error: updateError } = await db
      .from('connections')
      .update({ status: dto.status, updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single()

    if (updateError) {
      throw new BadRequestException(updateError.message)
    }

    // 🔔 Notify requester if accepted + check 10-connection milestone for both
    if (dto.status === ConnectionStatus.ACCEPTED) {
      await this.notifications.onConnectionAccepted(connection.requester_id, userId)
    }

    return data
  }

  async getConnectionsForActor(actorId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${actorId},target_id.eq.${actorId}`)
      .eq('status', ConnectionStatus.ACCEPTED)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async getPendingConnections(actorId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('connections')
      .select('*')
      .eq('target_id', actorId)
      .eq('status', ConnectionStatus.PENDING)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return data
  }

  async deleteConnection(connectionId: string, userId: string) {
    const db = this.supabase.getAdminClient()

    const { data: connection } = await db
      .from('connections')
      .select('requester_id, target_id')
      .eq('id', connectionId)
      .single()

    if (!connection) {
      throw new NotFoundException('Connection not found')
    }

    if (connection.requester_id !== userId && connection.target_id !== userId) {
      throw new ForbiddenException('You are not part of this connection')
    }

    const { error } = await db
      .from('connections')
      .delete()
      .eq('id', connectionId)

    if (error) {
      throw new BadRequestException(error.message)
    }

    return { message: 'Connection removed' }
  }
}