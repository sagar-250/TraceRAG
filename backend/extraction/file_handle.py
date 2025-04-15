import cloudinary
import cloudinary.uploader
from urllib.parse import urlparse
from cloudinary.utils import cloudinary_url
import requests
# Configuration       
cloudinary.config( 
    cloud_name = "djpd8kigo", 
    api_key = "978343784223915", 
    api_secret = "vCythfL1yW0FsfhP-FQb6KJMepk", 
    secure=True
)

import cloudinary.uploader
import os
from datetime import datetime

def upload_file_to_cloudinary(file_path: str, folder: str = "") -> dict:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    file_name = os.path.basename(file_path)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    public_id = f"{os.path.splitext(file_name)[0]}_{timestamp}"
    result = cloudinary.uploader.upload(
        file_path,
        folder=folder,
        public_id=public_id,
        resource_type="raw"
    )
    return result["secure_url"]


def download_from_cloudinary(url: str, save_folder: str = ".") -> str:
    path = urlparse(url).path
    public_id = os.path.basename(path).split(".")[0]
    file_extension = os.path.splitext(path)[1]
    os.makedirs(save_folder, exist_ok=True)
    base_save_path = os.path.join(save_folder, f"{public_id}{file_extension}")
    save_path = base_save_path
    counter = 1
    while os.path.exists(save_path):
        save_path = os.path.join(save_folder, f"{public_id}_{counter}{file_extension}")
        counter += 1
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(save_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return save_path
    else:
        raise Exception(f"Failed to download file: {response.status_code} - {response.text}")
