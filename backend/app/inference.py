import io
import json
import logging
import os
from PIL import Image
from pydantic import ValidationError
from app.model import model_container
from app.schemas import ExtractionResult

logger = logging.getLogger("veloxis.inference")

PROMPT_TEXT = """Extract the logistics document into EXACTLY this JSON schema.

Rules:
- Return valid JSON only.
- Do not add commentary.
- Do not wrap the JSON in Markdown fences.
- Use null when a field is missing or cannot be read reliably.
- Do not invent information.
- Extract every item shown in the document.
- Preserve the meaning of the document.
- Use the exact field names and structure below.

{
  "nomor_dokumen": null,
  "jenis_dokumen": null,
  "nama_vendor": null,
  "nama_penerima": null,
  "tanggal": null,
  "items": [
    {
      "sku": null,
      "nama_barang": null,
      "qty": null,
      "satuan": null,
      "berat_kg": null
    }
  ],
  "grand_total": null
}"""

MOCK_RESULT = {
    "nomor_dokumen": "DEMO-001",
    "jenis_dokumen": "SURAT JALAN",
    "nama_vendor": "PT Demo",
    "nama_penerima": "PT Customer",
    "tanggal": "2026-08-22",
    "items": [
        {
            "sku": "SKU-DEMO-101",
            "nama_barang": "Barang Demo A",
            "qty": 5.0,
            "satuan": "pcs",
            "berat_kg": 1.25
        }
    ],
    "grand_total": 150000.0,
}

def extract_json_substring(text: str) -> str:
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        return text[start_idx : end_idx + 1]
    raise ValueError("No JSON object found in output.")

def run_inference(image_bytes: bytes, filename: str) -> dict:
    mode = model_container.ai_mode

    if mode == "mock":
        logger.info(f"Running mock extraction for file: {filename}")
        result = ExtractionResult.model_validate(MOCK_RESULT)
        return result.model_dump()

    # Qwen mode
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        raise ValueError(f"Invalid image content: {e}")

    model = model_container.model
    processor = model_container.processor

    if not model or not processor:
        raise RuntimeError("Model or processor is not initialized.")

    try:
        from qwen_vl_utils import process_vision_info

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "image": image},
                    {"type": "text", "text": PROMPT_TEXT},
                ],
            }
        ]

        text = processor.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        )
        inputs = inputs.to(model.device)

        max_new_tokens = int(os.getenv("MAX_NEW_TOKENS", "512"))

        generated_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            num_beams=1,
        )

        generated_ids_trimmed = [
            out_ids[len(in_ids) :] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = processor.batch_decode(
            generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
        )[0]

        logger.debug(f"Raw Qwen model output: {output_text}")

        json_str = extract_json_substring(output_text)
        parsed_json = json.loads(json_str)

        validated_result = ExtractionResult.model_validate(parsed_json)
        return validated_result.model_dump()

    except json.JSONDecodeError as err:
        logger.error(f"JSON parsing error: {err}")
        raise ValueError("INVALID_MODEL_OUTPUT: Model output could not be parsed as valid JSON.")
    except ValidationError as err:
        logger.error(f"Pydantic validation error: {err}")
        raise ValueError("INVALID_MODEL_OUTPUT: Model output does not conform to ExtractionResult schema.")
    except Exception as err:
        logger.error(f"Inference execution error: {err}")
        raise RuntimeError(f"INFERENCE_FAILURE: {str(err)}")
