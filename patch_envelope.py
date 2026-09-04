import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

envelope_path = r"c:\digital invitation emna_siala\envelope_orig.png"
font_path = r"c:\digital invitation emna_siala\PinyonScript-Regular.ttf"

# 1. Load full original envelope (941 x 1672 BGR)
img_bgr = cv2.imread(envelope_path)
h, w, _ = img_bgr.shape

# Seal region crop (y: 697 to 997, x: 321 to 621)
crop = img_bgr[697:997, 321:621]

# Detect gold stroke pixels of D&A in crop
wax_bg = np.array([210, 225, 238], dtype=float) # BGR
dist = np.linalg.norm(crop.astype(float) - wax_bg, axis=2)

stroke_mask = (dist > 38).astype(np.uint8) * 255
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
stroke_mask = cv2.dilate(stroke_mask, kernel, iterations=2)

# Perform Navier-Stokes inpainting to seamlessly erase D&A strokes while preserving 3D wax texture
inpainted_crop = cv2.inpaint(crop, stroke_mask, 7, cv2.INPAINT_TELEA)

# Replace crop in full img_bgr
img_bgr[697:997, 321:621] = inpainted_crop

# Convert to PIL RGBA image
env_pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGBA))

# 2. Render 3D Gold Cursive Calligraphy: Y & F
cx, cy = 471, 847
font_large = ImageFont.truetype(font_path, 115)
font_amp = ImageFont.truetype(font_path, 70)

text_layer = Image.new('RGBA', (w, h), (0, 0, 0, 0))
tdraw = ImageDraw.Draw(text_layer)

y_x, y_y = cx - 64, cy - 66
amp_x, amp_y = cx - 12, cy - 32
f_x, f_y = cx + 16, cy - 66

# 3D Deep Shadow / Emboss
tdraw.text((y_x + 2.5, y_y + 2.5), 'Y', font=font_large, fill=(55, 38, 14, 230))
tdraw.text((amp_x + 2, amp_y + 2), '&', font=font_amp, fill=(70, 48, 18, 230))
tdraw.text((f_x + 2.5, f_y + 2.5), 'F', font=font_large, fill=(55, 38, 14, 230))

# Gold Highlight
tdraw.text((y_x - 1.5, y_y - 1.5), 'Y', font=font_large, fill=(255, 250, 230, 245))
tdraw.text((amp_x - 1.5, amp_y - 1.5), '&', font=font_amp, fill=(255, 250, 230, 245))
tdraw.text((f_x - 1.5, f_y - 1.5), 'F', font=font_large, fill=(255, 250, 230, 245))

# Warm Metallic Gold Main Fill
tdraw.text((y_x, y_y), 'Y', font=font_large, fill=(185, 142, 68, 255))
tdraw.text((amp_x, amp_y), '&', font=font_amp, fill=(160, 120, 52, 255))
tdraw.text((f_x, f_y), 'F', font=font_large, fill=(185, 142, 68, 255))

env_pil.alpha_composite(text_layer)

# Save to all envelope image files in workspace
output_path = r"c:\digital invitation emna_siala\envelope_yf.png"
env_pil.save(output_path, "PNG")
env_pil.save(r"c:\digital invitation emna_siala\envelope_yessine_fatma.png", "PNG")
print(f"Successfully saved inpainted 3D Y&F envelope to {output_path}")
