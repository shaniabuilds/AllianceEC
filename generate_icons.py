import os
from PIL import Image, ImageDraw

def create_icons():
    source_logo_path = 'logo.png'
    if not os.path.exists(source_logo_path):
        raise FileNotFoundError(f"Source logo {source_logo_path} not found.")

    img = Image.open(source_logo_path).convert('RGBA')
    print(f"Loaded logo: {img.size}")

    # Ensure app assets directory exists
    app_assets_dir = 'app/assets/images'
    os.makedirs(app_assets_dir, exist_ok=True)
    img.save(os.path.join(app_assets_dir, 'logo.png'))
    print("Saved logo to app/assets/images/logo.png")

    # Ensure client public directory exists
    client_public_dir = 'client/public'
    if os.path.exists(client_public_dir):
        img.save(os.path.join(client_public_dir, 'logo.png'))
        # Also create favicon
        fav = img.resize((64, 64), Image.Resampling.LANCZOS)
        fav.save(os.path.join(client_public_dir, 'favicon.png'))
        print("Saved logo and favicon to client/public/")

    # Densities for Android
    densities = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }

    res_dir = 'app/android/app/src/main/res'

    for folder, size in densities.items():
        folder_path = os.path.join(res_dir, folder)
        os.makedirs(folder_path, exist_ok=True)

        # 1. Standard ic_launcher (Square with white rounded card background & padding)
        # Using a solid crisp white background with 12% padding for safe area
        launcher = Image.new('RGBA', (size, size), (255, 255, 255, 255))
        
        # Calculate scaled logo size maintaining aspect ratio
        padding = int(size * 0.10)
        target_box_size = size - (2 * padding)
        w, h = img.size
        ratio = min(target_box_size / w, target_box_size / h)
        new_w, new_h = int(w * ratio), int(h * ratio)
        resized_logo = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        offset_x = (size - new_w) // 2
        offset_y = (size - new_h) // 2
        launcher.paste(resized_logo, (offset_x, offset_y), resized_logo)
        
        launcher_path = os.path.join(folder_path, 'ic_launcher.png')
        launcher.save(launcher_path)
        print(f"Saved {launcher_path} ({size}x{size})")

        # 2. Round ic_launcher_round (Circle with white background & circular mask)
        # Target size inside circle safe zone (~72% of circle diameter)
        round_canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(round_canvas)
        draw.ellipse([(0, 0), (size - 1, size - 1)], fill=(255, 255, 255, 255))

        round_padding = int(size * 0.16)
        round_target_size = size - (2 * round_padding)
        round_ratio = min(round_target_size / w, round_target_size / h)
        r_w, r_h = int(w * round_ratio), int(h * round_ratio)
        resized_round_logo = img.resize((r_w, r_h), Image.Resampling.LANCZOS)

        r_offset_x = (size - r_w) // 2
        r_offset_y = (size - r_h) // 2
        round_canvas.paste(resized_round_logo, (r_offset_x, r_offset_y), resized_round_logo)

        # Apply circular alpha mask
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([(0, 0), (size - 1, size - 1)], fill=255)
        round_canvas.putalpha(mask)

        round_path = os.path.join(folder_path, 'ic_launcher_round.png')
        round_canvas.save(round_path)
        print(f"Saved {round_path} ({size}x{size})")

    # 3. Google Play Store 512x512 High-Res Icon
    store_size = 512
    store_icon = Image.new('RGBA', (store_size, store_size), (255, 255, 255, 255))
    store_padding = int(store_size * 0.10)
    store_target_size = store_size - (2 * store_padding)
    store_ratio = min(store_target_size / w, store_target_size / h)
    s_w, s_h = int(w * store_ratio), int(h * store_ratio)
    resized_store_logo = img.resize((s_w, s_h), Image.Resampling.LANCZOS)
    s_offset_x = (store_size - s_w) // 2
    s_offset_y = (store_size - s_h) // 2
    store_icon.paste(resized_store_logo, (s_offset_x, s_offset_y), resized_store_logo)

    store_icon.save('play-store-icon.png')
    print("Saved 512x512 Play Store icon to play-store-icon.png")

if __name__ == '__main__':
    create_icons()
