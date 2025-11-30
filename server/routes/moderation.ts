/**
 * Video Moderation API Routes
 * 
 * Endpoints:
 * - POST /api/moderation/upload - Upload and moderate video
 * - POST /api/moderation/moderate - Moderate existing video
 * - GET /api/moderation/status/:videoId - Get moderation status
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { moderateVideo } from '../services/videoModeration';

const router = express.Router();

// Initialize Supabase client with service role key (has full access)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * POST /api/moderation/moderate
 * 
 * Moderate an existing video by ID
 */
router.post('/moderate', async (req: Request, res: Response) => {
    try {
        const { videoId, videoURL, title, description } = req.body;

        if (!videoId || !videoURL) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: videoId, videoURL'
            });
        }

        console.log(`[Moderation] Starting moderation for video ${videoId}`);

        const moderationResult = await moderateVideo(videoURL, title, description);

        const { data: moderationRecord, error: moderationError } = await supabase
            .from('video_moderation')
            .upsert({
                video_id: videoId,
                status: moderationResult.approved ? 'approved' : 'rejected',
                nudity_detected: moderationResult.nudityFlag,
                violence_detected: moderationResult.violenceFlag,
                explicit_content_detected: moderationResult.explicitContentFlag,
                is_skill_related: moderationResult.isSkillRelated,
                detected_skill_category: moderationResult.detectedSkill,
                video_summary: moderationResult.videoSummary,
                moderation_reason: moderationResult.reason,
                confidence_score: moderationResult.confidenceScore,
                safety_api_response: moderationResult.safetyApiResponse,
                classification_api_response: moderationResult.classificationApiResponse,
                moderated_at: new Date().toISOString(),
                moderated_by: 'AI'
            })
            .select()
            .single();

        if (moderationError) {
            console.error('[Moderation] Database error:', moderationError);
            throw moderationError;
        }

        console.log(`[Moderation] Video ${videoId} - ${moderationResult.approved ? 'APPROVED' : 'REJECTED'}`);

        res.json({
            success: true,
            moderation: moderationResult,
            stored: true
        });

    } catch (error) {
        console.error('[Moderation] Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Moderation failed'
        });
    }
});

/**
 * POST /api/moderation/upload
 * 
 * Upload video and run immediate moderation
 */
router.post('/upload', async (req: Request, res: Response) => {
    try {
        const { providerId, title, description, categoryId, videoURL } = req.body;

        if (!providerId || !title || !videoURL || !categoryId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: providerId, title, videoURL, categoryId'
            });
        }

        console.log(`[Upload] New video upload from provider ${providerId}`);

        const { data: video, error: videoError } = await supabase
            .from('skill_videos')
            .insert({
                provider_id: providerId,
                title: title,
                description: description || '',
                category_id: categoryId,
                video_url: videoURL,
                moderation_status: 'pending',
                likes_count: 0,
                views_count: 0
            })
            .select()
            .single();

        if (videoError) {
            console.error('[Upload] Database error:', videoError);
            throw videoError;
        }

        console.log(`[Upload] Video created with ID: ${video.id}`);

        const moderationResult = await moderateVideo(videoURL, title, description);

        await supabase
            .from('video_moderation')
            .insert({
                video_id: video.id,
                status: moderationResult.approved ? 'approved' : 'rejected',
                nudity_detected: moderationResult.nudityFlag,
                violence_detected: moderationResult.violenceFlag,
                explicit_content_detected: moderationResult.explicitContentFlag,
                is_skill_related: moderationResult.isSkillRelated,
                detected_skill_category: moderationResult.detectedSkill,
                video_summary: moderationResult.videoSummary,
                moderation_reason: moderationResult.reason,
                confidence_score: moderationResult.confidenceScore,
                safety_api_response: moderationResult.safetyApiResponse,
                classification_api_response: moderationResult.classificationApiResponse,
            });

        console.log(`[Upload] Moderation complete - ${moderationResult.approved ? 'APPROVED' : 'REJECTED'}`);

        res.json({
            success: true,
            videoId: video.id,
            moderation: moderationResult,
            approved: moderationResult.approved,
            message: moderationResult.approved
                ? 'Video uploaded and approved!'
                : `Video flagged: ${moderationResult.reason}`
        });

    } catch (error) {
        console.error('[Upload] Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        });
    }
});

/**
 * GET /api/moderation/status/:videoId
 * 
 * Get moderation status for a video
 */
router.get('/status/:videoId', async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;

        const { data: moderation, error } = await supabase
            .from('video_moderation')
            .select('*')
            .eq('video_id', videoId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.json({
                    success: true,
                    status: 'pending',
                    moderation: null
                });
            }
            throw error;
        }

        res.json({
            success: true,
            status: moderation.status,
            moderation: moderation
        });

    } catch (error) {
        console.error('[Status] Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get status'
        });
    }
});

/**
 * POST /api/moderation/remoderate/:videoId
 * 
 * Re-run moderation on an existing video
 */
router.post('/remoderate/:videoId', async (req: Request, res: Response) => {
    try {
        const { videoId } = req.params;

        const { data: video, error: videoError } = await supabase
            .from('skill_videos')
            .select('*')
            .eq('id', videoId)
            .single();

        if (videoError || !video) {
            return res.status(404).json({
                success: false,
                error: 'Video not found'
            });
        }

        const moderationResult = await moderateVideo(
            video.video_url,
            video.title,
            video.description
        );

        await supabase
            .from('video_moderation')
            .upsert({
                video_id: videoId,
                status: moderationResult.approved ? 'approved' : 'rejected',
                nudity_detected: moderationResult.nudityFlag,
                violence_detected: moderationResult.violenceFlag,
                explicit_content_detected: moderationResult.explicitContentFlag,
                is_skill_related: moderationResult.isSkillRelated,
                detected_skill_category: moderationResult.detectedSkill,
                video_summary: moderationResult.videoSummary,
                moderation_reason: moderationResult.reason,
                confidence_score: moderationResult.confidenceScore,
                safety_api_response: moderationResult.safetyApiResponse,
                classification_api_response: moderationResult.classificationApiResponse,
                moderated_at: new Date().toISOString(),
            });

        res.json({
            success: true,
            moderation: moderationResult
        });

    } catch (error) {
        console.error('[Remoderate] Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Re-moderation failed'
        });
    }
});

export default router;
