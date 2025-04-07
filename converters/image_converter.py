import os
import io
from PIL import Image, ImageOps, ImageFilter
from pillow_heif import register_heif_opener
from .base_converter import BaseConverter

# Registra l'opener per i file HEIF
register_heif_opener()

class ImageConverter(BaseConverter):
    """Convertitore per file immagine"""
    
    def __init__(self, source_format=None, target_format=None):
        super().__init__(source_format, target_format)
        self.quality = 95
        
    def get_supported_input_formats(self):
        return [
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp',
            'heic', 'heif', 'ico', 'ppm', 'pgm', 'pbm', 'pnm', 'avif'
        ]
        
    def get_supported_output_formats(self):
        return [
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'ico', 'pdf',
            'ppm', 'pgm', 'pbm', 'pnm'
        ]
    
    def convert(self, input_path, output_path, **kwargs):
        """
        Converte un'immagine dal formato sorgente al formato target
        
        Args:
            input_path: percorso del file da convertire
            output_path: percorso dove salvare il file convertito
            **kwargs: parametri aggiuntivi per la conversione:
                - quality: qualità dell'immagine (per formati con compressione)
                - resize: (width, height) o percentuale di ridimensionamento
                - rotate: angolo di rotazione in gradi
                - flip: 'horizontal', 'vertical', o None
                - filter: filtro da applicare ('blur', 'sharpen', ecc.)
                - dpi: risoluzione in DPI
        """
        try:
            # Estrai parametri dai kwargs
            quality = kwargs.get('quality', self.quality)
            resize = kwargs.get('resize', None)
            rotate = kwargs.get('rotate', None)
            flip = kwargs.get('flip', None)
            filter_name = kwargs.get('filter', None)
            dpi = kwargs.get('dpi', None)
            
            # Carica l'immagine
            img = Image.open(input_path)
            
            # Gestione della memoria per file grandi
            max_pixels = 89478485  # Circa 8K x 8K
            if img.width * img.height > max_pixels:
                print(f"Immagine molto grande ({img.width}x{img.height}), ottimizzando il processo...")
                # Riduci temporaneamente per operazioni
                scale_factor = (max_pixels / (img.width * img.height)) ** 0.5
                temp_size = (int(img.width * scale_factor), int(img.height * scale_factor))
                img = img.resize(temp_size, Image.LANCZOS)
            
            # Applica le trasformazioni
            if resize:
                if isinstance(resize, float) and 0 < resize <= 1:
                    # Resize by percentage
                    new_width = int(img.width * resize)
                    new_height = int(img.height * resize)
                    img = img.resize((new_width, new_height), Image.LANCZOS)
                elif isinstance(resize, tuple) and len(resize) == 2:
                    # Resize to specific dimensions
                    img = img.resize(resize, Image.LANCZOS)
            
            if rotate is not None:
                img = img.rotate(rotate, expand=True)
            
            if flip:
                if flip == 'horizontal':
                    img = ImageOps.mirror(img)
                elif flip == 'vertical':
                    img = ImageOps.flip(img)
            
            if filter_name:
                if filter_name == 'blur':
                    img = img.filter(ImageFilter.BLUR)
                elif filter_name == 'sharpen':
                    img = img.filter(ImageFilter.SHARPEN)
                elif filter_name == 'contour':
                    img = img.filter(ImageFilter.CONTOUR)
                elif filter_name == 'detail':
                    img = img.filter(ImageFilter.DETAIL)
                elif filter_name == 'edge_enhance':
                    img = img.filter(ImageFilter.EDGE_ENHANCE)
                elif filter_name == 'emboss':
                    img = img.filter(ImageFilter.EMBOSS)
                elif filter_name == 'grayscale':
                    img = ImageOps.grayscale(img)
            
            # Converti in RGB per formati che non supportano alpha o altri modelli di colore
            if self.target_format.lower() in ['jpg', 'jpeg']:
                if img.mode in ['RGBA', 'LA', 'P']:
                    bg = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    bg.paste(img, mask=img.split()[3] if img.mode == 'RGBA' else img.split()[1])
                    img = bg
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
            # Estrai formato target dall'output_path
            format_name = os.path.splitext(output_path)[1][1:].upper()
            # Gestisci caso speciale JPEG
            if format_name.lower() == 'jpg':
                format_name = 'JPEG'
            
            # Prepara le opzioni di salvataggio
            save_options = {}
            if format_name.upper() in ['JPEG', 'WEBP']:
                save_options['quality'] = quality
            elif format_name.upper() == 'PNG':
                save_options['compress_level'] = int(9 - (quality / 100.0 * 9))
            elif format_name.upper() == 'TIFF':
                save_options['compression'] = 'tiff_deflate'
            
            # Aggiungi DPI se specificato
            if dpi is not None:
                save_options['dpi'] = (dpi, dpi)
            
            # Salva il risultato
            img.save(output_path, format=format_name, **save_options)
            return True
            
        except Exception as e:
            print(f"Errore durante la conversione dell'immagine: {e}")
            return False
    
    def get_image_info(self, input_path):
        """
        Ottiene informazioni su un'immagine
        
        Args:
            input_path: percorso dell'immagine
            
        Returns:
            dict: dizionario con le informazioni sull'immagine
        """
        try:
            img = Image.open(input_path)
            info = {
                'width': img.width,
                'height': img.height,
                'format': img.format,
                'mode': img.mode,
                'dpi': img.info.get('dpi', (72, 72))
            }
            
            # Aggiungi altre informazioni basate sui metadati
            for key in img.info:
                if key not in ['dpi'] and isinstance(img.info[key], (str, int, float)):
                    info[key] = img.info[key]
                    
            return info
        except Exception as e:
            print(f"Errore nel recupero delle informazioni dell'immagine: {e}")
            return {}