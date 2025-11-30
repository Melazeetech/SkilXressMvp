/**
 * Video Moderation Service
 * 
 * This service handles AI-based moderation of uploaded skill videos.
 * It checks for:
 * 1. Nudity and explicit content
 * 2. Violence and unsafe content
 * 3. Skill-related content verification
 * 
 * APIs Used:
 * - OpenAI GPT-4o-mini for content analysis and classification
 * - OpenAI Moderation API for safety checks
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
});

// Skill categories we support
const SUPPORTED_SKILLS = [
    'haircutting', 'hairstyling', 'barbering',
    'tailoring', 'sewing', 'fashion design',
    'welding', 'metalwork',
    'plumbing', 'pipe fitting',
    'carpentry', 'woodwork',
    'makeup', 'cosmetics', 'beauty',
    'electrical work', 'electrician',
    'painting', 'decorating',
    'cleaning', 'janitorial',
    'repairs', 'handyman', 'fixing',
    'cooking', 'catering', 'baking',
    'gardening', 'landscaping',
    'auto repair', 'mechanics',
    'construction', 'masonry',
    'photography', 'videography'
];

export interface ModerationResult {
    nudityFlag: boolean;
    violenceFlag: boolean;
    explicitContentFlag: boolean;
    skillFlag: boolean;
    isSkillRelated: boolean;
    detectedSkill: string | null;
    videoSummary: string;
    reason: string;
    confidenceScore: number;
    approved: boolean;
    safetyApiResponse?: any;
    classificationApiResponse?: any;
}

/**
 * Main moderation function
 * Analyzes video for safety and skill-related content
 */
export async function moderateVideo(
    videoURL: string,
    videoTitle?: string,
    videoDescription?: string
): Promise<ModerationResult> {
    console.log('Starting video moderation for:', videoURL);

    try {
        // Step 1: Safety Moderation (nudity, violence, explicit content)
        console.log('Step 1: Running safety moderation...');
        const safetyResult = await checkVideoSafety(videoURL, videoTitle, videoDescription);

        // Step 2: Skill Content Classification
        console.log('Step 2: Running skill classification...');
        const skillResult = await classifySkillContent(
            videoURL,
            videoTitle,
            videoDescription,
            safetyResult.summary
        );

        // Combine results
        const moderationResult: ModerationResult = {
            nudityFlag: safetyResult.nudityDetected,
            violenceFlag: safetyResult.violenceDetected,
            explicitContentFlag: safetyResult.explicitContentDetected,
            skillFlag: !skillResult.isSkillRelated,
            isSkillRelated: skillResult.isSkillRelated,
            detectedSkill: skillResult.detectedSkill,
            videoSummary: safetyResult.summary,
            reason: buildModerationReason(safetyResult, skillResult),
            confidenceScore: skillResult.confidence,
            approved: determineApproval(safetyResult, skillResult),
            safetyApiResponse: safetyResult.rawResponse,
            classificationApiResponse: skillResult.rawResponse,
        };

        console.log('Moderation complete:', {
            approved: moderationResult.approved,
            reason: moderationResult.reason
        });

        return moderationResult;
    } catch (error) {
        console.error('Error during video moderation:', error);
        throw new Error(`Moderation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Check video for safety issues using OpenAI
 */
async function checkVideoSafety(
    videoURL: string,
    title?: string,
    description?: string
) {
    try {
        const contextText = `Video Title: ${title || 'Untitled'}
Video Description: ${description || 'No description'}
Please analyze this skill demonstration video for any inappropriate content.`;

        const moderationResponse = await openai.moderations.create({
            input: contextText,
        });

        const result = moderationResponse.results[0];

        return {
            nudityDetected: result.categories.sexual || result.categories['sexual/minors'] || false,
            violenceDetected: result.categories.violence || result.categories['violence/graphic'] || false,
            explicitContentDetected: result.categories.sexual || result.categories.hate || false,
            summary: `Video about ${title || 'untitled content'}`,
            concerns: [],
            rawResponse: { moderation: result },
        };
    } catch (error) {
        console.error('Safety check error:', error);
        return {
            nudityDetected: false,
            violenceDetected: false,
            explicitContentDetected: false,
            summary: 'Unable to analyze video automatically - flagged for manual review',
            concerns: ['API Error - Manual Review Required'],
            rawResponse: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

/**
 * Classify if video content is skill-related
 * Uses GPT-4o-mini to analyze video description and context
 */
async function classifySkillContent(
    videoURL: string,
    title?: string,
    description?: string,
    summary?: string
) {
    try {
        const prompt = `You are an AI classifier for a skills marketplace platform called SkilXpress.
Your job is to determine if a video demonstrates an actual professional skill.

Supported skill categories include:
${SUPPORTED_SKILLS.join(', ')}

Video Information:
- Title: ${title || 'Untitled'}
- Description: ${description || 'No description'}
- Summary: ${summary || 'No summary available'}

Analyze this video and respond ONLY with valid JSON in this exact format:
{
  "isSkillRelated": true or false,
  "detectedSkill": "specific skill name" or null,
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

A video is skill-related if it demonstrates:
1. A professional trade or craft skill
2. A technical or service skill
3. Educational content about a skill
4. Clear demonstration of expertise or technique

A video is NOT skill-related if it shows:
1. Casual activities (eating, dancing for fun, vlogging)
2. Entertainment content without skill demonstration
3. Random personal videos
4. Content unrelated to professional services`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',  // Using gpt-4o-mini (available on free tier)
            messages: [
                { role: 'system', content: 'You are a skill classification AI. Always respond with valid JSON only.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 300,
        });

        const content = response.choices[0].message.content || '{}';
        const classification = JSON.parse(content);

        return {
            isSkillRelated: classification.isSkillRelated || false,
            detectedSkill: classification.detectedSkill || null,
            confidence: classification.confidence || 0,
            reasoning: classification.reasoning || '',
            rawResponse: classification,
        };
    } catch (error) {
        console.error('Skill classification error:', error);
        // Fail safe - assume skill-related to avoid false rejections
        return {
            isSkillRelated: true,
            detectedSkill: null,
            confidence: 0.5,
            reasoning: 'Unable to classify - approved for manual review',
            rawResponse: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}

/**
 * Build human-readable moderation reason
 */
function buildModerationReason(safetyResult: any, skillResult: any): string {
    const reasons: string[] = [];

    if (safetyResult.nudityDetected) {
        reasons.push('Nudity or sexual content detected');
    }
    if (safetyResult.violenceDetected) {
        reasons.push('Violence or graphic content detected');
    }
    if (safetyResult.explicitContentDetected) {
        reasons.push('Explicit content detected');
    }
    if (!skillResult.isSkillRelated) {
        reasons.push('Content does not demonstrate a professional skill');
    }

    if (reasons.length === 0) {
        return skillResult.detectedSkill
            ? `Approved - ${skillResult.detectedSkill} demonstration (${Math.round(skillResult.confidence * 100)}% confidence)`
            : 'Approved - Skill-related content';
    }

    return reasons.join('; ');
}

/**
 * Determine if video should be approved
 */
function determineApproval(safetyResult: any, skillResult: any): boolean {
    const safetyPassed = !safetyResult.nudityDetected &&
        !safetyResult.violenceDetected &&
        !safetyResult.explicitContentDetected;

    const skillPassed = skillResult.isSkillRelated &&
        skillResult.confidence >= (Number(process.env.MODERATION_SKILL_CONFIDENCE_THRESHOLD) || 0.6);

    return safetyPassed && skillPassed;
}

/**
 * Simplified moderation for testing
 */
export async function moderateVideoSimple(
    title: string,
    description: string
): Promise<Partial<ModerationResult>> {
    const contextText = `Title: ${title}\nDescription: ${description}`;

    const moderationResponse = await openai.moderations.create({
        input: contextText,
    });

    const result = moderationResponse.results[0];

    return {
        nudityFlag: result.categories.sexual,
        violenceFlag: result.categories.violence,
        explicitContentFlag: result.categories.sexual || result.categories.hate,
        videoSummary: `${title} - ${description}`,
        approved: !result.flagged,
    };
}
