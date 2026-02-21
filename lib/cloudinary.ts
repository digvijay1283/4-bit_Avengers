import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload a buffer to Cloudinary and return the secure URL + public ID.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: { folder?: string; publicId?: string; resourceType?: string } = {}
): Promise<{ secureUrl: string; publicId: string }> {
  const { folder = "vitalai/reports", publicId, resourceType = "auto" } = options;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType as "auto" | "image" | "video" | "raw",
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ secureUrl: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(buffer);
  });
}
