import io
import base64
import qrcode
from qrcode.image.styledpil import StyledPilImage

def generate_qr_base64(data: str) -> str:
    """
    Generates a high-contrast base64 encoded PNG QR code.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#1E40AF", back_color="#FFFFFF")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_bytes = buffered.getvalue()
    return f"data:image/png;base64,{base64.b64encode(img_bytes).decode('utf-8')}"
