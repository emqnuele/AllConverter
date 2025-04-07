import os
from abc import ABC, abstractmethod

class BaseConverter(ABC):
    """Classe base astratta per tutti i convertitori di file"""
    
    def __init__(self, source_format=None, target_format=None):
        self.source_format = source_format
        self.target_format = target_format
        
    @abstractmethod
    def convert(self, input_path, output_path, **kwargs):
        """
        Converte il file dall'input path all'output path
        
        Args:
            input_path: percorso del file da convertire
            output_path: percorso dove salvare il file convertito
            **kwargs: parametri aggiuntivi specifici per il convertitore
            
        Returns:
            bool: True se la conversione è avvenuta con successo, False altrimenti
        """
        pass
    
    @abstractmethod
    def get_supported_input_formats(self):
        """Restituisce una lista di formati supportati in input"""
        pass
        
    @abstractmethod
    def get_supported_output_formats(self):
        """Restituisce una lista di formati supportati in output"""
        pass
    
    def is_conversion_supported(self, source_format, target_format):
        """Verifica se la conversione è supportata"""
        return (source_format in self.get_supported_input_formats() and 
                target_format in self.get_supported_output_formats())