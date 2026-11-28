import { requireSessionUser } from '#/server/auth/session'
import type { SessionUser } from '#/server/auth/session'
import { prismaAssetRepository } from '#/server/repositories/asset.repository'
import type { AssetRepository } from '#/server/repositories/asset.repository'
import { prismaEventRepository } from '#/server/repositories/event.repository'
import type { EventRepository } from '#/server/repositories/event.repository'
import { prismaGuestRepository } from '#/server/repositories/guest.repository'
import type { GuestRepository } from '#/server/repositories/guest.repository'
import { prismaRoleRepository } from '#/server/repositories/role.repository'
import type { RoleRepository } from '#/server/repositories/role.repository'
import { prismaUserRepository } from '#/server/repositories/user.repository'
import type { UserRepository } from '#/server/repositories/user.repository'
import { processPhoto } from '#/server/storage/image'
import type { ProcessedPhoto } from '#/server/storage/image'
import { supabasePhotoStorage } from '#/server/storage/photo.storage'
import type { PhotoStorage } from '#/server/storage/photo.storage'

// What host API routes need. Routes are built from this so tests can swap in
// fakes; `getUser` throws UNAUTHORIZED when nobody is logged in.
export type HostDeps = {
  events: EventRepository
  users: UserRepository
  roles: RoleRepository
  guests: GuestRepository
  getUser: () => Promise<SessionUser>
}

export const hostDeps: HostDeps = {
  events: prismaEventRepository,
  users: prismaUserRepository,
  roles: prismaRoleRepository,
  guests: prismaGuestRepository,
  getUser: requireSessionUser,
}

// What the photo routes need on top of the event repository.
export type PhotoDeps = {
  assets: AssetRepository
  photos: PhotoStorage
  processImage: (input: Buffer, maxWidth?: number) => Promise<ProcessedPhoto>
}

export const photoDeps: PhotoDeps = {
  assets: prismaAssetRepository,
  photos: supabasePhotoStorage,
  processImage: processPhoto,
}
