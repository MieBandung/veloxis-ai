import os
import logging
from typing import Any

logger = logging.getLogger("veloxis.model")

class ModelContainer:
    def __init__(self):
        self.model: Any = None
        self.processor: Any = None
        self.ai_mode: str = os.getenv("AI_MODE", "mock").lower()
        self.is_loaded: bool = False

    def load(self):
        if self.is_loaded:
            return

        self.ai_mode = os.getenv("AI_MODE", "mock").lower()
        if self.ai_mode == "mock":
            logger.info("AI_MODE is set to 'mock'. Skipping Qwen model loading.")
            self.is_loaded = True
            return

        logger.info(f"AI_MODE is set to '{self.ai_mode}'. Loading Qwen2.5-VL model and LoRA adapter...")
        try:
            import torch
            from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration, BitsAndBytesConfig
            from peft import PeftModel

            base_model_name = os.getenv("BASE_MODEL", "Qwen/Qwen2.5-VL-3B-Instruct")
            adapter_path = os.getenv("ADAPTER_PATH", "./models/qwen-veloxis/epoch-1")

            quant_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
                bnb_4bit_compute_dtype=torch.float16,
            )

            base_model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
                base_model_name,
                quantization_config=quant_config,
                device_map="auto",
            )

            self.model = PeftModel.from_pretrained(
                base_model,
                adapter_path,
            )
            self.processor = AutoProcessor.from_pretrained(base_model_name)
            self.is_loaded = True
            logger.info("Qwen2.5-VL base model + Veloxis LoRA adapter loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load Qwen model: {e}")
            logger.warning("Falling back to mock mode for runtime resilience.")
            self.ai_mode = "mock"
            self.is_loaded = True

model_container = ModelContainer()
