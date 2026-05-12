from PIL import Image, ImageDraw, ImageFilter

def refine_logo_crop(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # 1. More aggressive bounding box detection
    # Use a higher threshold to ignore the very dark grey edges
    gray = img.convert("L")
    # Mask out anything that is very dark (threshold 30)
    mask = gray.point(lambda p: p > 30 and 255)
    bbox = mask.getbbox()
    
    if not bbox:
        print("Could not find bbox")
        return

    # 2. Add a tiny internal padding (2-3 pixels) to cut off the black edge
    padding = 4
    bbox = (bbox[0] + padding, bbox[1] + padding, bbox[2] - padding, bbox[3] - padding)
    
    cropped = img.crop(bbox)
    
    # 3. Apply a perfect rounded corner mask to the cropped version
    # The icon seems to have a specific radius. Let's calculate it proportional to size.
    width, height = cropped.size
    radius = int(min(width, height) * 0.18) # Approx 18% radius for squircle look
    
    final_mask = Image.new('L', cropped.size, 0)
    draw = ImageDraw.Draw(final_mask)
    draw.rounded_rectangle([(0, 0), cropped.size], radius=radius, fill=255)
    
    # Smooth the mask edges (anti-aliasing)
    final_mask = final_mask.filter(ImageFilter.SMOOTH)
    
    cropped.putalpha(final_mask)
    cropped.save(output_path)
    print(f"Refined crop saved: {bbox}, radius: {radius}")

refine_logo_crop('apps/user-web/assets/wanderviet-logo-final.png', 'apps/user-web/assets/wanderviet-logo-cropped-rounded.png')
