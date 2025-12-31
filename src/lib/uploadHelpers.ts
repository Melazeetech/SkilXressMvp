import { supabase } from './supabase';

const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export interface UploadProgress {
    progress: number;
    status: 'uploading' | 'complete' | 'error';
    error?: string;
}

/**
 * Validates a file against size and type constraints
 */
function validateFile(
    file: File,
    maxSize: number,
    allowedTypes: string[]
): { valid: boolean; error?: string } {
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit`,
        };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} is not supported`,
        };
    }

    return { valid: true };
}

/**
 * Generates a unique file name with timestamp and random string
 */
function generateFileName(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${userId}/${timestamp}_${randomString}.${extension}`;
}

/**
 * Uploads a video file to Supabase Storage
 * @param file - The video file to upload
 * @param userId - The ID of the user uploading the file
 * @param onProgress - Optional callback for upload progress
 * @returns The public URL of the uploaded video
 */
export async function uploadVideo(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    // Validate file
    const validation = validateFile(file, MAX_VIDEO_SIZE, ALLOWED_VIDEO_TYPES);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Generate unique file name
    const fileName = generateFileName(userId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(data.path);

    if (onProgress) {
        onProgress(100);
    }

    return urlData.publicUrl;
}

/**
 * Uploads an avatar image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The ID of the user uploading the file
 * @param onProgress - Optional callback for upload progress
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    // Validate file
    const validation = validateFile(file, MAX_AVATAR_SIZE, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Generate unique file name
    const fileName = generateFileName(userId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

    if (onProgress) {
        onProgress(100);
    }

    return urlData.publicUrl;
}

/**
 * Uploads a portfolio image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The ID of the user uploading the file
 * @param onProgress - Optional callback for upload progress
 * @returns The public URL of the uploaded image
 */
export async function uploadPortfolioImage(
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<string> {
    // Validate file
    const validation = validateFile(file, MAX_AVATAR_SIZE, ALLOWED_IMAGE_TYPES);
    if (!validation.valid) {
        throw new Error(validation.error);
    }

    // Generate unique file name
    const fileName = generateFileName(userId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) {
        throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(data.path);

    if (onProgress) {
        onProgress(100);
    }

    return urlData.publicUrl;
}

/**
 * Deletes a file from Supabase Storage
 * @param bucketName - The name of the storage bucket
 * @param filePath - The path to the file to delete
 */
export async function deleteFile(
    bucketName: 'videos' | 'avatars' | 'portfolio',
    filePath: string
): Promise<void> {
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);

    if (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }
}

/**
 * Creates a preview URL for a file before upload
 * @param file - The file to create a preview for
 * @returns A blob URL for the file preview
 */
export function createFilePreview(file: File): string {
    return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free up memory
 * @param url - The blob URL to revoke
 */
export function revokeFilePreview(url: string): void {
    URL.revokeObjectURL(url);
}
