export class NotificationService {
    private static instance: NotificationService;
    private hasPermission: boolean = false;

    private constructor() {
        this.checkPermission();
    }

    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    private async checkPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notifications');
            return;
        }
        this.hasPermission = Notification.permission === 'granted';
    }

    public async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) return false;

        if (Notification.permission === 'granted') {
            this.hasPermission = true;
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.hasPermission = permission === 'granted';
            return this.hasPermission;
        }

        return false;
    }

    public async showNotification(title: string, options?: NotificationOptions) {
        if (!this.hasPermission) {
            const granted = await this.requestPermission();
            if (!granted) return;
        }

        // High priority notifications should also play a sound if possible or vibrate
        const defaultOptions: NotificationOptions = {
            icon: '/logo.png', // Fallback to logo
            badge: '/logo.png',
            silent: false,
            ...options
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // If we have a service worker, use it to show the notification
            // This allows notifications to persist better
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, defaultOptions);
        } else {
            // Fallback to standard window Notification
            new Notification(title, defaultOptions);
        }
    }
}

export const notificationService = NotificationService.getInstance();
