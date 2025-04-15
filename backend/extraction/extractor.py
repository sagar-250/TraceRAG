import fitz
import tabula
import pandas as pd
from typing import Dict, List, Tuple
import json
from dataclasses import dataclass
import base64
from .classifier import table_process
from .img_interpretation import image_to_text
from .utils import store_index
from. file_handle import upload_file_to_cloudinary

@dataclass
class PDFElement:
    type: str
    content: any
    bbox: List[float]
    page_num: int
    metadata: Dict = None

def check_overlap(bbox1: List[float], bbox2: List[float], threshold: float = 0.5) -> bool:
    x01, y01, x11, y11 = bbox1
    x02, y02, x12, y12 = bbox2
    x_left = max(x01, x02)
    y_top = max(y01, y02)
    x_right = min(x11, x12)
    y_bottom = min(y11, y12)
    if x_right < x_left or y_bottom < y_top:
        return False
    intersection_area = (x_right - x_left) * (y_bottom - y_top)
    bbox1_area = (x11 - x01) * (y11 - y01)
    bbox2_area = (x12 - x02) * (y12 - y02)
    overlap_ratio1 = intersection_area / bbox1_area
    overlap_ratio2 = intersection_area / bbox2_area
    return overlap_ratio1 > threshold or overlap_ratio2 > threshold

def extract_pdf_content(pdf_path: str) -> Dict[str, List[PDFElement]]:
    result = {
        'paragraphs': [],
        'tables': [],
        'images': []
    }
    doc = fitz.open(pdf_path)
    tables = extract_tables(pdf_path, doc.page_count)
    for table in tables:
       table.content = json.dumps(json.loads(table_process(table.content))["table_json"])
    result['tables'].extend(tables)
    for page_num in range(doc.page_count):
        page = doc[page_num]
        images = extract_images(page, page_num)
        page_tables = [table for table in tables if table.page_num == page_num]
        filtered_images = filter_overlapping_elements(images, page_tables)
        result['images'].extend(filtered_images)
        paragraphs = extract_paragraphs(page, page_num)
        filtered_paragraphs = filter_overlapping_elements(paragraphs, page_tables)
        result['paragraphs'].extend(filtered_paragraphs)
    doc.close()
    return result

def filter_overlapping_elements(elements: List[PDFElement], tables: List[PDFElement], overlap_threshold: float = 0.5) -> List[PDFElement]:
    filtered_elements = []
    for elem in elements:
        overlaps_with_table = False
        for table in tables:
            if check_overlap(elem.bbox, table.bbox, overlap_threshold):
                overlaps_with_table = True
                break
        if not overlaps_with_table:
            filtered_elements.append(elem)
    return filtered_elements

def extract_tables(pdf_path: str, total_pages: int) -> List[PDFElement]:
    tables = []
    for page_num in range(total_pages):
        try:
            tables_json = tabula.read_pdf(
                pdf_path,
                pages=page_num + 1,
                multiple_tables=True,
                guess=True,
                pandas_options={'header': None},
                output_format='json'
            )
            for table_info in tables_json:
                df = pd.DataFrame(
                    [[cell.get('text', '') for cell in row] 
                     for row in table_info.get('data', [])]
                )
                df = df.dropna(how='all').dropna(axis=1, how='all')
                df = df.fillna('')
                x0 = table_info.get('left', 0)
                y0 = table_info.get('top', 0)
                x1 = x0 + table_info.get('width', 0)
                y1 = y0 + table_info.get('height', 0)
                padding = 5
                tables.append(PDFElement(
                    type='table',
                    content=df,
                    bbox=[x0 - padding, y0 - padding, x1 + padding, y1 + padding],
                    page_num=page_num,
                    metadata={
                        'num_rows': len(df),
                        'num_cols': len(df.columns)
                    }
                ))
        except Exception as e:
            print(f"Failed to extract tables from page {page_num + 1}: {str(e)}")
    return tables

def extract_images(page: fitz.Page, page_num: int) -> List[PDFElement]:
    images = []
    image_list = page.get_images(full=True)
    for img_idx, img_info in enumerate(image_list):
        try:
            xref = img_info[0]
            base_image = page.parent.extract_image(xref)
            image_bytes = base_image["image"]
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            desc = image_to_text(base64_image)
            rects = page.get_image_rects(xref)
            if rects:
                for rect in rects:
                    padding = 2
                    images.append(PDFElement(
                        type='image',
                        content=desc,
                        bbox=[rect.x0, rect.y0, rect.x1, rect.y1],
                        page_num=page_num,
                        metadata={
                            'format': base_image["ext"],
                            'width': base_image["width"],
                            'height': base_image["height"]
                        }
                    ))
        except Exception as e:
            print(f"Failed to extract image {img_idx} from page {page_num + 1}: {str(e)}")
    return images

def extract_paragraphs(page: fitz.Page, page_num: int) -> List[PDFElement]:
    paragraphs = []
    blocks = page.get_text("blocks")
    text_blocks = [b for b in blocks if b[6] == 0]
    for block in text_blocks:
        if not block[4].strip():
            continue
        para = PDFElement(
            type='text',
            content=block[4],
            bbox=[block[0], block[1], block[2], block[3]],
            page_num=page_num,
            metadata={
                'word_count': len(block[4].split()),
                'font_size': block[5]
            }
        )
        paragraphs.append(para)
    return paragraphs

def find_text_instances(pdf_path: str, search_text: str) -> List[PDFElement]:
    text_instances = []
    doc = fitz.open(pdf_path)
    for page_num in range(doc.page_count):
        page = doc[page_num]
        instances = page.search_for(search_text)
        for bbox in instances:
            text_instances.append(PDFElement(
                type='text',
                content=search_text,
                bbox=bbox,
                page_num=page_num
            ))
    doc.close()
    return text_instances

def main(pdf_path=""):
    file_url=upload_file_to_cloudinary(pdf_path)
    content = extract_pdf_content(pdf_path)
    print(f"Found {len(content['paragraphs'])} paragraphs (after filtering table overlaps)")
    print(f"Found {len(content['tables'])} tables")
    print(f"Found {len(content['images'])} images (after filtering table overlaps)")
    all_content = content['paragraphs'] + content['tables'] + content['images']
    for data in all_content:
        data.metadata["file_url"]=file_url
    store_index(all_content)
    return True
