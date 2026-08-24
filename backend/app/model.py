import os
import logging
from typing import Any

from app.preprocessing import DEFAULT_MIN_PIXELS, DEFAULT_MAX_PIXELS

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
        # Pixel budget the processor will apply; read from the loaded processor so
        # preprocessing matches what the adapter saw during training.
        self.min_pixels: int = DEFAULT_MIN_PIXELS
        self.max_pixels: int = DEFAULT_MAX_PIXELS

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

        self.processor = self._load_processor(AutoProcessor)
        self._read_pixel_budget()
        self.is_loaded = True
        logger.info("Qwen2.5-VL + Veloxis LoRA adapter ready.")

    def _load_processor(self, AutoProcessor):
        """Prefer the adapter's processor: it carries the training-time pixel budget.

        Loading the base model's processor instead silently swaps in Qwen's defaults
        (3136 / 12845056), which puts small documents far below the resolution the
        adapter was fine-tuned on.
        """
        if os.path.isfile(os.path.join(self.adapter_path, "preprocessor_config.json")):
            logger.info("Loading processor from adapter dir %s", self.adapter_path)
            return AutoProcessor.from_pretrained(
                self.adapter_path,
                min_pixels=DEFAULT_MIN_PIXELS,
                max_pixels=DEFAULT_MAX_PIXELS,
            )

        logger.warning(
            "No preprocessor_config.json in the adapter dir; falling back to %s with the "
            "training pixel budget applied explicitly.",
            self.base_model,
        )
        return AutoProcessor.from_pretrained(
            self.base_model,
            min_pixels=DEFAULT_MIN_PIXELS,
            max_pixels=DEFAULT_MAX_PIXELS,
        )

    def _read_pixel_budget(self):
        """Mirror the processor's effective budget so preprocessing agrees with it."""
        image_processor = getattr(self.processor, "image_processor", None)
        self.min_pixels = int(getattr(image_processor, "min_pixels", None) or DEFAULT_MIN_PIXELS)
        self.max_pixels = int(getattr(image_processor, "max_pixels", None) or DEFAULT_MAX_PIXELS)
        logger.info(
            "Image pixel budget: min=%s max=%s (%s-%s visual tokens)",
            self.min_pixels, self.max_pixels,
            self.min_pixels // 784, self.max_pixels // 784,
        )

model_container = ModelContainer()
