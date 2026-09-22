import qrcode
import io
import base64

def generate_qr_base64(data_string):
    """
    Generates a base64 encoded PNG image data URI for the given string content.
    Returns: 'data:image/png;base64,....'
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(data_string)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    
    return f"data:image/png;base64,{img_str}"
