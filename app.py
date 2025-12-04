import os
import uuid
import shutil
import json
import mimetypes
import datetime
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, render_template, request, redirect, url_for, jsonify, send_from_directory
from tqdm import tqdm
import static_ffmpeg  # Ensure ffmpeg is available

# Importa i moduli custom
from utils.file_detection import FileTypeDetector
from converters.converter_factory import ConverterFactory

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['CONVERTED_FOLDER'] = 'converted'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max upload

# Assicurati che le directories esistano
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['CONVERTED_FOLDER'], exist_ok=True)

# Inizializza mimetypes
mimetypes.init()

def process_file(file_data):
    input_path, output_path, filename, target_format, options = file_data
    
    # Rileva il tipo MIME
    mime_type = FileTypeDetector.get_mime_type(input_path)
    category = FileTypeDetector.get_category(mime_type)
    
    # Ottieni il formato sorgente e target
    source_format = os.path.splitext(input_path)[1][1:].lower()
    
    # Ottieni il convertitore appropriato
    converter = ConverterFactory.get_converter(mime_type, source_format, target_format)
    
    success = False
    if converter:
        # Esegui la conversione con le opzioni specificate
        success = converter.convert(input_path, output_path, **options)
    
    return {
        "filename": filename,
        "success": success,
        "mime_type": mime_type,
        "category": category
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/formats', methods=['GET'])
def get_formats():
    """Endpoint per ottenere tutti i formati supportati"""
    image_converter = ConverterFactory.get_converter("image/jpeg")
    audio_converter = ConverterFactory.get_converter("audio/mpeg")
    video_converter = ConverterFactory.get_converter("video/mp4")
    document_converter = ConverterFactory.get_converter("application/pdf")  # Add document converter
    
    formats = {
        "image": {
            "input": image_converter.get_supported_input_formats() if image_converter else [],
            "output": image_converter.get_supported_output_formats() if image_converter else []
        },
        "audio": {
            "input": audio_converter.get_supported_input_formats() if audio_converter else [],
            "output": audio_converter.get_supported_output_formats() if audio_converter else []
        },
        "video": {
            "input": video_converter.get_supported_input_formats() if video_converter else [],
            "output": video_converter.get_supported_output_formats() if video_converter else []
        },
        "document": {
            "input": document_converter.get_supported_input_formats() if document_converter else [],
            "output": document_converter.get_supported_output_formats() if document_converter else []
        }
    }
    
    return jsonify(formats)

@app.route('/api/file-info', methods=['POST'])
def get_file_info():
    """Endpoint per ottenere informazioni su un file caricato"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Salva il file temporaneamente
    temp_filename = f"temp_{uuid.uuid4()}"
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], temp_filename)
    file.save(temp_path)
    
    # Rileva il tipo MIME
    mime_type = FileTypeDetector.get_mime_type(temp_path)
    category = FileTypeDetector.get_category(mime_type)
    
    # Ottieni informazioni specifiche per categoria
    info = {"mime_type": mime_type, "category": category}
    
    # Ottieni il convertitore appropriato
    converter = ConverterFactory.get_converter(mime_type)
    
    if category == "image" and converter:
        image_info = converter.get_image_info(temp_path)
        info.update(image_info)
    elif category == "audio" and converter:
        audio_info = converter.get_audio_info(temp_path)
        info.update(audio_info)
    elif category == "video" and converter:
        video_info = converter.get_video_info(temp_path)
        info.update(video_info)
    elif category == "document" and converter:
        document_info = converter.get_document_info(temp_path)
        info.update(document_info)
    
    # Pulisci il file temporaneo
    os.remove(temp_path)
    
    return jsonify(info)

@app.route('/upload', methods=['POST'])
def upload_files():
    if 'files[]' not in request.files:
        return jsonify({"error": "No files part"}), 400
    
    files = request.files.getlist('files[]')
    if not files or files[0].filename == '':
        return jsonify({"error": "No files selected"}), 400
    
    # Formato di destinazione
    target_format = request.form.get('target_format', 'jpg')
    
    # Opzioni di conversione
    options = {}
    
    # Leggi le opzioni per immagini
    if 'image_options' in request.form:
        image_options = json.loads(request.form.get('image_options'))
        
        # Qualità dell'immagine
        if 'quality' in image_options:
            options['quality'] = int(image_options['quality'])
        
        # Ridimensionamento
        if 'resize' in image_options and image_options['resize'].get('enabled'):
            resize_type = image_options['resize'].get('type')
            if resize_type == 'percentage':
                percentage = float(image_options['resize'].get('percentage', 100)) / 100
                options['resize'] = percentage
            elif resize_type == 'dimensions':
                width = int(image_options['resize'].get('width', 0))
                height = int(image_options['resize'].get('height', 0))
                if width > 0 and height > 0:
                    options['resize'] = (width, height)
        
        # Rotazione
        if 'rotate' in image_options and image_options['rotate'].get('enabled'):
            angle = float(image_options['rotate'].get('angle', 0))
            options['rotate'] = angle
        
        # Flip/Specchia
        if 'flip' in image_options and image_options['flip'].get('enabled'):
            flip_type = image_options['flip'].get('type')
            if flip_type in ['horizontal', 'vertical']:
                options['flip'] = flip_type
        
        # Filtri
        if 'filter' in image_options and image_options['filter'].get('enabled'):
            filter_type = image_options['filter'].get('type')
            if filter_type:
                options['filter'] = filter_type
    
    # Opzioni audio
    if 'audio_options' in request.form:
        audio_options = json.loads(request.form.get('audio_options'))
        
        # Bitrate
        if 'bitrate' in audio_options:
            options['bitrate'] = audio_options['bitrate']
        
        # Sample rate
        if 'sample_rate' in audio_options and audio_options['sample_rate'].get('enabled'):
            options['sample_rate'] = int(audio_options['sample_rate'].get('value', 44100))
        
        # Canali audio
        if 'channels' in audio_options and audio_options['channels'].get('enabled'):
            options['channels'] = int(audio_options['channels'].get('value', 2))
        
        # Volume
        if 'volume' in audio_options and audio_options['volume'].get('enabled'):
            options['volume_change'] = float(audio_options['volume'].get('value', 0))
        
        # Normalizzazione
        if 'normalize' in audio_options:
            options['normalize'] = audio_options['normalize']
        
        # Trim audio
        if 'trim' in audio_options and audio_options['trim'].get('enabled'):
            start_ms = int(audio_options['trim'].get('start', 0))
            end_ms = int(audio_options['trim'].get('end', 0))
            if end_ms > start_ms:
                options['trim'] = (start_ms, end_ms)
    
    # Opzioni video
    if 'video_options' in request.form:
        video_options = json.loads(request.form.get('video_options'))
        
        # Bitrate video
        if 'video_bitrate' in video_options:
            options['video_bitrate'] = video_options['video_bitrate']
        
        # Bitrate audio
        if 'audio_bitrate' in video_options:
            options['audio_bitrate'] = video_options['audio_bitrate']
        
        # Risoluzione
        if 'resolution' in video_options and video_options['resolution'].get('enabled'):
            res_option = video_options['resolution'].get('value')
            if res_option:
                options['resolution'] = res_option
        
        # FPS
        if 'fps' in video_options and video_options['fps'].get('enabled'):
            options['fps'] = int(video_options['fps'].get('value', 30))
        
        # Rotazione
        if 'rotate' in video_options and video_options['rotate'].get('enabled'):
            angle = int(video_options['rotate'].get('value', 0))
            if angle in [90, 180, 270]:
                options['rotate'] = angle
        
        # Codec
        if 'codec' in video_options and video_options['codec'].get('enabled'):
            codec_value = video_options['codec'].get('value')
            if codec_value:
                options['codec'] = codec_value
        
        # Preset
        if 'preset' in video_options:
            options['preset'] = video_options['preset']
        
        # Audio on/off
        if 'no_audio' in video_options:
            options['no_audio'] = video_options['no_audio']
        
        # Estrazione audio
        if 'extract_audio' in video_options:
            options['extract_audio'] = video_options['extract_audio']
        
        # Trim video
        if 'trim' in video_options and video_options['trim'].get('enabled'):
            start_sec = float(video_options['trim'].get('start', 0))
            end_sec = float(video_options['trim'].get('end', 0))
            if end_sec > start_sec:
                options['trim'] = (start_sec, end_sec)
    
    # Opzioni documento
    if 'document_options' in request.form:
        document_options = json.loads(request.form.get('document_options'))
        
        # Metadati
        options['preserve_metadata'] = document_options.get('preserve_metadata', True)
        
        # Formato carta
        if document_options.get('paper_size'):
            options['paper_size'] = document_options.get('paper_size')
        
        # Margini
        if document_options.get('margins'):
            options['margins'] = document_options.get('margins')
        
        # Font e dimensione
        if document_options.get('font'):
            options['font'] = document_options.get('font')
        
        if document_options.get('font_size'):
            options['font_size'] = document_options.get('font_size')
        
        # Indice
        if document_options.get('toc'):
            options['toc'] = document_options.get('toc')
        
        # PDF crittografato
        if document_options.get('encrypted_pdf'):
            options['encrypted_pdf'] = True
            options['password'] = document_options.get('password', '')
    
    # Crea una cartella di sessione unica per questo batch
    session_id = str(uuid.uuid4())
    session_folder = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
    os.makedirs(session_folder, exist_ok=True)
    
    file_data = []
    for file in files:
        if file:
            filename = os.path.basename(file.filename)
            input_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            name_without_ext = os.path.splitext(filename)[0]
            output_filename = f"{name_without_ext}.{target_format}"
            output_path = os.path.join(session_folder, output_filename)
            
            file.save(input_path)
            file_data.append((input_path, output_path, output_filename, target_format, options))
    
    # Processa i file in parallelo
    results = []
    with ThreadPoolExecutor(max_workers=min(4, len(file_data))) as executor:
        # Ridotto il numero di worker per le conversioni video che richiedono più risorse
        results = list(executor.map(process_file, file_data))
    
    # Pulisci i file caricati
    for input_path, _, _, _, _ in file_data:
        try:
            os.remove(input_path)
        except:
            pass
    
    # Salva i metadati della sessione
    save_session_metadata(session_id, results)
    
    return jsonify({
        "message": "Conversione completata",
        "session_id": session_id,
        "files": results
    })

@app.route('/download/<session_id>/<filename>')
def download_file(session_id, filename):
    return send_from_directory(os.path.join(app.config['CONVERTED_FOLDER'], session_id), filename)

@app.route('/download_all/<session_id>')
def download_all(session_id):
    """Crea un file zip di tutti i file convertiti e lo invia al client."""
    session_folder = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
    if not os.path.exists(session_folder):
        return jsonify({"error": "Session not found"}), 404
    
    import zipfile
    zip_filename = f"converted_{session_id}.zip"
    zip_path = os.path.join(app.config['CONVERTED_FOLDER'], zip_filename)
    
    with zipfile.ZipFile(zip_path, 'w') as zipf:
        for root, _, files in os.walk(session_folder):
            for file in files:
                file_path = os.path.join(root, file)
                zipf.write(file_path, os.path.basename(file_path))
    
    return send_from_directory(app.config['CONVERTED_FOLDER'], zip_filename, as_attachment=True)

@app.route('/clear/<session_id>')
def clear_session(session_id):
    """Pulisce la cartella di sessione dopo il download."""
    session_folder = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
    if os.path.exists(session_folder):
        shutil.rmtree(session_folder)
    
    zip_file = os.path.join(app.config['CONVERTED_FOLDER'], f"converted_{session_id}.zip")
    if os.path.exists(zip_file):
        os.remove(zip_file)
    
    return jsonify({"message": "Session cleared"})

@app.route('/api/history', methods=['GET'])
def get_history():
    """Get all conversion sessions history"""
    history = []
    
    try:
        # List all session directories in the converted folder
        session_dirs = [d for d in os.listdir(app.config['CONVERTED_FOLDER']) 
                       if os.path.isdir(os.path.join(app.config['CONVERTED_FOLDER'], d))]
        
        for session_id in session_dirs:
            session_path = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
            session_info_path = os.path.join(session_path, 'session_info.json')
            
            # Read session metadata if available
            session_data = {
                'session_id': session_id,
                'timestamp': os.path.getctime(session_path),
                'date': datetime.datetime.fromtimestamp(os.path.getctime(session_path)).strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Try to load additional metadata if exists
            if os.path.exists(session_info_path):
                try:
                    with open(session_info_path, 'r') as f:
                        session_metadata = json.load(f)
                        session_data.update(session_metadata)
                except:
                    pass
            
            # Get files in this session
            files = []
            file_paths = [f for f in os.listdir(session_path) 
                         if os.path.isfile(os.path.join(session_path, f)) and f != 'session_info.json']
            
            categories = defaultdict(int)
            
            for filename in file_paths:
                file_path = os.path.join(session_path, filename)
                file_size = os.path.getsize(file_path)
                
                # Get file extension and categorize
                ext = os.path.splitext(filename)[1][1:].lower()
                category = FileTypeDetector.categorize_by_extension(ext)
                categories[category] += 1
                
                files.append({
                    'filename': filename,
                    'size': file_size,
                    'category': category,
                    'extension': ext
                })
            
            session_data['files'] = files
            session_data['file_count'] = len(files)
            session_data['categories'] = dict(categories)
            
            history.append(session_data)
        
        # Sort by timestamp descending (newest first)
        history.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify({
            'success': True,
            'history': history
        })
        
    except Exception as e:
        print(f"Error fetching history: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/history/delete/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a specific session and all its files"""
    session_path = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
    
    try:
        if os.path.exists(session_path):
            # Delete all files in the session directory
            for file in os.listdir(session_path):
                file_path = os.path.join(session_path, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            
            # Remove the directory itself
            os.rmdir(session_path)
            
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Session not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history/delete/file/<session_id>/<path:filename>', methods=['DELETE'])
def delete_file(session_id, filename):
    """Delete a specific file from a session"""
    file_path = os.path.join(app.config['CONVERTED_FOLDER'], session_id, filename)
    
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'File not found'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/history/delete/batch', methods=['POST'])
def delete_batch():
    """Delete multiple files or sessions"""
    data = request.get_json()
    
    if not data or ('files' not in data and 'sessions' not in data):
        return jsonify({'success': False, 'error': 'Invalid request'}), 400
        
    try:
        # Delete specific files
        if 'files' in data:
            for file_info in data['files']:
                if 'session_id' in file_info and 'filename' in file_info:
                    file_path = os.path.join(
                        app.config['CONVERTED_FOLDER'], 
                        file_info['session_id'], 
                        file_info['filename']
                    )
                    if os.path.exists(file_path):
                        os.remove(file_path)
        
        # Delete entire sessions
        if 'sessions' in data:
            for session_id in data['sessions']:
                session_path = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
                if os.path.exists(session_path):
                    for file in os.listdir(session_path):
                        file_path = os.path.join(session_path, file)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
                    os.rmdir(session_path)
        
        return jsonify({'success': True})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def save_session_metadata(session_id, file_data):
    """Save session metadata for history tracking"""
    session_path = os.path.join(app.config['CONVERTED_FOLDER'], session_id)
    info_path = os.path.join(session_path, 'session_info.json')
    
    # Extract timestamp from directory creation time if not exists
    timestamp = os.path.getctime(session_path)
    date_str = datetime.datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
    
    # Extract target formats
    target_formats = set()
    categories = defaultdict(int)
    
    for result in file_data:
        if result.get('success') and 'filename' in result:
            ext = os.path.splitext(result['filename'])[1][1:].lower()
            target_formats.add(ext)
            
            category = result.get('category') or FileTypeDetector.categorize_by_extension(ext)
            categories[category] += 1
    
    # Create metadata
    metadata = {
        'timestamp': timestamp,
        'date': date_str,
        'target_formats': list(target_formats),
        'categories': dict(categories)
    }
    
    # Save to JSON file
    with open(info_path, 'w') as f:
        json.dump(metadata, f)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)