import os
import re
from typing import Dict, Optional, Union
import logging
from pathlib import Path
import tempfile
import io

# Configure logging
logger = logging.getLogger(__name__)

class BloodReportProcessor:
    def __init__(self):
        # Common patterns for blood test values
        self.patterns = {
            'chol': r'(?:total\s+)?cholesterol[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL|mg/100ml)',
            'fbs': r'(?:fasting\s+)?(?:blood\s+)?(?:glucose|sugar)[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL|mg/100ml)',
            'hdl': r'(?:HDL|hdl)[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL|mg/100ml)',
            'ldl': r'(?:LDL|ldl)[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL|mg/100ml)',
            'triglycerides': r'(?:triglycerides|TG)[:\s]+(\d+(?:\.\d+)?)\s*(?:mg/dl|mg/dL|mg/100ml)',
        }
        
        # Try to import OCR-related libraries, but don't fail if not available
        self.ocr_available = False
        try:
            import pytesseract
            from pdf2image import convert_from_path
            from PIL import Image
            self.pytesseract = pytesseract
            self.convert_from_path = convert_from_path
            self.Image = Image
            self.ocr_available = True
            logger.info("OCR capabilities are available")
        except ImportError as e:
            logger.warning(f"OCR libraries not available: {str(e)}")
            logger.warning("Blood report processing will be limited to text extraction")

    def process_file(self, file_content: bytes, file_type: str) -> Dict[str, Union[float, str]]:
        """
        Process a blood report file and extract relevant values
        """
        try:
            logger.info(f"Processing file of type: {file_type}")
            
            # Validate file content
            if not file_content or len(file_content) == 0:
                raise ValueError("Empty file content provided")
            
            # Convert file to text
            if file_type == 'application/pdf':
                if not self.ocr_available:
                    return {"error": "PDF processing requires OCR capabilities. Please install Tesseract OCR and Poppler."}
                text = self._extract_text_from_pdf(file_content)
            elif file_type in ['image/jpeg', 'image/png']:
                if not self.ocr_available:
                    return {"error": "Image processing requires OCR capabilities. Please install Tesseract OCR."}
                text = self._extract_text_from_image(file_content)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")

            if not text or len(text.strip()) == 0:
                raise ValueError("No text could be extracted from the file")

            # Extract values using patterns
            extracted_values = self._extract_values(text)
            logger.info(f"Extracted values: {extracted_values}")
            
            # Convert values to appropriate format
            processed_values = self._process_extracted_values(extracted_values)
            logger.info(f"Processed values: {processed_values}")
            
            return processed_values

        except Exception as e:
            logger.error(f"Error processing blood report: {str(e)}", exc_info=True)
            return {"error": str(e)}

    def _extract_text_from_pdf(self, pdf_content: bytes) -> str:
        """Extract text from PDF file"""
        if not self.ocr_available:
            raise RuntimeError("OCR capabilities not available")
            
        try:
            # Create a temporary file to store the PDF
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                temp_pdf.write(pdf_content)
                temp_pdf_path = temp_pdf.name
            
            try:
                # Convert PDF to images
                images = self.convert_from_path(temp_pdf_path)
                text = ""
                
                # Extract text from each page
                for i, image in enumerate(images):
                    logger.info(f"Processing page {i+1} of PDF")
                    page_text = self.pytesseract.image_to_string(image)
                    text += page_text
                
                return text
            finally:
                # Clean up temporary file
                try:
                    os.unlink(temp_pdf_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temporary PDF file: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {str(e)}", exc_info=True)
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    def _extract_text_from_image(self, image_content: bytes) -> str:
        """Extract text from image file"""
        if not self.ocr_available:
            raise RuntimeError("OCR capabilities not available")
            
        try:
            image = self.Image.open(io.BytesIO(image_content))
            text = self.pytesseract.image_to_string(image)
            return text
        except Exception as e:
            logger.error(f"Error extracting text from image: {str(e)}", exc_info=True)
            raise Exception(f"Error extracting text from image: {str(e)}")

    def _extract_values(self, text: str) -> Dict[str, Optional[str]]:
        """Extract values using regex patterns"""
        extracted = {}
        for key, pattern in self.patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                extracted[key] = match.group(1)
                logger.debug(f"Found {key}: {match.group(1)}")
            else:
                extracted[key] = None
                logger.debug(f"No match found for {key}")
        return extracted

    def _process_extracted_values(self, extracted: Dict[str, Optional[str]]) -> Dict[str, Union[float, str]]:
        """Process and validate extracted values"""
        processed = {}
        
        # Process cholesterol
        if extracted['chol']:
            try:
                processed['chol'] = float(extracted['chol'])
            except ValueError:
                logger.warning(f"Invalid cholesterol value: {extracted['chol']}")
                processed['chol'] = None
        else:
            processed['chol'] = None

        # Process fasting blood sugar
        if extracted['fbs']:
            try:
                fbs_value = float(extracted['fbs'])
                processed['fbs'] = '1' if fbs_value > 120 else '0'
            except ValueError:
                logger.warning(f"Invalid FBS value: {extracted['fbs']}")
                processed['fbs'] = '0'
        else:
            processed['fbs'] = '0'

        # Add additional metrics if available
        for key in ['hdl', 'ldl', 'triglycerides']:
            if extracted[key]:
                try:
                    processed[key] = float(extracted[key])
                except ValueError:
                    logger.warning(f"Invalid {key} value: {extracted[key]}")
                    processed[key] = None
            else:
                processed[key] = None

        return processed

# Create a singleton instance
blood_report_processor = BloodReportProcessor() 