from PIL import Image
import sys

def crop_black_borders(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    
    # Get bounding box of non-black pixels
    # We will use a threshold to determine black
    bg = Image.new("RGBA", img.size, (0,0,0,255))
    diff = Image.composite(img, bg, img)
    # Convert to grayscale to check brightness
    gray = diff.convert("L")
    # Anything > 10 is considered non-black
    bbox = gray.point(lambda p: p > 10 and 255).getbbox()
    
    if bbox:
        cropped = img.crop(bbox)
        cropped.save(output_path)
        print(f"Cropped successfully: {bbox}")
    else:
        print("Could not find bounding box")

crop_black_borders('apps/user-web/assets/wanderviet-logo-final.png', 'apps/user-web/assets/wanderviet-logo-cropped.png')
