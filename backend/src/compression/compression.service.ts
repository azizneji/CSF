import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class CompressionService {
  private readonly logger = new Logger(CompressionService.name)

  async compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      // Dynamically import sharp to avoid issues if not installed
      const sharp = (await import('sharp')).default

      const image = sharp(buffer)
      const metadata = await image.metadata()

      let pipeline = image

      // Resize if too large (max 2000px wide)
      if (metadata.width && metadata.width > 2000) {
        pipeline = pipeline.resize(2000, undefined, { withoutEnlargement: true })
      }

      // Convert and compress based on type
      if (mimeType === 'image/png') {
        return pipeline.png({ compressionLevel: 8, quality: 80 }).toBuffer()
      } else if (mimeType === 'image/webp') {
        return pipeline.webp({ quality: 80 }).toBuffer()
      } else {
        // Default: JPEG
        return pipeline.jpeg({ quality: 80, progressive: true }).toBuffer()
      }
    } catch (err) {
      this.logger.warn(`Image compression failed, using original: ${err.message}`)
      return buffer
    }
  }

  async compressPdf(buffer: Buffer): Promise<Buffer> {
    try {
      const { PDFDocument } = await import('pdf-lib')
      // pdf-lib doesn't actually compress PDFs significantly,
      // but we load/save it to strip metadata and normalize
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const compressed = await pdfDoc.save({ useObjectStreams: true })
      const result = Buffer.from(compressed)

      // Only use compressed if it's smaller
      return result.length < buffer.length ? result : buffer
    } catch (err) {
      this.logger.warn(`PDF compression failed, using original: ${err.message}`)
      return buffer
    }
  }

  async compress(buffer: Buffer, mimeType: string, filename: string): Promise<{ buffer: Buffer; savedBytes: number; savedPercent: number }> {
    const originalSize = buffer.length
    let compressed = buffer

    if (mimeType.startsWith('image/')) {
      compressed = await this.compressImage(buffer, mimeType)
    } else if (mimeType === 'application/pdf') {
      compressed = await this.compressPdf(buffer)
    }

    const savedBytes   = originalSize - compressed.length
    const savedPercent = Math.round((savedBytes / originalSize) * 100)

    if (savedBytes > 0) {
      this.logger.log(`Compressed ${filename}: ${this.formatSize(originalSize)} → ${this.formatSize(compressed.length)} (saved ${savedPercent}%)`)
    }

    return { buffer: compressed, savedBytes, savedPercent }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }
}
