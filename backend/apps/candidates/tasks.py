import io
import logging

import docx
import pdfplumber
from celery import shared_task

from apps.core.storage import download_file

from .models import Resume

logger = logging.getLogger(__name__)

@shared_task
def extract_resume_text(resume_id: str):
    try:
        resume = Resume.objects.get(id=resume_id)
        resume.status = Resume.Status.PROCESSING
        resume.save(update_fields=["status"])

        # Fetch the file from Supabase to memory
        res = download_file("resumes", resume.file_url)
        
        file_bytes = io.BytesIO(res)
        extracted_text = ""

        if resume.mime_type == "application/pdf":
            with pdfplumber.open(file_bytes) as pdf:
                pages = [page.extract_text() for page in pdf.pages if page.extract_text()]
                extracted_text = "\n".join(pages)
                
        elif resume.mime_type in [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
        ]:
            doc = docx.Document(file_bytes)
            paragraphs = [p.text for p in doc.paragraphs if p.text]
            extracted_text = "\n".join(paragraphs)
            
        else:
            logger.warning(f"Unsupported mime type for resume {resume_id}: {resume.mime_type}")

        resume.raw_text = extracted_text
        resume.status = Resume.Status.COMPLETED
        resume.save(update_fields=["raw_text", "status", "updated_at"])
        
    except Exception as e:
        logger.error(f"Failed to extract text for resume {resume_id}: {e}")
        try:
            resume = Resume.objects.get(id=resume_id)
            resume.status = Resume.Status.ERROR
            resume.save(update_fields=["status", "updated_at"])
        except Resume.DoesNotExist:
            pass
