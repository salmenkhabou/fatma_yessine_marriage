import urllib.request
import ssl
from PIL import Image, ImageDraw, ImageFont, ImageFilter

envelope_path = r"c:\digital invitation emna_siala\envelope_orig.png"
font_path = r"c:\digital invitation emna_siala\PinyonScript-Regular.ttf"

env_img = Image.open(envelope_path).convert("RGBA")
w, h = env_img.size

cx = 470
cy = 878
radius = 112

# 1. Smooth Pearl Wax Seal Face Fill
fill_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
fdraw = ImageDraw.Draw(fill_layer)

for r in range(radius, 0, -1):
    factor = r / radius
    r_col = int(251 - factor * 12)
    g_col = int(244 - factor * 16)
    b_col = int(235 - factor * 20)
    fdraw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(r_col, g_col, b_col, 255))

# Feathered blending mask
mask = Image.new('L', (w, h), 0)
mdraw = ImageDraw.Draw(mask)
mdraw.ellipse((cx - radius + 2, cy - radius + 2, cx + radius - 2, cy + radius - 2), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2.5))

env_img.paste(fill_layer, (0, 0), mask)

# 2. Render 3D Gold Cursive Script Calligraphy: Y & F
text_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
tdraw = ImageDraw.Draw(text_layer)

script_font_large = ImageFont.truetype(font_path, 125)
script_font_amp = ImageFont.truetype(font_path, 75)

# Centered Monogram Position for Pinyon Script Y & F
y_x, y_y = cx - 64, cy - 70
amp_x, amp_y = cx - 12, cy - 36
f_x, f_y = cx + 18, cy - 70

# 3D Shadow / Emboss
tdraw.text((y_x + 2, y_y + 2), "Y", font=script_font_large, fill=(70, 50, 20, 220))
tdraw.text((amp_x + 2, amp_y + 2), "&", font=script_font_amp, fill=(90, 65, 30, 220))
tdraw.text((f_x + 2, f_y + 2), "F", font=script_font_large, fill=(70, 50, 20, 220))

# Gold Highlight
tdraw.text((y_x - 1.5, y_y - 1.5), "Y", font=script_font_large, fill=(255, 250, 225, 240))
tdraw.text((amp_x - 1.5, amp_y - 1.5), "&", font=script_font_amp, fill=(255, 250, 225, 240))
tdraw.text((f_x - 1.5, f_y - 1.5), "F", font=script_font_large, fill=(255, 250, 225, 240))

# Warm Metallic Gold Main Fill
tdraw.text((y_x, y_y), "Y", font=script_font_large, fill=(185, 142, 68, 255))
tdraw.text((amp_x, amp_y), "&", font=script_font_amp, fill=(160, 120, 52, 255))
tdraw.text((f_x, f_y), "F", font=script_font_large, fill=(185, 142, 68, 255))

env_img.alpha_composite(text_layer)

# Save patched envelope
output_path = r"c:\digital invitation emna_siala\envelope_yf.png"
env_img.save(output_path, "PNG")
print(f"Successfully saved refined Pinyon Script Y&F envelope to {output_path}")
