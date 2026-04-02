import os
from PIL import Image

def analyze_image(path):
    print(f"Analyzing: {os.path.basename(path)}")
    try:
        img = Image.open(path)
        print(f"  Mode: {img.mode}")
        print(f"  Size: {img.size}")
        
        # Check corner pixel color
        corner = img.getpixel((0, 0))
        print(f"  Corner pixel (0,0): {corner}")
        
        if img.mode == 'RGBA':
            extrema = img.getextrema()
            alpha_extrema = extrema[3]
            print(f"  Alpha range: {alpha_extrema}")
            if alpha_extrema[0] == 255:
                print("  -> Image is fully OPAQUE (no transparency).")
            else:
                print("  -> Image has TRANSPARENCY.")
        else:
            print("  -> Image is not RGBA (likely OPAQUE).")
            
    except Exception as e:
        print(f"  Error: {e}")
    print("-" * 20)

base_dir = r"c:\Users\M-HAYASHI\Desktop\右画面\点検表管理\assets\icons"
analyze_image(os.path.join(base_dir, "backhoe.png"))
analyze_image(os.path.join(base_dir, "bulldozer.png"))
