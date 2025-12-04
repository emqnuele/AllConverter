import os
import subprocess
from .base_converter import BaseConverter

class AudioConverter(BaseConverter):
    """Convertitore per file audio"""
    
    def __init__(self, source_format=None, target_format=None):
        super().__init__(source_format, target_format)
        self.bitrate = "192k"  # Bitrate di default
    
    def get_supported_input_formats(self):
        return [
            'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 
            'aiff', 'alac', 'opus', 'ac3', 'amr'
        ]
        
    def get_supported_output_formats(self):
        return [
            'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus'
        ]
    
    def convert(self, input_path, output_path, **kwargs):
        """
        Converte un file audio dal formato sorgente al formato target
        
        Args:
            input_path: percorso del file da convertire
            output_path: percorso dove salvare il file convertito
            **kwargs: parametri aggiuntivi per la conversione:
                - bitrate: bitrate dell'audio (es. "192k")
                - sample_rate: frequenza di campionamento (es. 44100)
                - channels: numero di canali (1=mono, 2=stereo)
                - volume_change: modificatore di volume in dB (es. +3, -5)
                - normalize: normalizzazione audio (True/False)
                - trim: tupla (start_ms, end_ms) per tagliare l'audio
        """
        try:
            # Estrai parametri dai kwargs
            bitrate = kwargs.get('bitrate', self.bitrate)
            sample_rate = kwargs.get('sample_rate')
            channels = kwargs.get('channels')
            volume_change = kwargs.get('volume_change')
            normalize = kwargs.get('normalize', False)
            trim = kwargs.get('trim')
            
            # Costruisci comando FFmpeg
            cmd = ['ffmpeg', '-y', '-i', input_path]
            
            # Aggiungi opzioni
            if bitrate:
                cmd.extend(['-b:a', bitrate])
            if sample_rate:
                cmd.extend(['-ar', str(sample_rate)])
            if channels:
                cmd.extend(['-ac', str(channels)])
            
            # Filtri audio complessi
            af_filters = []
            
            if volume_change:
                # volume=3dB
                af_filters.append(f'volume={volume_change}dB')
            
            if normalize:
                # Normalizza l'audio con filtro loudnorm
                af_filters.append('loudnorm')
            
            if af_filters:
                cmd.extend(['-af', ','.join(af_filters)])
            
            # Trim (taglio)
            if trim and len(trim) == 2:
                # -ss start -to end (converti ms in secondi)
                cmd.extend(['-ss', str(trim[0]/1000), '-to', str(trim[1]/1000)])
            
            # Output file
            cmd.append(output_path)
            
            # Esegui FFmpeg
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"FFmpeg error: {result.stderr}")
                return False
                
            return True
                
        except Exception as e:
            print(f"Errore durante la conversione audio: {e}")
            return False
    
    def get_audio_info(self, input_path):
        """
        Ottiene informazioni su un file audio
        
        Args:
            input_path: percorso del file audio
            
        Returns:
            dict: dizionario con le informazioni sull'audio
        """
        try:
            # Usa ffprobe per ottenere informazioni dettagliate
            cmd = [
                'ffprobe', '-v', 'quiet', '-print_format', 'json',
                '-show_format', '-show_streams', input_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                import json
                data = json.loads(result.stdout)
                
                # Trova lo stream audio principale
                audio_stream = None
                for stream in data.get('streams', []):
                    if stream['codec_type'] == 'audio':
                        audio_stream = stream
                        break
                
                if not audio_stream:
                    raise ValueError("No audio stream found")
                
                # Estrai informazioni rilevanti
                info = {
                    'format': data.get('format', {}).get('format_name', ''),
                    'duration': float(data.get('format', {}).get('duration', 0)),
                    'size': int(data.get('format', {}).get('size', 0)),
                    'bitrate': int(data.get('format', {}).get('bit_rate', 0)),
                    'codec': audio_stream.get('codec_name', ''),
                    'sample_rate': int(audio_stream.get('sample_rate', 0)),
                    'channels': int(audio_stream.get('channels', 0)),
                }
                
                return info
            else:
                print(f"ffprobe error: {result.stderr}")
                return {}
            
        except Exception as e:
            print(f"Errore nel recupero delle informazioni audio: {e}")
            return {}