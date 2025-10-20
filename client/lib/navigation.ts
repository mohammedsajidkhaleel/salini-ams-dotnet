/**
 * Navigation utility for handling redirects outside of React components
 * This allows the API client to redirect users when authentication fails
 */

class NavigationService {
  private static instance: NavigationService;
  private router: any = null;

  private constructor() {}

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  /**
   * Set the router instance (should be called from a React component)
   */
  setRouter(router: any) {
    this.router = router;
  }

  /**
   * Navigate to a specific path
   */
  navigateTo(path: string) {
    if (this.router) {
      this.router.push(path);
    } else {
      // Fallback: use window.location for non-React contexts
      if (typeof window !== 'undefined') {
        window.location.href = path;
      }
    }
  }

  /**
   * Navigate to login page
   */
  navigateToLogin() {
    this.navigateTo('/login');
  }

  /**
   * Navigate to home page
   */
  navigateToHome() {
    this.navigateTo('/');
  }
}

export const navigationService = NavigationService.getInstance();
