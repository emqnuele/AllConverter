import os
import subprocess
from .base_converter import BaseConverter

class VideoConverter(BaseConverter):
    """Convertitore per file video"""
    
    def __init__(self, source_format=None, target_format=None):
        super().__init__(source_format, target_format)
        self.video_bitrate = "1500k"  # Bitrate video di default
        self.audio_bitrate = "192k"   # Bitrate audio di default
        self.resolution = None         # Risoluzione video default (mantenere originale)
    
    def get_supported_input_formats(self):
        return [
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v',
            'mpeg', 'mpg', '3gp', 'vob', 'ogv', 'mts', 'm2ts'
        ]
        
    def get_supported_output_formats(self):
        return [
            'mp4', 'avi', 'mov', 'mkv', 'webm', 'gif', 'mp3', 'ogg'
        ]
    
    def convert(self, input_path, output_path, **kwargs):
        """
        Converte un file video dal formato sorgente al formato target
        
        Args:
            input_path: percorso del file da convertire
            output_path: percorso dove salvare il file convertito
            **kwargs: parametri aggiuntivi per la conversione
        """
        try:
            # Estrai parametri dai kwargs
            video_bitrate = kwargs.get('video_bitrate', self.video_bitrate)
            audio_bitrate = kwargs.get('audio_bitrate', self.audio_bitrate)
            resolution = kwargs.get('resolution', self.resolution)
            fps = kwargs.get('fps')
            no_audio = kwargs.get('no_audio', False)
            trim = kwargs.get('trim')
            rotate = kwargs.get('rotate')
            codec = kwargs.get('codec')
            preset = kwargs.get('preset', "medium")
            extract_audio = kwargs.get('extract_audio', False)
            
            # Formato di output
            output_format = os.path.splitext(output_path)[1][1:].lower()
            
            # Base del comando FFmpeg
            cmd = ['ffmpeg', '-y', '-i', input_path]
            
            # Se stiamo estraendo solo l'audio
            if extract_audio:
                cmd.extend(['-vn', '-acodec', 'copy' if output_format in ['m4a', 'aac'] else 'libmp3lame'])
                if audio_bitrate:
                    cmd.extend(['-b:a', audio_bitrate])
                cmd.append(output_path)
                result = subprocess.run(cmd, capture_output=True, text=True)
                return result.returncode == 0
            
            # Per conversioni GIF, utilizziamo filtri specifici di FFmpeg
            if output_format == 'gif':
                filter_complex = []
                
                # Scaliamo se richiesto
                if resolution:
                    filter_complex.append(f"scale={resolution.replace('x', ':')}")
                else:
                    filter_complex.append("scale=320:-1")  # Default scale per GIF
                
                # Impostiamo FPS per GIF (più basso è meglio per dimensioni file)
                if fps:
                    filter_complex.append(f"fps={fps}")
                else:
                    filter_complex.append("fps=10")  # Default FPS per GIF
                
                # Ottimizziamo palette per una migliore qualità
                palette_path = output_path + ".palette.png"
                palette_cmd = ['ffmpeg', '-y', '-i', input_path]
                
                # Aggiungiamo trim se richiesto
                if trim and len(trim) == 2:
                    palette_cmd.extend(['-ss', str(trim[0]), '-to', str(trim[1])])
                
                palette_filters = ','.join(filter_complex) + ",palettegen"
                palette_cmd.extend(['-vf', palette_filters, palette_path])
                
                # Generiamo la palette
                subprocess.run(palette_cmd, capture_output=True)
                
                # Ora creiamo il GIF con la palette
                gif_cmd = ['ffmpeg', '-y', '-i', input_path]
                
                # Aggiungiamo trim se richiesto
                if trim and len(trim) == 2:
                    gif_cmd.extend(['-ss', str(trim[0]), '-to', str(trim[1])])
                
                gif_cmd.extend(['-i', palette_path, '-lavfi', 
                               f"{','.join(filter_complex)}[x];[x][1:v]paletteuse", output_path])
                
                result = subprocess.run(gif_cmd, capture_output=True, text=True)
                
                # Puliamo la palette temporanea
                if os.path.exists(palette_path):
                    os.remove(palette_path)
                
                return result.returncode == 0
            
            # Per le altre conversioni usiamo FFmpeg standard
            # Parametri di codifica video
            if not no_audio and output_format not in ['mp3', 'ogg', 'wav', 'flac']:
                # Aggiungi opzioni video
                if resolution:
                    cmd.extend(['-vf', f'scale={resolution.replace("x",":")}'])
                
                if rotate:
                    # Converti gradi in impostazione di rotazione FFmpeg
                    rotation_values = {
                        90: 'transpose=1',
                        180: 'transpose=1,transpose=1',
                        270: 'transpose=2'
                    }
                    if rotate in rotation_values:
                        vf_option = rotation_values[rotate]
                        # Se abbiamo già impostato scale, aggiungiamo alla catena di filtri
                        if resolution:
                            cmd[-1] = cmd[-1] + ',' + vf_option
                        else:
                            cmd.extend(['-vf', vf_option])
                
                if fps:
                    cmd.extend(['-r', str(fps)])
                
                if video_bitrate:
                    cmd.extend(['-b:v', video_bitrate])
                
                if codec:
                    cmd.extend(['-c:v', codec])
                else:
                    # Scegli codec di default basato sul formato
                    if output_format == 'mp4':
                        cmd.extend(['-c:v', 'libx264'])
                    elif output_format == 'webm':
                        cmd.extend(['-c:v', 'libvpx-vp9'])
                
                # Preset di qualità per h264, h265
                if codec in ['libx264', 'libx265'] or output_format == 'mp4':
                    cmd.extend(['-preset', preset])
            elif output_format in ['mp3', 'ogg', 'wav', 'flac']:
                # Solo estrazione audio
                cmd.extend(['-vn'])
            
            # Parametri audio
            if no_audio:
                cmd.extend(['-an'])
            else:
                if audio_bitrate:
                    cmd.extend(['-b:a', audio_bitrate])
                
                # Codec audio specifici per formato
                if output_format == 'mp3':
                    cmd.extend(['-c:a', 'libmp3lame'])
                elif output_format == 'ogg':
                    cmd.extend(['-c:a', 'libvorbis'])
            
            # Trim video - applica il trim all'inizio della pipeline per efficienza
            if trim and len(trim) == 2:
                cmd = ['ffmpeg', '-y', '-ss', str(trim[0]), '-to', str(trim[1]), '-i', input_path] + cmd[2:]
            
            # Output file
            cmd.append(output_path)
            
            # Esegui FFmpeg
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
                
        except Exception as e:
            print(f"Errore durante la conversione video: {e}")
            return False
    
    def get_video_info(self, input_path):
        """
        Ottiene informazioni su un file video
        
        Args:
            input_path: percorso del file video
            
        Returns:
            dict: dizionario con le informazioni sul video
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
                
                # Trova gli stream video e audio
                video_stream = None
                audio_stream = None
                
                for stream in data.get('streams', []):
                    if stream['codec_type'] == 'video' and not video_stream:
                        video_stream = stream
                    elif stream['codec_type'] == 'audio' and not audio_stream:
                        audio_stream = stream
                
                if not video_stream:
                    raise ValueError("No video stream found")
                
                # Estrai informazioni rilevanti
                info = {
                    'format': data.get('format', {}).get('format_name', ''),
                    'duration': float(data.get('format', {}).get('duration', 0)),
                    'size': int(data.get('format', {}).get('size', 0)),
                    'bitrate': int(data.get('format', {}).get('bit_rate', 0)),
                    'width': int(video_stream.get('width', 0)),
                    'height': int(video_stream.get('height', 0)),
                    'fps': eval(video_stream.get('r_frame_rate', '0/1')),
                    'video_codec': video_stream.get('codec_name', ''),
                }
                
                # Aggiungi info audio se presente
                if audio_stream:
                    info.update({
                        'audio_codec': audio_stream.get('codec_name', ''),
                        'audio_channels': int(audio_stream.get('channels', 0)),
                        'audio_sample_rate': int(audio_stream.get('sample_rate', 0)),
                    })
                
                return info
            else:
                print(f"ffprobe error: {result.stderr}")
                return {}
            
        except Exception as e:
            print(f"Errore nel recupero delle informazioni video: {e}")
            return {}