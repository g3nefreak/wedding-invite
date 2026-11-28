import sharp from 'sharp'
import { AppError } from '#/server/errors'

const MAX_WIDTH = 2000
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp']

export type ProcessedPhoto = { bytes: Buffer; width: number; height: number }

const NOT_A_PHOTO = 'Upload a JPEG, PNG or WebP photo'

// Checks an upload really is a photo and makes it ready to store.
// The check reads the file's own contents: the name and the type the browser
// claims are never trusted. The result is always a fresh WebP, so anything
// hidden in the original file (location data, scripts) is left behind.
export async function processPhoto(
  input: Buffer,
  // Section photos and QR codes are kept smaller than a background photo.
  maxWidth = MAX_WIDTH,
): Promise<ProcessedPhoto> {
  try {
    const { format } = await sharp(input).metadata()
    if (!format || !ALLOWED_FORMATS.includes(format)) {
      throw new AppError('VALIDATION', NOT_A_PHOTO)
    }

    const { data, info } = await sharp(input)
      // Turn the picture the way the camera meant it before resizing.
      .rotate()
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true })

    return { bytes: data, width: info.width, height: info.height }
  } catch (error) {
    if (error instanceof AppError) throw error
    // sharp could not read it at all, so it is not an image we accept.
    throw new AppError('VALIDATION', NOT_A_PHOTO)
  }
}
