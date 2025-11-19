/**
 * Email validation utility
 * Validates email format using regex
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Full name validation utility
 * Ensures name has at least 2 characters and only contains letters and spaces
 */
export function validateFullName(name: string): boolean {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name.trim());
}

/**
 * Password validation utility
 * Returns validation status, strength level, and list of issues
 */
export function validatePassword(password: string): {
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    issues: string[];
} {
    const issues: string[] = [];
    let score = 0;

    // Check length
    if (password.length < 8) {
        issues.push('At least 8 characters required');
    } else {
        score += 20;
        if (password.length >= 12) score += 10;
    }

    // Check for lowercase
    if (!/[a-z]/.test(password)) {
        issues.push('Include lowercase letters');
    } else {
        score += 20;
    }

    // Check for uppercase
    if (!/[A-Z]/.test(password)) {
        issues.push('Include uppercase letters');
    } else {
        score += 20;
    }

    // Check for numbers
    if (!/[0-9]/.test(password)) {
        issues.push('Include numbers');
    } else {
        score += 20;
    }

    // Check for special characters
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        issues.push('Include special characters');
    } else {
        score += 20;
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score < 40) {
        strength = 'weak';
    } else if (score < 70) {
        strength = 'medium';
    } else {
        strength = 'strong';
    }

    return {
        isValid: issues.length === 0,
        strength,
        issues,
    };
}

/**
 * Get password strength percentage (0-100)
 */
export function getPasswordStrengthPercentage(password: string): number {
    let score = 0;

    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (/[a-z]/.test(password)) score += 20;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;

    return Math.min(score, 100);
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
    switch (strength) {
        case 'weak':
            return 'bg-red-500';
        case 'medium':
            return 'bg-yellow-500';
        case 'strong':
            return 'bg-green-500';
    }
}
