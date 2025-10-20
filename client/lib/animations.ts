/**
 * Animation utilities and constants for Salini AMS
 */

export const animations = {
  // Fade animations
  fadeIn: 'animate-fade-in',
  fadeOut: 'animate-fade-out',
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',

  // Scale animations
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  scaleInUp: 'animate-scale-in-up',
  scaleInDown: 'animate-scale-in-down',

  // Slide animations
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  slideOutUp: 'animate-slide-out-up',
  slideOutDown: 'animate-slide-out-down',
  slideOutLeft: 'animate-slide-out-left',
  slideOutRight: 'animate-slide-out-right',

  // Rotation animations
  rotateIn: 'animate-rotate-in',
  rotateOut: 'animate-rotate-out',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  ping: 'animate-ping',

  // Custom animations
  shimmer: 'animate-shimmer',
  progress: 'animate-progress',
  loading: 'animate-loading'
};

export const animationDurations = {
  fast: 'duration-150',
  normal: 'duration-300',
  slow: 'duration-500',
  slower: 'duration-700',
  slowest: 'duration-1000'
};

export const animationDelays = {
  none: 'delay-0',
  fast: 'delay-75',
  normal: 'delay-150',
  slow: 'delay-300',
  slower: 'delay-500',
  slowest: 'delay-700'
};

export const animationEasings = {
  linear: 'ease-linear',
  in: 'ease-in',
  out: 'ease-out',
  inOut: 'ease-in-out',
  bounce: 'ease-bounce',
  elastic: 'ease-elastic'
};

/**
 * Animation presets for common UI patterns
 */
export const animationPresets = {
  // Modal animations
  modal: {
    enter: `${animations.fadeIn} ${animations.scaleIn} ${animationDurations.normal}`,
    exit: `${animations.fadeOut} ${animations.scaleOut} ${animationDurations.fast}`
  },

  // Dropdown animations
  dropdown: {
    enter: `${animations.fadeInDown} ${animationDurations.fast}`,
    exit: `${animations.fadeOut} ${animationDurations.fast}`
  },

  // Tooltip animations
  tooltip: {
    enter: `${animations.fadeInUp} ${animationDurations.fast}`,
    exit: `${animations.fadeOut} ${animationDurations.fast}`
  },

  // Card animations
  card: {
    hover: 'hover:scale-105 transition-transform duration-200',
    focus: 'focus:scale-105 transition-transform duration-200',
    press: 'active:scale-95 transition-transform duration-100'
  },

  // Button animations
  button: {
    hover: 'hover:scale-105 transition-all duration-200',
    focus: 'focus:scale-105 transition-all duration-200',
    press: 'active:scale-95 transition-all duration-100',
    loading: `${animations.spin} ${animationDurations.normal}`
  },

  // List item animations
  listItem: {
    enter: `${animations.fadeInLeft} ${animationDurations.normal}`,
    exit: `${animations.fadeOutRight} ${animationDurations.fast}`,
    stagger: (index: number) => `${animationDelays.fast} delay-${index * 50}`
  },

  // Table row animations
  tableRow: {
    enter: `${animations.fadeIn} ${animationDurations.normal}`,
    hover: 'hover:bg-gray-50 transition-colors duration-200',
    selected: 'bg-blue-50 transition-colors duration-200'
  },

  // Form field animations
  formField: {
    focus: 'focus:scale-105 transition-transform duration-200',
    error: `${animations.shake} ${animationDurations.fast}`,
    success: `${animations.bounce} ${animationDurations.fast}`
  },

  // Loading animations
  loading: {
    spinner: `${animations.spin} ${animationDurations.normal}`,
    dots: `${animations.bounce} ${animationDurations.normal}`,
    bars: `${animations.pulse} ${animationDurations.normal}`,
    shimmer: `${animations.shimmer} ${animationDurations.slow}`
  },

  // Page transitions
  page: {
    enter: `${animations.fadeIn} ${animationDurations.normal}`,
    exit: `${animations.fadeOut} ${animationDurations.fast}`
  }
};

/**
 * Stagger animation utilities
 */
export function getStaggerDelay(index: number, baseDelay: number = 50): string {
  return `delay-${index * baseDelay}`;
}

export function getStaggerAnimation(index: number, baseAnimation: string, baseDelay: number = 50): string {
  return `${baseAnimation} ${getStaggerDelay(index, baseDelay)}`;
}

/**
 * Animation hooks for React components
 */
import { useState, useEffect, useRef } from 'react';

export function useAnimation(animation: string, duration: number = 300) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startAnimation = () => {
    setIsVisible(true);
    setIsAnimating(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  };

  const stopAnimation = () => {
    setIsVisible(false);
    setIsAnimating(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    isAnimating,
    startAnimation,
    stopAnimation,
    animationClass: isVisible ? animation : ''
  };
}

export function useStaggerAnimation(items: any[], baseAnimation: string, baseDelay: number = 50) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];
    
    items.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * baseDelay);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [items, baseDelay]);

  const getItemAnimation = (index: number) => {
    return visibleItems.includes(index) ? baseAnimation : '';
  };

  return {
    visibleItems,
    getItemAnimation
  };
}

/**
 * Intersection Observer hook for scroll animations
 */
export function useScrollAnimation(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
}

/**
 * Animation variants for Framer Motion (if using)
 */
export const motionVariants = {
  // Fade variants
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },

  // Scale variants
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },

  // Slide variants
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },

  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },

  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },

  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },

  // Stagger variants
  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  },

  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
};

export default animations;
