// Text Animator for letter-by-letter animation
export class TextAnimator {
  constructor() {
    this.isAnimating = false;
    this.defaultSpeed = 1; // Global default speed - change this to adjust animation speed
    this.defaultDelay = 500; // Global default delay - change this to adjust initial delay
  }

  // Set the default speed for all animations
  setDefaultSpeed(speed) {
    this.defaultSpeed = speed;
  }

  // Get the current default speed
  getDefaultSpeed() {
    return this.defaultSpeed;
  }

  // Set the default delay for all animations
  setDefaultDelay(delay) {
    this.defaultDelay = delay;
  }

  // Get the current default delay
  getDefaultDelay() {
    return this.defaultDelay;
  }

  // Animate text letter by letter
  async animateText(element, text, options = {}) {
    if (this.isAnimating) {
      this.stopAnimation();
    }

    const {
      speed = this.defaultSpeed, // use default speed if not specified
      delay = this.defaultDelay, // initial delay before starting
      onComplete = null
    } = options;

    this.isAnimating = true;
    
    // Add animating class for cursor effect
    element.classList.add('animating');
    
    // Clear the element
    element.innerHTML = '';
    
    // Wait for initial delay
    if (delay > 0) {
      await this.sleep(delay);
    }

    // For the intro text, we'll use a simpler approach
    // that preserves the HTML structure but animates the text content
    await this.animateIntroText(element, text, speed, onComplete);
  }

  // Animate intro text with HTML structure
  async animateIntroText(element, originalHTML, speed, onComplete) {
    // Create a temporary element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHTML;
    
    // Get all text nodes from the original HTML
    const originalTextNodes = this.getAllTextNodes(tempDiv);
    
    // Recreate the structure in the target element
    element.innerHTML = originalHTML;
    
    // Find all text nodes in the target element
    const textNodes = this.getAllTextNodes(element);
    
    // Clear all text nodes first
    for (const textNode of textNodes) {
      textNode.textContent = '';
    }
    
    // Create a cursor element
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    cursor.textContent = '|';
    cursor.style.cssText = `
      color: var(--clr-primary-dark);
      font-weight: bold;
      animation: blink 1s infinite;
    `;
    
    // Add cursor styles to the document if not already present
    if (!document.querySelector('#typing-cursor-styles')) {
      const style = document.createElement('style');
      style.id = 'typing-cursor-styles';
      style.textContent = `
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Now animate each text node sequentially
    for (let i = 0; i < textNodes.length; i++) {
      if (!this.isAnimating) return;
      
      const textNode = textNodes[i];
      const originalText = originalTextNodes[i].textContent;
      
      // Position cursor after the current text node
      this.positionCursorAfterNode(textNode, cursor);
      
      // Animate the text character by character
      for (let j = 0; j < originalText.length; j++) {
        if (!this.isAnimating) return;
        
        textNode.textContent += originalText[j];
        
        await this.sleep(speed);
      }
      
      // Add a small pause between text nodes
      await this.sleep(speed * 0.5);
    }
    
    // Remove cursor when done
    if (cursor.parentNode) {
      cursor.parentNode.removeChild(cursor);
    }

    this.isAnimating = false;
    
    // Remove animating class
    element.classList.remove('animating');
    
    if (onComplete) onComplete();
  }

  // Position cursor after a specific node
  positionCursorAfterNode(targetNode, cursor) {
    // Remove cursor from previous position
    if (cursor.parentNode) {
      cursor.parentNode.removeChild(cursor);
    }
    
    // Insert cursor after the target node
    if (targetNode.parentNode) {
      targetNode.parentNode.insertBefore(cursor, targetNode.nextSibling);
    }
  }

  // Get all text nodes from an element
  getAllTextNodes(element) {
    const textNodes = [];
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          // Only include text nodes that have actual content (not just whitespace)
          return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  // Stop current animation
  stopAnimation() {
    this.isAnimating = false;
    
    // Remove animating class from all elements
    const animatingElements = document.querySelectorAll('.animating');
    animatingElements.forEach(el => el.classList.remove('animating'));
    
    // Remove any typing cursors
    const cursors = document.querySelectorAll('.typing-cursor');
    cursors.forEach(cursor => {
      if (cursor.parentNode) {
        cursor.parentNode.removeChild(cursor);
      }
    });
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }
}

// Create a global instance
export const textAnimator = new TextAnimator();
