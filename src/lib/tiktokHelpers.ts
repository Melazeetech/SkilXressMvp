/**
 * TikTok Video Helpers
 * Functions to extract and embed TikTok videos
 */

/**
 * Extract TikTok video ID from various TikTok URL formats
 * Supports:
 * - https://www.tiktok.com/@username/video/1234567890
 * - https://vm.tiktok.com/ZMxxx/
 * - https://tiktok.com/@username/video/1234567890
 */
export function extractTikTokVideoId(url: string): string | null {
    try {
        // Remove any whitespace
        url = url.trim();

        // Match standard TikTok video URL
        const standardMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/);
        if (standardMatch) {
            return standardMatch[1];
        }

        // Match mobile share link (vm.tiktok.com)
        const mobileMatch = url.match(/vm\.tiktok\.com\/([\w-]+)/);
        if (mobileMatch) {
            // For mobile links, we return the short code
            // The embed will handle the redirect
            return mobileMatch[1];
        }

        return null;
    } catch (error) {
        console.error('Error extracting TikTok video ID:', error);
        return null;
    }
}

/**
 * Check if a URL is a TikTok video link
 */
export function isTikTokUrl(url: string): boolean {
    return /tiktok\.com\/@[\w.-]+\/video\/\d+/.test(url) || /vm\.tiktok\.com\/[\w-]+/.test(url);
}

/**
 * Get TikTok embed URL from video ID
 */
export function getTikTokEmbedUrl(videoId: string): string {
    // If it's a short code (from vm.tiktok.com), use it directly
    if (videoId.length < 15) {
        return `https://www.tiktok.com/embed/v2/${videoId}`;
    }

    // Otherwise use the standard embed format
    return `https://www.tiktok.com/embed/v2/${videoId}`;
}

/**
 * Validate and process TikTok URL
 * Returns the embed URL or null if invalid
 */
export function processTikTokUrl(url: string): string | null {
    if (!isTikTokUrl(url)) {
        return null;
    }

    const videoId = extractTikTokVideoId(url);
    if (!videoId) {
        return null;
    }

    return getTikTokEmbedUrl(videoId);
}

/**
 * Get TikTok video metadata using oEmbed API
 * This can be used to fetch video title, author, etc.
 */
export async function getTikTokMetadata(url: string): Promise<{
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
} | null> {
    try {
        const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            title: data.title,
            author_name: data.author_name,
            thumbnail_url: data.thumbnail_url,
        };
    } catch (error) {
        console.error('Error fetching TikTok metadata:', error);
        return null;
    }
}
