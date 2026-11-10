import struct

with open('/tmp/saree.bmp', 'rb') as f:
    header = f.read(54)
    header_size, width, raw_height, planes, bpp, compression = struct.unpack('<IiiHHI', header[14:34])
    height = abs(raw_height)
    top_down = (raw_height < 0)
    row_size = ((width * bpp + 31) // 32) * 4
    rows = [f.read(row_size) for _ in range(height)]

def get_pixel(x, y_from_top):
    y_bmp = y_from_top if top_down else (height - 1 - y_from_top)
    idx = x * 3
    return rows[y_bmp][idx:idx+3]

crop_x1 = 292
crop_x2 = 695
crop_y1 = 410
crop_y2 = 960

crop_w = crop_x2 - crop_x1
crop_h = crop_y2 - crop_y1
print(f"Cropping: x={crop_x1}..{crop_x2} (w={crop_w}), y={crop_y1}..{crop_y2} (h={crop_h})")

out_row_size = ((crop_w * 3 + 3) // 4) * 4
pad = b'\x00' * (out_row_size - crop_w * 3)
file_size = 54 + out_row_size * crop_h

out_header = struct.pack('<2sIHHI', b'BM', file_size, 0, 0, 54)
out_dib = struct.pack('<IiiHHI', 40, crop_w, -crop_h, 1, 24, 0) + b'\x00' * 24

with open('/tmp/saree_pure_model.bmp', 'wb') as f:
    f.write(out_header)
    f.write(out_dib)
    for y in range(crop_y1, crop_y2):
        row_bytes = bytearray()
        for x in range(crop_x1, crop_x2):
            row_bytes.extend(get_pixel(x, y))
        row_bytes.extend(pad)
        f.write(row_bytes)

print("Saved /tmp/saree_pure_model.bmp successfully.")

