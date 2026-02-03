const Utils = {
  getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  },

  formatTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  },

  truncateTextToLines(text, maxLines = 3) {
    if (!text) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = text;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    const avgCharsPerLine = 25;
    const maxChars = avgCharsPerLine * maxLines;

    if (plainText.length <= maxChars) {
      return text;
    }

    const truncated = plainText.substring(0, maxChars - 3);
    return truncated + "...";
  },

  getArticleImage(article) {
    if (article && article.img) {
      let imgUrl = article.img.trim();
      
      
      
      imgUrl = imgUrl.replace(/\s+/g, '');
      
      
      const hasQueryParams = imgUrl.includes('?');
      
      
      if (!hasQueryParams && imgUrl.includes('=')) {
        
        const protocolIndex = imgUrl.indexOf('://');
        if (protocolIndex > -1) {
          const pathStart = imgUrl.indexOf('/', protocolIndex + 3);
          if (pathStart > -1) {
            const firstEqualIndex = imgUrl.indexOf('=', pathStart);
            if (firstEqualIndex > pathStart) {
              const nextChar = imgUrl.charAt(firstEqualIndex + 1);
              
              if (nextChar === '?') {
                imgUrl = imgUrl.substring(0, firstEqualIndex) + imgUrl.substring(firstEqualIndex + 1);
              } 
              
              else if (nextChar === '/') {
                
                
              } 
              
              
              else if (/[a-zA-Z0-9]/.test(nextChar)) {
                
                const afterEqual = imgUrl.substring(firstEqualIndex + 1);
                
                if (afterEqual.match(/^[^?&]*[,/]/) || afterEqual.includes('%')) {
                  
                  
                } else {
                  
                  imgUrl = imgUrl.substring(0, firstEqualIndex) + '?' + imgUrl.substring(firstEqualIndex + 1);
                }
              }
              
              else {
                imgUrl = imgUrl.substring(0, firstEqualIndex) + '?' + imgUrl.substring(firstEqualIndex + 1);
              }
            }
          }
        } else {
          
          const firstEqualIndex = imgUrl.indexOf('=');
          if (firstEqualIndex > 0) {
            const nextChar = imgUrl.charAt(firstEqualIndex + 1);
            
            if (nextChar === '?') {
              imgUrl = imgUrl.substring(0, firstEqualIndex) + imgUrl.substring(firstEqualIndex + 1);
            } 
            
            else if (nextChar === '/') {
              
            } 
            
            else if (/[a-zA-Z0-9]/.test(nextChar)) {
              const afterEqual = imgUrl.substring(firstEqualIndex + 1);
              if (afterEqual.match(/^[^?&]*[,/]/) || afterEqual.includes('%')) {
                
              } else {
                imgUrl = imgUrl.substring(0, firstEqualIndex) + '?' + imgUrl.substring(firstEqualIndex + 1);
              }
            }
            
            else {
              imgUrl = imgUrl.substring(0, firstEqualIndex) + '?' + imgUrl.substring(firstEqualIndex + 1);
            }
          }
        }
      } else if (hasQueryParams) {
        
        
        
        imgUrl = imgUrl.replace(/\?=\//g, '?/');
        
        imgUrl = imgUrl.replace(/\?=/g, '?');
      }
      
      if (/^https?:\/\//i.test(imgUrl)) {
        return imgUrl;
      }
      if (imgUrl.startsWith("/")) {
        return `${RemoteDataConfig.baseUrl}${imgUrl}`;
      }
      if (article.id) {
        return `${RemoteDataConfig.baseUrl}/${article.id}/${imgUrl}`;
      }
      return `${RemoteDataConfig.baseUrl}/${imgUrl}`;
    }

    if (article && article.id) {
      return RemoteDataConfig.articleImageUrl(article.id, 1);
    }

    return "";
  },

  getCategoryIconByType(type) {
    
    const iconType = type;
    if (iconType === 'real estate' || iconType === 'Real Estate' || iconType === 'Real estate') {
      
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M41 18.94H7.05a1 1 0 0 1-.68-1.74l17-15.42a1 1 0 0 1 1.35 0l17 15.42a1 1 0 0 1 .26 1.1 1 1 0 0 1-.98.64zm-31.33-2h28.71L24 3.87zM36.56 37a1 1 0 0 1-1-1V20.79a1 1 0 0 1 2 0V36a1 1 0 0 1-1 1zM11.45 37a1 1 0 0 1-1-1V20.79a1 1 0 0 1 2 0V36a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M41.16 42.29H6.84a1 1 0 0 1-1-1 6.31 6.31 0 0 1 6.3-6.3h23.72a6.31 6.31 0 0 1 6.3 6.3 1 1 0 0 1-1 1zM8 40.29h32A4.31 4.31 0 0 0 35.86 37H12.14A4.31 4.31 0 0 0 8 40.29zM45.5 46.48h-43a1 1 0 0 1 0-2h43a1 1 0 0 1 0 2zM24 28c-2.69 0-4.8-1.49-4.8-3.41s2.11-3.41 4.8-3.41c2.49 0 4.5 1.27 4.78 3a1 1 0 0 1-2 .31c-.1-.62-1.27-1.32-2.8-1.32s-2.8.76-2.8 1.41S22.42 26 24 26a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M24 32.79c-2.48 0-4.49-1.27-4.77-3a1 1 0 0 1 2-.32c.1.63 1.27 1.33 2.79 1.33s2.81-.76 2.81-1.42S25.58 28 24 28a1 1 0 0 1 0-2c2.7 0 4.81 1.5 4.81 3.41S26.7 32.79 24 32.79z"/><path fill="var(--color1)" d="M24 34.67a1 1 0 0 1-1-1V20.26a1 1 0 0 1 2 0v13.41a1 1 0 0 1-1 1z"/></svg>';
    }
    if (iconType === 'law' || iconType === 'Law') {
     
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M37.76 29.5c-2.28 0-5.24-2.68-8.36-5.5-1.76-1.61-4.12-3.74-5.31-4.18-4.26 4.91-8 6.46-11 4.62a1 1 0 0 1-.22-.18c-1.13-1.26.23-3.26 2.74-6.74L16 17a13.67 13.67 0 0 1-3.87.29h-.77a1 1 0 0 1 0-2h.84c1.83.06 4.1.15 5.92-1.75 2.89-3 13.52-5.14 18.23-2.95 2.14 1 2.64 4.59 3.21 8.75a57.82 57.82 0 0 0 1 5.87.77.77 0 0 1 0 .3c0 .78-.18 3.14-1.92 3.85a2.36 2.36 0 0 1-.88.14zm-14-11.76c1.68 0 3.77 1.82 7 4.77 2.24 2 6 5.45 7.21 5 .26-.11.57-.68.67-2a57.34 57.34 0 0 1-1-5.93c-.43-3.13-.92-6.68-2.07-7.22-4-1.87-13.39.21-15.8 2.38a20 20 0 0 1-2.5 4 25.06 25.06 0 0 0-2.7 4.24c1.51.63 4.07.19 8.13-4.51.3-.47.55-.73 1.02-.73z"/><path fill="var(--color1)" d="M45.28 33.32h-4.84a1 1 0 0 1-.74-.32 1 1 0 0 1-.26-.76 18.28 18.28 0 0 0-.77-6.55l1.93-.55a21 21 0 0 1 .89 6.18h2.79V9.73l-8 2.68-.64-1.9L45 7.4a1 1 0 0 1 .9.13 1 1 0 0 1 .42.82v24a1 1 0 0 1-1.04.97zM8.42 34.72h-5.7a1 1 0 0 1-1-1V11.55a1 1 0 0 1 1.64-.78 24.1 24.1 0 0 0 8.29 4.52 1 1 0 0 1 .69 1.12L9.41 33.89a1 1 0 0 1-.99.83zm-4.7-2h3.86l2.65-15.79a26 26 0 0 1-6.51-3.36z"/><path fill="var(--color1)" d="M21.44 40.65a4 4 0 0 1-1-.1 99.79 99.79 0 0 1-12.61-6L9 32.9a107.39 107.39 0 0 0 12 5.71 3.71 3.71 0 0 0 2.7-.62.38.38 0 0 0 .1-.43 1 1 0 0 1 1.42-1.16 1.9 1.9 0 0 0 2.38-.49c.13-.16.54-.73.16-1.21a1 1 0 0 1 0-1.28 1 1 0 0 1 1.26-.2 2 2 0 0 0 1.73-.56 1 1 0 0 0 .08-1.32 1 1 0 0 1 0-1 1 1 0 0 1 .85-.5c2.44-.05 2.67-.73 3.06-1.87l.14-.39 1.88.69-.13.35A4 4 0 0 1 33 31.74a2.86 2.86 0 0 1-.9 2.37 4.19 4.19 0 0 1-2.25 1.1 3.2 3.2 0 0 1-.76 2 4 4 0 0 1-3.5 1.42 2.6 2.6 0 0 1-.52.78 5.36 5.36 0 0 1-3.63 1.24z"/><path fill="var(--color1)" d="M24.71 38.29a1 1 0 0 1-.56-.17l-6.67-4.52A1 1 0 1 1 18.6 32l6.67 4.51a1 1 0 0 1 .27 1.39 1 1 0 0 1-.83.39zM28.49 35.08a1 1 0 0 1-.59-.2l-6.32-4.6a1 1 0 0 1 1.17-1.61l6.33 4.6a1 1 0 0 1 .22 1.39 1 1 0 0 1-.81.42zM31.68 31.85a1 1 0 0 1-.61-.21l-7-5.41a1 1 0 0 1 1.22-1.59l7 5.41a1 1 0 0 1-.61 1.8z"/></svg>';
    }
    if (iconType === 'finance' || iconType === 'Finance') {
    
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M21.66 32.67a1 1 0 0 1-1-1V20.19a4.87 4.87 0 1 1 9.74 0 1 1 0 1 1-2 0 2.87 2.87 0 1 0-5.74 0v11.48a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M26.74 26.21H18.6a1 1 0 0 1 0-2h8.14a1 1 0 1 1 0 2zM29.4 32.67H18.6a1 1 0 0 1 0-2h10.8a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M24 38.22A14.23 14.23 0 1 1 38.23 24 14.24 14.24 0 0 1 24 38.22zm0-26.45A12.23 12.23 0 1 0 36.23 24 12.24 12.24 0 0 0 24 11.77z"/><path fill="var(--color1)" d="M24 44.05a20.18 20.18 0 0 1-5.5-.77 1 1 0 1 1 .55-1.92A18.05 18.05 0 0 0 35.23 9.87a1 1 0 0 1 1.24-1.57A20 20 0 0 1 24 44.05z"/><path fill="var(--color1)" d="M21.11 46.37a1 1 0 0 1-.8-.4l-2.33-3a1 1 0 0 1-.2-.74 1 1 0 0 1 .39-.66l3.09-2.37a1 1 0 1 1 1.21 1.58l-2.29 1.72 1.72 2.26a1 1 0 0 1-.18 1.4 1 1 0 0 1-.61.21zM12.15 39.92a1 1 0 0 1-.62-.22A20 20 0 0 1 24 4a20.34 20.34 0 0 1 5.5.76 1 1 0 0 1-.5 1.88 18.06 18.06 0 0 0-16.18 31.5 1 1 0 0 1-.62 1.78z"/><path fill="var(--color1)" d="M26.14 9a1 1 0 0 1-.61-1.79l2.29-1.76-1.72-2.2A1 1 0 1 1 27.69 2l2.33 3a1 1 0 0 1 .2.74 1 1 0 0 1-.39.66l-3.09 2.44a1 1 0 0 1-.6.16z"/></svg>';
    }
    if (iconType === 'loans & mortgages' || iconType === 'Loans & Mortgages' || iconType === 'Loans & mortgages') {
      
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M32.08 45h-.28a9.13 9.13 0 0 1 .55-18.25A9.13 9.13 0 0 1 32.08 45zm0-16.25a7.13 7.13 0 1 0 7.12 7.34 7.12 7.12 0 0 0-6.9-7.34h-.22zM16 42.89a14.44 14.44 0 0 1-13.7-10 14.42 14.42 0 0 1 3.16-14.23 1 1 0 0 1 1.42 0 1 1 0 0 1 0 1.41 12.41 12.41 0 0 0-2 2.8 12.39 12.39 0 0 0 16.12 17 1 1 0 0 1 1 .83 1.82 14.37 14.37 0 0 1-5.83 1.2zM41.81 29.85a1 1 0 0 1-.73-1.69 12.65 12.65 0 0 0 2-2.8A12.39 12.39 0 0 0 26.92 8.42a1 1 0 0 1-.82-1.83 14.39 14.39 0 0 1 18.73 19.68 14.17 14.17 0 0 1-2.29 3.26 1 1 0 0 1-.73.32z"/><path fill="var(--color1)" d="M41.81 29.85a1 1 0 0 1-.57-.18 1 1 0 0 1-.41-.64l-.49-2.7a1 1 0 0 1 2-.35l.31 1.7 1.66-.3a1 1 0 0 1 .36 2l-2.67.45zM15 13.37a4.19 4.19 0 0 1-2.91-1.19 2.52 2.52 0 0 1-.72-1.79c.05-1.6 1.74-2.79 3.81-2.75 1.92.06 3.44 1.17 3.61 2.65a1 1 0 0 1-2 .23c0-.35-.7-.85-1.69-.88s-1.74.47-1.75.81a.53.53 0 0 0 .17.35 2.25 2.25 0 0 0 1.52.57 1 1 0 0 1 1 1 1 0 0 1-1.04 1z"/><path fill="var(--color1)" d="M15 17.09h-.16c-1.84-.09-3.4-1.17-3.58-2.63a1 1 0 0 1 2-.24c0 .34.7.84 1.69.87a2.16 2.16 0 0 0 1.55-.47.54.54 0 0 0 .2-.34c0-.34-.67-.88-1.7-.92a1 1 0 0 1 .07-2c2.08.06 3.67 1.37 3.63 3a2.5 2.5 0 0 1-.83 1.73 4.1 4.1 0 0 1-2.87 1z"/><path fill="var(--color1)" d="M14.86 18.54a1 1 0 0 1-1-1l.33-10.35a1 1 0 0 1 1-1 1 1 0 0 1 1 1l-.32 10.35a1 1 0 0 1-1.01 1z"/><path fill="var(--color1)" d="M15 21.76a9.39 9.39 0 1 1 9.4-9.39 9.4 9.4 0 0 1-9.4 9.39zM15 5a7.39 7.39 0 1 0 7.4 7.39A7.39 7.39 0 0 0 15 5z"/><path fill="var(--color1)" d="M6.68 23a1 1 0 0 1-1-.83l-.3-1.7-1.67.31a1 1 0 0 1-.36-2L6 18.36a1 1 0 0 1 .75.16 1 1 0 0 1 .42.65l.48 2.69A1 1 0 0 1 6.86 23zM30.85 40.91a1 1 0 0 1-1-1v-6a3 3 0 1 1 6 0 1 1 0 0 1-2 0 1 1 0 0 1 0-2 0v6a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M33.51 37.53h-4.26a1 1 0 0 1 0-2h4.26a1 1 0 0 1 0 2zM34.9 40.91h-5.65a1 1 0 0 1 0-2h5.65a1 1 0 1 1 0 2z"/></svg>';
    }
    if (iconType === 'lawyer' || iconType === 'Lawyer') {
    
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M41.09 46.5H6.91a1 1 0 0 1-1-1v-43a1 1 0 0 1 1-1h26.6a1 1 0 0 1 0 2H7.91v41h32.18V10.08a1 1 0 1 1 2 0V45.5a1 1 0 0 1-1 1z"/><path fill="var(--color1)" d="M41.09 11.08a1 1 0 0 1-.71-.29L32.8 3.21a1 1 0 0 1 1.42-1.42l7.58 7.58a1 1 0 0 1 0 1.42 1 1 0 0 1-.71.29z"/><path fill="var(--color1)" d="M41.09 11.08h-7.58a1 1 0 0 1-1-1V2.5a1 1 0 0 1 1.71-.71l7.58 7.58a1 1 0 0 1-.71 1.71zm-6.58-2h4.17l-4.17-4.17zM16.44 14.88c-2.64 0-4.71-1.55-4.71-3.53s2.07-3.54 4.71-3.54c2.4 0 4.41 1.35 4.67 3.13a1 1 0 0 1-.84 1.14 1 1 0 0 1-1.13-.84c-.11-.69-1.21-1.43-2.7-1.43s-2.71.82-2.71 1.54 1.11 1.53 2.71 1.53a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M16.44 20C14 20 12 18.62 11.76 16.83a1 1 0 0 1 2-.29c.1.69 1.21 1.43 2.7 1.43s2.7-.82 2.7-1.55-1.11-1.54-2.7-1.54a1 1 0 0 1 0-2c2.64 0 4.7 1.56 4.7 3.54S19.08 20 16.44 20z"/><path fill="var(--color1)" d="M16.44 21.94a1 1 0 0 1-1-1V6.84a1 1 0 0 1 2 0v14.1a1 1 0 0 1-1 1zM30.75 8.59H23.1a1 1 0 0 1 0-2h7.65a1 1 0 0 1 0 2zM30.75 11.93H23.1a1 1 0 0 1 0-2h7.65a1 1 0 0 1 0 2zM38.27 15.27H23.1a1 1 0 0 1 0-2h15.17a1 1 0 0 1 0 2zM38.27 18.6H23.1a1 1 0 0 1 0-2h15.17a1 1 0 0 1 0 2zM38.27 21.94H23.1a1 1 0 0 1 0-2h15.17a1 1 0 0 1 0 2zM38.27 25.27H10.36a1 1 0 1 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 28.61H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 32H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 35.28H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 38.62H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2zM38.27 42H10.36a1 1 0 0 1 0-2h27.91a1 1 0 0 1 0 2z"/></svg>';
    }
    if (iconType === 'car' || iconType === 'Car') {
    
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M5.08 39.53A4.77 4.77 0 0 1 2.4 39c-1.18-.85-1.06-2.87-1-4.35v-.67c.06-4.32 0-8.76 0-13.07v-7.6c-.09-1.85-.1-3.32.69-4.1s2.37-.78 4.34-.68h27.21a9 9 0 0 1 8.93 8.94v3.57h-2v-3.56a6.94 6.94 0 0 0-6.93-6.94H6.36a9.12 9.12 0 0 0-2.87.14 10.44 10.44 0 0 0-.06 2.55v21.56c0 .56-.13 2.28.17 2.62a10.89 10.89 0 0 0 2.92.11h27.11a6.94 6.94 0 0 0 6.93-6.92v-3.66h2v3.59a8.94 8.94 0 0 1-8.93 8.92H6.64c-.58.06-1.09.08-1.56.08z"/><path fill="var(--color1)" d="M31 35.23h-.6v-2h.6zm-.84 0h-.58v-2h.58zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0H27v-2h.57zm-.86 0h-.56v-2h.56zm-.84 0h-.58v-2h.58zm-.85 0h-.57v-2H25zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0H16v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.6zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0H10v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0H8.3v-2h.57zm-.85 0h-.61v-1h-.28v1H5.81V34h1v-.28h-1v-.57h2v.06H8zM7.17 34h.28v-.28h-.28zm24.09 1.2v-2a3.91 3.91 0 0 0 .49 0l.21 2a4.68 4.68 0 0 1-.7.02zm1-.08-.3-2a4 4 0 0 0 .48-.09l.46 2c-.23.04-.44.08-.66.11zm.95-.21L32.65 33l.45-.15.72 1.86a5.81 5.81 0 0 1-.63.22zm.93-.33-.8-1.83c.15-.06.29-.14.44-.21l1 1.76zm.87-.45-1-1.71c.14-.08.27-.17.4-.26l1.18 1.61a5.21 5.21 0 0 1-.59.38zm.81-.57L34.54 32c.13-.11.25-.21.36-.32l1.4 1.43a5.15 5.15 0 0 1-.5.47zm.73-.67-1.47-1.36a2.6 2.6 0 0 0 .3-.36L37 32.4c-.18.18-.32.35-.47.51zm-28.72 0h-2v-.57h2zm29.34-.76L35.5 31a3.85 3.85 0 0 0 .24-.4l1.76 1c-.11.16-.23.4-.35.53zM7.81 32h-2v-.57h2zm29.84-.77-1.81-.87A3.79 3.79 0 0 0 36 30l1.89.65c-.06.2-.14.41-.24.62zm-29.84-.04h-2v-.57h2zm0-.85h-2v-.57h2zm30.2 0-1.92-.56a3.48 3.48 0 0 0 .1-.44l2 .33c-.07.21-.12.43-.19.65zm-30.2-.83h-2v-.57h2zm30.4-.17-2-.23a3.44 3.44 0 0 0 0-.46h2a5.07 5.07 0 0 1 0 .67zm-30.4-.68h-2v-.57h2zm30.44-.28h-2v-.57h2zm-30.44-.59h-2v-.57h2zm30.44-.28h-2v-.57h2zm-30.44-.57h-2v-.57h2zm0-.85h-2v-.57h2zm0-.85h-2v-.57h2zm0-.85h-2v-.57h2zm0-.85h-2V23h2zm0-.85h-2v-.57h2zm0-.85h-2v-.57h2zm0-.85h-2v-.57h2zm30.44-.13h-2v-.57h2zm-30.44-.72h-2v-.57h2zM38.25 20h-2v-.57h2zm-30.44-.71h-2v-.57h2zm28.44-.09a3.44 3.44 0 0 0 0-.45l2-.31c0 .22.06.44.07.67zm-.09-.67a3.74 3.74 0 0 0-.12-.45l1.9-.63c.07.22.13.43.18.65zm-28.35-.09h-2v-.57h2zM36 17.87a2.68 2.68 0 0 0-.19-.42l1.77-.93a4.91 4.91 0 0 1 .28.62zm-28.19-.28h-2V17h2zm27.85-.34c-.08-.13-.17-.26-.26-.39l1.6-1.19c.13.18.26.37.37.56zm-27.85-.51h-2v-.57h2zm27.45-.06c-.1-.12-.21-.24-.32-.35l1.42-1.41c.16.16.31.32.45.49zm-.49-.51c-.11-.11-.24-.21-.36-.31l1.2-1.59c.18.13.35.27.52.42zm-27-.28h-2v-.57h2zm26.41-.16-.41-.26 1-1.74a6.53 6.53 0 0 1 .56.35zm-.62-.37-.44-.19.74-1.86a6.65 6.65 0 0 1 .61.27zm-.66-.28-.42-.08.52-2a5 5 0 0 1 .63.19zM7.81 15h-2v-.57h1v-.28h-1v-1.38H7v1h.28v-1h.57zM7 14.47h.28v-.28H7zm25.29.42-.48-.08.24-2c.22 0 .43.06.64.1zm-.72-.1h-.45v-2a6.08 6.08 0 0 1 .61 0zm-.77 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2H24zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0H20v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2H18zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0H14v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.57v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.61v-2h.57zm-.85 0h-.61v-2h.57z"/><path fill="var(--color1)" d="M42.69 27.94h-8.06a3.95 3.95 0 1 1 0-7.89h8.06a3.95 3.95 0 0 1 0 7.89zm-8.06-5.89a1.95 1.95 0 1 0 0 3.89h8.06a1.95 1.95 0 0 0 0-3.89z"/><path fill="var(--color1)" d="M34.72 22.82A1.18 1.18 0 1 1 33.54 24a1.18 1.18 0 0 1 1.18-1.18z" style="fill-rule:evenodd"/></svg>';
    }
    if (iconType === 'investing' || iconType === 'Investing') {
    
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M42.08 42.68h-10.2V13.92h10.2zm-8.2-2h6.2V15.92h-6.2zM29.78 42.68h-10.2V20.82h10.2zm-8.2-2h6.2V22.82h-6.2zM17.48 42.68H7.28V27h10.2zm-8.2-2h6.2V29h-6.2z"/><path fill="var(--color1)" d="M9.24 23.29a1 1 0 0 1-.75-1.66l7.09-8a1 1 0 0 1 1.15-.25l8.33 3.68 10-10.79a1 1 0 0 1 1.14-.24 1 1 0 0 1 .59 1l-.36 4.55a1 1 0 0 1-2-.16l.14-1.68L26 19a1 1 0 0 1-1.14.24l-8.31-3.67L10 23a1 1 0 0 1-.76.29z"/><path fill="var(--color1)" d="M30.77 8.76a1 1 0 0 1-.15-2l5-.78A1 1 0 1 1 36 8l-5 .78z"/><path fill="var(--color1)" d="M46.5 46.5h-45v-45h45zm-43-2h41v-41h-41z"/></svg>';
    }
    if (iconType === 'hot' || iconType === 'Hot') {
    
      return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M4.86 42.73c-.75 0-1.51 0-2.29-.11A1 1 0 0 1 2 40.91c2.13-2.09 2.25-6.91.33-14.33a1 1 0 0 1 1.62-1c1.72 1.47 4.26 2.08 8.23 2a1 1 0 0 1 .73.29 10.56 10.56 0 0 1 2.92 11.57 1 1 0 0 1-.44.55 20.48 20.48 0 0 1-10.53 2.74zm-.31-2A18.42 18.42 0 0 0 14 38.42a8.48 8.48 0 0 0-2.24-8.86 16.58 16.58 0 0 1-7-1.11c1.24 5.61 1.16 9.66-.21 12.28z"/><path fill="var(--color1)" d="M27.3 41.88a12.4 12.4 0 0 1-7.53-2.29c-1.42-.91-2.35-1.51-4.3-1A1 1 0 0 1 15 36.6c2.77-.66 4.33.34 5.83 1.3 2 1.26 4.21 2.69 10.35 1.6 7.48-1.33 11.9-5.07 12.92-8.5-9.16 4.2-18.1 5-22.62 2a1 1 0 0 1 .52-1.81c3.34-.12 7.89-1.58 9-3.35a1.06 1.06 0 0 0 .13-1c-.76-.77-5.16.59-8.09 1.5a52 52 0 0 1-9.74 2.34 1 1 0 1 1-.19-2 50.72 50.72 0 0 0 9.34-2.27c5.19-1.6 8.93-2.75 10.38-.66a.8.8 0 0 1 .08.16 3 3 0 0 1-.21 3c-1.11 1.8-3.95 3.05-6.69 3.72 4.77.82 11.88-.68 18.88-4.18a1 1 0 0 1 1.45.86c.16 4.6-5 10.44-14.79 12.18a25.09 25.09 0 0 1-4.25.39zM37.54 20.65c-2.31 0-4.12-1.38-4.12-3.14s1.81-3.13 4.12-3.13c2.14 0 3.86 1.16 4.09 2.77a1 1 0 0 1-2 .29c-.08-.5-1-1.06-2.12-1.06s-2.12.61-2.12 1.13.93 1.14 2.12 1.14a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M37.54 24.92c-2.12 0-3.85-1.17-4.09-2.77a1 1 0 1 1 2-.3c.08.5 1 1.07 2.12 1.07s2.12-.6 2.12-1.14-.93-1.13-2.12-1.13a1 1 0 0 1 0-2c2.31 0 4.12 1.38 4.12 3.13s-1.84 3.14-4.15 3.14z"/><path fill="var(--color1)" d="M37.54 27.68a1 1 0 0 1-1-1V12.62a1 1 0 1 1 2 0v14.06a1 1 0 0 1-1 1zM23.7 14.3c-2.31 0-4.12-1.37-4.12-3.13S21.39 8 23.7 8c2.13 0 3.85 1.17 4.09 2.77a1 1 0 0 1-2 .3c-.07-.51-1-1.07-2.11-1.07s-2.12.61-2.12 1.14.92 1.13 2.12 1.13a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M23.7 18.58c-2.13 0-3.85-1.17-4.09-2.78a1 1 0 0 1 2-.29c.07.5 1 1.07 2.11 1.07s2.12-.62 2.12-1.14-.91-1.14-2.12-1.14a1 1 0 0 1 0-2c2.31 0 4.12 1.38 4.12 3.14S26 18.58 23.7 18.58z"/><path fill="var(--color1)" d="M23.7 21.33a1 1 0 0 1-1-1V6.27a1 1 0 0 1 2 0v14.06a1 1 0 0 1-1 1z"/></svg>';
    }
  
    return '<svg width="16" height="16" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="var(--color1)" d="M22.09 46.76A20.82 20.82 0 1 1 28.07 6a1 1 0 1 1-.57 1.92 18.78 18.78 0 1 0 12.6 12.53 1 1 0 0 1 1.9-.58 20.83 20.83 0 0 1-19.91 26.89z"/><path fill="var(--color1)" d="M36.08 22.54a10.65 10.65 0 1 1 10.65-10.65 10.66 10.66 0 0 1-10.65 10.65zm0-19.3a8.65 8.65 0 1 0 8.65 8.65 8.66 8.66 0 0 0-8.65-8.65z"/><path fill="var(--color1)" d="M36.08 12.89c-2.41 0-4.23-1.24-4.23-2.89s1.82-2.9 4.23-2.9c2.18 0 3.94 1.07 4.19 2.53a1 1 0 0 1-.81 1.16A1 1 0 0 1 38.3 10c0-.29-.88-.87-2.22-.87s-2.23.64-2.23.9.78.89 2.23.89a1 1 0 0 1 0 2z"/><path fill="var(--color1)" d="M36.08 16.68c-2.18 0-3.95-1.06-4.2-2.52a1 1 0 1 1 2-.34c0 .29.88.86 2.23.86s2.23-.63 2.23-.89-.78-.9-2.23-.9a1 1 0 0 1 0-2c2.41 0 4.23 1.25 4.23 2.9s-1.85 2.89-4.26 2.89z"/><path fill="var(--color1)" d="M36.08 19.32a1 1 0 0 1-1-1V5.46a1 1 0 0 1 2 0v12.86a1 1 0 0 1-1 1zM23.09 26.94h-9.17a1 1 0 1 1 0-2h7.17V10.47a1 1 0 0 1 2 0z"/></svg>';
  },

  setupArticlesContainer(container, clearContent = true) {
    if (!container) return;

    container.className = "section-articles";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "14px";
    container.style.padding = "0";

    if (clearContent) {
      container.innerHTML = "";
    }
  },

  generateArticleListCardHTML(article, titleLines = 2) {
    if (!article) return "";

    const formattedDate = article.create_time
      ? Utils.formatTime(article.create_time)
      : "";
    const title = Utils.truncateTextToLines(article.title || "", titleLines);
    const imageUrl = Utils.getArticleImage(article);
    const articleId = article.id || "";

    return `
      <div class="card-list" data-id="${articleId}">
        <div class="list-content">
          <h3 class="list-title">${title}</h3>
          <div class="list-meta">
            ${
              formattedDate
                ? `<span class="list-date">${formattedDate}</span>`
                : ""
            }
          </div>
        </div>
        <div class="list-img">
          <img src="${imageUrl}" alt="${
      article.title || ""
    }" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.style.display='none'; this.parentElement.classList.add('no-image');">
        </div>
      </div>
    `;
  },

  generateArticleListHTML(articles, titleLines = 2) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return "";
    }

    return articles
      .map((article) => Utils.generateArticleListCardHTML(article, titleLines))
      .join("");
  },

  generateArticleGridCardHTML(article, titleLines = 3) {
    if (!article) return "";

    const title = Utils.truncateTextToLines(article.title || "", titleLines);
    const imageUrl = Utils.getArticleImage(article);
    const articleId = article.id || "";

    return `
      <div class="card-simple" data-id="${articleId}">
        <div class="img-simple">
          <img src="${imageUrl}" alt="${article.title || ""}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
          <div class="placeholder-image" style="display: none; width: 100%; height: 100%; background: linear-gradient(135deg, #746097 0%, #7bb3d4 100%); color: white; align-items: center; justify-content: center; font-size: 14px; text-align: center; padding: 10px;">
            <div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 8px;">
                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C21 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor"/>
              </svg>
              <div>Image</div>
              <div style="font-size: 12px; opacity: 0.8;">Not Available</div>
            </div>
          </div>
        </div>
        <h3 class="title-simple">${title}</h3>
      </div>
    `;
  },

  generateArticleGridHTML(articles, titleLines = 3) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return "";
    }

    return articles
      .map((article) => Utils.generateArticleGridCardHTML(article, titleLines))
      .join("");
  },

  setupArticlesContainerForGrid(container, clearContent = true) {
    if (!container) return;

    container.className = "section-articles";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(2, 1fr)";
    container.style.gap = "15px";
    container.style.padding = "0 20px";
    container.style.maxWidth = "1200px";
    container.style.margin = "0 auto";

    if (clearContent) {
      container.innerHTML = "";
    }
  },
};

const RemoteDataConfig = {
  get baseUrl() {
    return window.DataConfig.baseUrl;
  },
  get dbUrl() {
    return window.DataConfig.dbUrl;
  },
  datasetKey: "info1",

  articleDataUrl(id) {
    return `${this.baseUrl}/${id}/${window.DataConfig.contentPath}/data.json`;
  },

  articleImageUrl(id, imageIndex = 1) {
    return `${this.baseUrl}/${id}/${imageIndex}.jpg`;
  },

  extractArticles(rawData) {
    let allArticles = [];
    let categories = [];
    
    if (Array.isArray(rawData)) {
      if (rawData.length > 0 && rawData[0] && rawData[0].info1) {
        categories = rawData[0].info1;
      }
      allArticles = rawData.slice(1);
    } else if (rawData && this.datasetKey && Array.isArray(rawData[this.datasetKey])) {
      allArticles = rawData[this.datasetKey];
    }
    
    const numMatch = window.DataConfig.dbUrl.match(/num=(\d+)/);
    const numPerCategory = numMatch && numMatch[1] ? parseInt(numMatch[1], 10) : 1;
    
    const articlesByCategory = {};
    allArticles.forEach(article => {
      const category = article.type || 'Unknown';
      if (!articlesByCategory[category]) {
        articlesByCategory[category] = [];
      }
      articlesByCategory[category].push(article);
    });
    
    
    
    
    Object.keys(articlesByCategory).forEach(category => {
      articlesByCategory[category].slice(0, 2).forEach((article, index) => {
        
      });
    });
    
    const result = [];
    
    
    categories.forEach(category => {
      if (articlesByCategory[category]) {
        
        result.push(...articlesByCategory[category].slice(0, numPerCategory));
      } else {
        
      }
    });
    
    
    return result;
  },
};

window.Utils = Utils;
window.RemoteDataConfig = RemoteDataConfig;

class BackToTop {
  constructor() {
    this.backToTopBtn = document.getElementById("backToTopBtn");
    this.init();
  }

  init() {
    if (this.backToTopBtn) {
      this.bindEvents();
      this.checkScrollPosition();
    }
  }

  bindEvents() {
    this.backToTopBtn.addEventListener("click", () => {
      this.scrollToTop();
    });

    window.addEventListener(
      "scroll",
      Utils.throttle(() => {
        this.checkScrollPosition();
      }, 100)
    );
  }

  checkScrollPosition() {
    if (window.pageYOffset > 300) {
      this.backToTopBtn.classList.add("show");
    } else {
      this.backToTopBtn.classList.remove("show");
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new BackToTop();
});

class SidebarMenu {
  constructor(options = {}) {
    this.menuId = options.menuId || "sidebarMenu";
    this.overlayId = options.overlayId || "sidebarOverlay";
    this.toggleId = options.toggleId || "sidebarToggle";
    this.closeButtonId = options.closeButtonId || "sidebarClose";

    this.isInPagesDirectory = window.location.pathname.includes("/pages/");

    this.homeUrl =
      options.homeUrl ||
      (this.isInPagesDirectory ? "../index.html" : "index.html");

    this.categoryUrlPrefix =
      options.categoryUrlPrefix ||
      (this.isInPagesDirectory
        ? "category.html?type="
        : "pages/category.html?type=");

    this.categories = this.normalizeCategories(options.categories || []);
    this.fetchCategories =
      options.fetchCategories !== false && this.categories.length === 0;

    this.sidebarMenuEl = null;
    this.sidebarOverlayEl = null;
    this.sidebarToggleEl = null;
    this.sidebarCloseEl = null;

    if (options.autoInit !== false) {
      this.init();
    }
  }

  normalizeCategories(categories) {
    return categories
      .filter((category) => category && category.name && category.id !== "all")
      .map((category) => ({
        id: category.id || this.generateIdFromName(category.name),
        name: category.name,
      }));
  }

  generateIdFromName(name) {
    return name.toLowerCase().replace(/&/g, "").replace(/\s+/g, "-");
  }

  async init() {
    this.sidebarMenuEl = document.getElementById(this.menuId);
    this.sidebarOverlayEl = document.getElementById(this.overlayId);
    this.sidebarToggleEl = document.getElementById(this.toggleId);

    if (!this.sidebarMenuEl) {
      return;
    }

    if (this.fetchCategories) {
      try {
        this.categories = await this.loadCategoriesFromData();
      } catch (error) {
        this.categories = [];
      }
    }

    this.renderMenu();
    this.bindCoreEvents();
  }

  async loadCategoriesFromData() {
    if (!RemoteDataConfig || !RemoteDataConfig.dbUrl) {
      throw new Error("RemoteDataConfig.dbUrl is not configured");
    }

    const response = await fetch(RemoteDataConfig.dbUrl, {
      cache: "no-store",
    }).catch((error) => {
      return null;
    });

    if (!response || !response.ok) {
      throw new Error(
        `Failed to fetch sidebar data: ${
          response ? response.status : "network error"
        }`
      );
    }

    const rawData = await response.json();
    const articles = RemoteDataConfig.extractArticles(rawData);
    if (!Array.isArray(articles)) {
      return [];
    }

    const typeSet = new Set();
    articles.forEach((article) => {
      if (article.type) {
        typeSet.add(article.type);
      }
    });

    return Array.from(typeSet).map((type) => ({
      id: this.generateIdFromName(type),
      name: type,
    }));
  }

  renderMenu() {
    if (!this.sidebarMenuEl) return;

    const categoryLinks = this.categories
      .map((category) => {
        const encodedName = encodeURIComponent(category.name);
        return `
          <a href="${this.categoryUrlPrefix}${encodedName}" class="sidebar-item">
            <span>${category.name}</span>
          </a>
        `;
      })
      .join("");

    this.sidebarMenuEl.innerHTML = `
      <div class="sidebar-content">
        <div class="sidebar-header">
          <h3>Menu</h3>
          <button class="sidebar-close" id="${this.closeButtonId}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="sidebar-items">
          <a href="${this.homeUrl}" class="sidebar-item">
            <span>Home</span>
          </a>
          <div class="sidebar-category">
            ${categoryLinks}
          </div>
        </div>
      </div>
    `;

    this.sidebarCloseEl = document.getElementById(this.closeButtonId);
    this.bindSidebarNavigation();
    if (this.sidebarCloseEl) {
      this.sidebarCloseEl.addEventListener("click", () => {
        this.closeSidebar();
      });
    }
  }

  bindCoreEvents() {
    if (this.sidebarToggleEl) {
      this.sidebarToggleEl.addEventListener("click", () => {
        this.openSidebar();
      });
    }

    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    document.addEventListener("keydown", this.handleEscapeKey);
  }

  handleEscapeKey = (e) => {
    if (e.key === "Escape") {
      this.closeSidebar();
    }
  };

  bindSidebarNavigation() {
    const sidebarItems = this.sidebarMenuEl.querySelectorAll(".sidebar-item");
    sidebarItems.forEach((item) => {
      const href = item.getAttribute("href");
      item.addEventListener("click", (event) => {
        event.preventDefault();
        if (href) {
          window.location.href = href;
        }
        setTimeout(() => {
          this.closeSidebar();
        }, 100);
      });
    });
  }

  openSidebar() {
    if (this.sidebarMenuEl) {
      this.sidebarMenuEl.classList.add("active");
      document.body.style.overflow = "hidden";
    }
    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.classList.add("active");
    }
  }

  closeSidebar() {
    if (this.sidebarMenuEl) {
      this.sidebarMenuEl.classList.remove("active");
      document.body.style.overflow = "";
    }
    if (this.sidebarOverlayEl) {
      this.sidebarOverlayEl.classList.remove("active");
    }
  }

  updateCategories(categories = []) {
    this.categories = this.normalizeCategories(categories);
    this.renderMenu();
  }
}

window.SidebarMenu = SidebarMenu;

class StaticPage {
  constructor(options = {}) {
    this.homeUrl = options.homeUrl || "index.html";
    this.sidebarMenu = null;
    this.init();
  }

  init() {
    this.sidebarMenu = new SidebarMenu({
      homeUrl: this.homeUrl,
      fetchCategories: true,
    });

    initSmartBackButton(this.homeUrl);
  }
}

window.StaticPage = StaticPage;

function initSmartBackButton(homeUrl = null) {
  const backButton = document.getElementById("smartBackButton");
  if (!backButton) return;

  if (!homeUrl) {
    const pathname = window.location.pathname;
    const isInPagesDirectory = pathname.includes("/pages/");
    homeUrl = isInPagesDirectory ? "../index.html" : "index.html";
  }

  backButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = homeUrl;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;
  const isAboutPage = pathname.includes("about.html");
  const isPrivacyPage = pathname.includes("privacy.html");

  const hasBackButton = document.getElementById("smartBackButton");

  if ((isAboutPage || isPrivacyPage) && hasBackButton) {
    const homeUrl = pathname.includes("/pages/")
      ? "../index.html"
      : "index.html";
    new StaticPage({ homeUrl });
  } else if (hasBackButton) {
    initSmartBackButton();
  }
});
