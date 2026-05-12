from PIL import Image, ImageDraw

def make_rounded_transparent(image_path, output_path, radius):
    img = Image.open(image_path).convert("RGBA")
    
    # Create mask
    mask = Image.new('L', img.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), img.size], radius=radius, fill=255)
    
    # Put mask
    img.putalpha(mask)
    img.save(output_path)
    print("Rounded corners applied and saved")

make_rounded_transparent('apps/user-web/assets/wanderviet-logo-cropped.png', 'apps/user-web/assets/wanderviet-logo-cropped-rounded.png', 200)
