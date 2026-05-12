from PIL import Image, ImageDraw, ImageFilter

def perfect_logo_crop(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # 1. Detect bbox with VERY high threshold (ignore anything that isn't clearly part of the glow)
    gray = img.convert("L")
    mask = gray.point(lambda p: p > 60 and 255)
    bbox = mask.getbbox()
    
    if not bbox:
        print("Could not find bbox")
        return

    # 2. Add significant internal padding to cut through the outer black shell
    # Based on the user's feedback, we need to go even deeper.
    padding = 32 # Deeper cut
    bbox = (bbox[0] + padding, bbox[1] + padding, bbox[2] - padding, bbox[3] - padding)
    
    cropped = img.crop(bbox)
    
    # 3. Apply rounded corner mask that fits exactly to the edges
    width, height = cropped.size
    radius = int(min(width, height) * 0.12) # Slightly smaller radius for tighter fit
    
    final_mask = Image.new('L', cropped.size, 0)
    draw = ImageDraw.Draw(final_mask)
    draw.rounded_rectangle([(0, 0), cropped.size], radius=radius, fill=255)
    
    # Anti-aliasing
    final_mask = final_mask.filter(ImageFilter.SMOOTH_MORE)
    
    cropped.putalpha(final_mask)
    cropped.save(output_path)
    print(f"Perfect tight crop saved: {bbox}, radius: {radius}")

perfect_logo_crop('apps/user-web/assets/wanderviet-logo-final.png', 'apps/user-web/assets/wanderviet-logo-cropped-rounded.png')
