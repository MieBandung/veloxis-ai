import os
import logging
from typing import Any

logger = logging.getLogger("veloxis.model")

class ModelContainer:
    """Holds the Qwen2.5-VL base model + Veloxis LoRA adapter for the process lifetime."""

    def __init__(self):
        self.model: Any = None
        self.processor: Any = None
        self.ai_mode: str = "qwen"
        self.base_model: str = ""
        self.adapter_path: str = ""
        self.is_loaded: bool = False
        self.load_error: str | None = None

    def load(self):
        if self.is_loaded:
            return

        self.ai_mode = os.getenv("AI_MODE", "qwen").lower()
        self.base_model = os.getenv("BASE_MODEL", "Qwen/Qwen2.5-VL-3B-Instruct")
        self.adapter_path = os.getenv("ADAPTER_PATH", "/app/models/qwen-veloxis/best_adapter")

        if self.ai_mode == "mock":
            logger.warning("AI_MODE=mock — serving static demo output. Not a production path.")
            self.is_loaded = True
            return

        if self.ai_mode != "qwen":
            raise RuntimeError(f"Unsupported AI_MODE '{self.ai_mode}'. Use 'qwen' or 'mock'.")

        if not os.path.isdir(self.adapter_path):
            raise RuntimeError(f"LoRA adapter directory not found: {self.adapter_path}")
        if not os.path.isfile(os.path.join(self.adapter_path, "adapter_config.json")):
            raise RuntimeError(
                f"adapter_config.json missing in {self.adapter_path}. PEFT cannot load the adapter."
            )

        logger.info("Loading base model %s ...", self.base_model)
        import torch
        from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration
        from peft import PeftModel

        load_kwargs: dict[str, Any] = {"device_map": "auto"}
        if os.getenv("LOAD_IN_4BIT", "true").lower() in ("1", "true", "yes"):
            from transformers import BitsAndBytesConfig

            load_kwargs["quantization_config"] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
                bnb_4bit_compute_dtype=torch.float16,
            )
        else:
            load_kwargs["dtype"] = torch.float16

        base = Qwen2_5_VLForConditionalGeneration.from_pretrained(self.base_model, **load_kwargs)

        logger.info("Applying Veloxis LoRA adapter from %s ...", self.adapter_path)
        self.model = PeftModel.from_pretrained(base, self.adapter_path)
        self.model.eval()

        self.processor = AutoProcessor.from_pretrained(self.base_model)
        self.is_loaded = True
        logger.info("Qwen2.5-VL + Veloxis LoRA adapter ready.")

model_container = ModelContainer()
