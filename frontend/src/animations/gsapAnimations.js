import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Dashboard entrance animations
export const animateDashboardEntrance = () => {
  // Header animation
  gsap.from('.glass', {
    y: -50,
    opacity: 0,
    duration: 1,
    ease: 'power3.out'
  })

  // Webhook cards stagger animation
  gsap.from('.card-glass', {
    y: 30,
    opacity: 0,
    duration: 0.8,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.3
  })

  // Stats cards animation
  gsap.from('.responsive-grid > div', {
    scale: 0.8,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'back.out(1.7)',
    delay: 0.5
  })

  // Section headers animation
  gsap.from('h2, h3, h4', {
    y: 20,
    opacity: 0,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out',
    delay: 0.2
  })
}

// Card hover animations
export const setupCardAnimations = () => {
  const cards = document.querySelectorAll('.card-glass')
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.05,
        y: -5,
        duration: 0.3,
        ease: 'power2.out'
      })
    })
    
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    })
  })
}

// Button animations
export const setupButtonAnimations = () => {
  const buttons = document.querySelectorAll('.btn')
  
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: 1.05,
        duration: 0.2,
        ease: 'power2.out'
      })
    })
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      })
    })
    
    button.addEventListener('click', () => {
      gsap.to(button, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      })
    })
  })
}

// KPI Metrics animation
export const animateKPIs = () => {
  const kpiCards = document.querySelectorAll('.group')
  
  kpiCards.forEach((card, index) => {
    gsap.from(card, {
      scale: 0,
      rotation: 180,
      opacity: 0,
      duration: 0.8,
      delay: index * 0.1,
      ease: 'back.out(1.7)'
    })
  })
}

// Modal animations
export const animateModalIn = (modal) => {
  gsap.from(modal, {
    scale: 0.8,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.out'
  })
  
  gsap.from(modal.querySelector('.modal-content'), {
    y: 50,
    opacity: 0,
    duration: 0.4,
    delay: 0.1,
    ease: 'power2.out'
  })
}

export const animateModalOut = (modal) => {
  gsap.to(modal, {
    scale: 0.8,
    opacity: 0,
    duration: 0.2,
    ease: 'power2.in'
  })
}

// Loading animations
export const showLoadingAnimation = (element) => {
  gsap.to(element, {
    opacity: 0.7,
    duration: 0.3
  })
}

export const hideLoadingAnimation = (element) => {
  gsap.to(element, {
    opacity: 1,
    duration: 0.3
  })
}

// Notification animations
export const showNotification = (notification) => {
  gsap.from(notification, {
    x: 100,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out'
  })
}

export const hideNotification = (notification) => {
  gsap.to(notification, {
    x: 100,
    opacity: 0,
    duration: 0.3,
    ease: 'power2.in',
    onComplete: () => notification.remove()
  })
}

// Scroll-triggered animations
export const setupScrollAnimations = () => {
  // Animate sections on scroll
  gsap.utils.toArray('section').forEach(section => {
    gsap.from(section.children, {
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 80%',
        once: true
      }
    })
  })
}

// Floating animation for specific elements
export const addFloatingAnimation = (element) => {
  gsap.to(element, {
    y: -10,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut'
  })
}

// Pulse animation for status indicators
export const addPulseAnimation = (element) => {
  gsap.to(element, {
    scale: 1.1,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: 'power1.inOut'
  })
}

// Gradient animation
export const animateGradient = (element) => {
  gsap.to(element, {
    backgroundPosition: '200% 50%',
    duration: 3,
    repeat: -1,
    ease: 'none'
  })
}

// Initialize all animations
export const initializeAnimations = () => {
  animateDashboardEntrance()
  setupCardAnimations()
  setupButtonAnimations()
  setupScrollAnimations()
  
  // Add floating animation to specific elements
  const floatingElements = document.querySelectorAll('.animated-gradient')
  floatingElements.forEach(element => {
    addFloatingAnimation(element)
  })
  
  // Add pulse animation to status indicators
  const statusIndicators = document.querySelectorAll('.status-indicator')
  statusIndicators.forEach(element => {
    addPulseAnimation(element)
  })
}
