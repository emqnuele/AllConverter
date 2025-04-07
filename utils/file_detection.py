import os
import mimetypes

class FileTypeDetector:
    """Classe per il rilevamento del tipo di file utilizzando MIME types e estensioni"""
    
    @staticmethod
    def get_mime_type(file_path):
        """Rileva il MIME type di un file"""
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type is None:
            # Fallback to extension-based detection
            ext = os.path.splitext(file_path)[1].lower()
            if ext in ['.jpg', '.jpeg']:
                return 'image/jpeg'
            elif ext in ['.png']:
                return 'image/png'
            # Add more mappings as needed
            return 'application/octet-stream'  # Default fallback
        return mime_type
    
    @staticmethod
    def get_category(mime_type):
        """Determina la categoria del file in base al MIME type"""
        if mime_type:
            if mime_type.startswith('image/'):
                return 'image'
            elif mime_type.startswith('audio/'):
                return 'audio'
            elif mime_type.startswith('video/'):
                return 'video'
            elif mime_type.startswith(('application/pdf', 'application/msword', 'application/vnd.ms-', 'text/')):
                return 'document'
        return 'unknown'
    
    @staticmethod
    def categorize_by_extension(filename):
        """Determine the file category based on its extension"""
        if not filename:
            return 'unknown'
            
        ext = os.path.splitext(filename)[1].lower().replace('.', '')
        
        # Image formats
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'tif', 'svg', 'heic', 'heif', 'avif', 'raw']:
            return 'image'
            
        # Audio formats
        if ext in ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'opus', 'aiff']:
            return 'audio'
            
        # Video formats
        if ext in ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv', 'm4v', 'mpeg', 'mpg', '3gp']:
            return 'video'
            
        # Document formats
        if ext in ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp', 'csv', 'html', 'md']:
            return 'document'
            
        # Archive formats
        if ext in ['zip', 'rar', '7z', 'tar', 'gz', 'bz2']:
            return 'archive'
            
        return 'unknown'