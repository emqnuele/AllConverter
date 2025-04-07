from .image_converter import ImageConverter
from .audio_converter import AudioConverter
from .video_converter import VideoConverter
from .document_converter import DocumentConverter

class ConverterFactory:
    """Factory per creare i convertitori appropriati basati sul tipo di file"""
    
    @staticmethod
    def get_converter(file_mime_type, source_format=None, target_format=None):
        """
        Restituisce un convertitore appropriato basato sul MIME type
        
        Args:
            file_mime_type: MIME type del file
            source_format: formato sorgente (opzionale)
            target_format: formato target (opzionale)
            
        Returns:
            BaseConverter: un'istanza del convertitore appropriato
        """
        if file_mime_type.startswith('image/'):
            return ImageConverter(source_format, target_format)
        elif file_mime_type.startswith('audio/'):
            return AudioConverter(source_format, target_format)
        elif file_mime_type.startswith('video/'):
            return VideoConverter(source_format, target_format)
        elif file_mime_type.startswith('application/pdf') or \
             file_mime_type.startswith('application/msword') or \
             file_mime_type.startswith('application/vnd.openxmlformats-officedocument') or \
             file_mime_type.startswith('text/') or \
             file_mime_type.startswith('application/rtf') or \
             file_mime_type.startswith('application/epub+zip') or \
             file_mime_type.startswith('application/vnd.oasis.opendocument'):
            return DocumentConverter(source_format, target_format)
        else:
            return None