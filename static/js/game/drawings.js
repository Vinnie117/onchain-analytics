export function drawGround(ctx, canvas, groundHeight) {
    ctx.fillStyle = "#654321";
    ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
  }
  
  export function drawSlingshotStick(ctx, canvas, slingOrigin, groundHeight) {
    const baseY = canvas.height - groundHeight;
    ctx.beginPath();
    ctx.moveTo(slingOrigin.x - 10, baseY);
    ctx.lineTo(slingOrigin.x, slingOrigin.y);
    ctx.lineTo(slingOrigin.x + 10, baseY);
    ctx.strokeStyle = "saddlebrown";
    ctx.lineWidth = 8;
    ctx.stroke();
  }
  
  export function drawSlingshot(ctx, stone, slingOrigin, slingSnapping, slingSnapBackProgress) {
    if (stone.isDragging) {
      ctx.beginPath();
      ctx.moveTo(slingOrigin.x, slingOrigin.y);
      ctx.lineTo(stone.x, stone.y);
      ctx.strokeStyle = "brown";
      ctx.lineWidth = 5;
      ctx.stroke();
    } else if (slingSnapping) {
      const dx = stone.x - slingOrigin.x;
      const dy = stone.y - slingOrigin.y;
      const snapX = slingOrigin.x + dx * (1 - slingSnapBackProgress);
      const snapY = slingOrigin.y + dy * (1 - slingSnapBackProgress);
      ctx.beginPath();
      ctx.moveTo(slingOrigin.x, slingOrigin.y);
      ctx.lineTo(snapX, snapY);
      ctx.strokeStyle = "brown";
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }
  