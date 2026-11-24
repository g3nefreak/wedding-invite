// Phone photos are often larger than the hosting service lets a request be
// (about 4.5 MB on Vercel). Big ones are made smaller in the browser first.
// The server still checks and resizes whatever arrives.
const SEND_AS_IS_BELOW = 3.5 * 1024 * 1024
const MAX_SIDE = 2400

export async function shrinkPhoto(file: File): Promise<Blob> {
  if (file.size <= SEND_AS_IS_BELOW) return file

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas
      .getContext('2d')
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    )
    return blob ?? file
  } catch {
    // The browser could not read it. Send the original and let the server
    // give the proper answer.
    return file
  }
}
