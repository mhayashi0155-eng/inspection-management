from PIL import Image

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # Change all white (also shades of whites) to transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    remove_white_bg(
        r"c:\Users\M-HAYASHI\Desktop\右画面\点検表管理\assets\icons\bulldozer.png",
        r"c:\Users\M-HAYASHI\Desktop\右画面\点検表管理\assets\icons\bulldozer.png"
    )
