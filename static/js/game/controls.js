export function setupControls(canvas, stone, slingOrigin, groundHeight, resetTimeoutRef, slingSnapState) {
    function getPointerPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      } else {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        };
      }
    }
  
    function clearResetTimeout() {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    }
  
    canvas.addEventListener("mousedown", (e) => {
      const { x: mouseX, y: mouseY } = getPointerPos(e);
      const dx = mouseX - stone.x;
      const dy = mouseY - stone.y;
      if (Math.sqrt(dx * dx + dy * dy) < stone.radius * 2 && !stone.isFlying) {
        stone.isDragging = true;
        slingSnapState.snapping = false;
        slingSnapState.progress = 0;
        clearResetTimeout();
      }
    });
  
    canvas.addEventListener("mousemove", (e) => {
      if (stone.isDragging) {
        const { x: mouseXRaw, y: mouseYRaw } = getPointerPos(e);
        let mouseX = mouseXRaw;
        let mouseY = mouseYRaw;
  
        const dx = mouseX - slingOrigin.x;
        if (dx > 0) mouseX = slingOrigin.x;
        if (mouseY > canvas.height - groundHeight - stone.radius) {
          mouseY = canvas.height - groundHeight - stone.radius;
        }
  
        stone.x = mouseX;
        stone.y = mouseY;
      }
    });
  
    window.addEventListener("mouseup", () => {
      if (stone.isDragging) {
        stone.isDragging = false;
        stone.isFlying = true;
        stone.vx = (slingOrigin.x - stone.x) * 0.2;
        stone.vy = (slingOrigin.y - stone.y) * 0.2;
        slingSnapState.snapping = true;
        slingSnapState.progress = 0;
      }
    });
  
    canvas.addEventListener("touchstart", (e) => {
      const { x: touchX, y: touchY } = getPointerPos(e);
      const dx = touchX - stone.x;
      const dy = touchY - stone.y;
      if (Math.sqrt(dx * dx + dy * dy) < stone.radius * 2 && !stone.isFlying) {
        stone.isDragging = true;
        slingSnapState.snapping = false;
        slingSnapState.progress = 0;
        clearResetTimeout();
        e.preventDefault();
      }
    }, { passive: false });
  
    canvas.addEventListener("touchmove", (e) => {
      if (stone.isDragging) {
        const { x: touchXRaw, y: touchYRaw } = getPointerPos(e);
        let touchX = touchXRaw;
        let touchY = touchYRaw;
  
        const dx = touchX - slingOrigin.x;
        if (dx > 0) touchX = slingOrigin.x;
        if (touchY > canvas.height - groundHeight - stone.radius) {
          touchY = canvas.height - groundHeight - stone.radius;
        }
  
        stone.x = touchX;
        stone.y = touchY;
        e.preventDefault();
      }
    }, { passive: false });
  
    window.addEventListener("touchend", (e) => {
      if (stone.isDragging) {
        stone.isDragging = false;
        stone.isFlying = true;
        stone.vx = (slingOrigin.x - stone.x) * 0.2;
        stone.vy = (slingOrigin.y - stone.y) * 0.2;
        slingSnapState.snapping = true;
        slingSnapState.progress = 0;
        e.preventDefault();
      }
    }, { passive: false });
  }
  