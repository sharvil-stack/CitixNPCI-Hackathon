"""Compare base Qwen3-1.7B and trained CardSaathi LoRA answers on held-out prompts.

Outputs a JSONL file for human review; this script does not certify factual accuracy.
"""
from __future__ import annotations
import json, os
from pathlib import Path
import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT = Path(__file__).resolve().parent
BASE_MODEL = os.getenv("HF_BASE_MODEL", "Qwen/Qwen3-1.7B")
ADAPTER = Path(os.getenv("HF_ADAPTER_PATH", str(ROOT.parent / "models" / "cardsaathi-qwen3-1.7b-lora")))
if not ADAPTER.is_absolute():
    ADAPTER = ROOT.parent / ADAPTER
EVAL_FILE = ROOT / "data" / "cardsaathi_eval.jsonl"
OUTPUT = ROOT / "evaluation_outputs.jsonl"


def generate(model, tokenizer, messages, device):
    try:
        prompt = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True, enable_thinking=False
        )
    except TypeError:
        prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1536).to(device)
    with torch.inference_mode():
        out = model.generate(
            **inputs, max_new_tokens=350, do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )
    return tokenizer.decode(out[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True).strip()


def main():
    if not (ADAPTER / "adapter_config.json").exists():
        raise SystemExit(f"Adapter not found: {ADAPTER}. Run train_lora.py first.")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
    device = "cuda" if torch.cuda.is_available() else "mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu"
    dtype = torch.float16 if device in {"cuda", "mps"} else torch.float32
    base = AutoModelForCausalLM.from_pretrained(BASE_MODEL, torch_dtype=dtype, low_cpu_mem_usage=True).to(device).eval()
    tuned = PeftModel.from_pretrained(base, str(ADAPTER)).eval()
    with EVAL_FILE.open(encoding="utf-8") as src, OUTPUT.open("w", encoding="utf-8") as dst:
        for line in src:
            example = json.loads(line)
            messages = example["messages"][:-1]
            with tuned.disable_adapter():
                base_answer = generate(tuned, tokenizer, messages, device)
            tuned_answer = generate(tuned, tokenizer, messages, device)
            record = {
                "question": example["messages"][-2]["content"],
                "reference_answer": example["messages"][-1]["content"],
                "base_model_answer": base_answer,
                "adapter_answer": tuned_answer,
            }
            dst.write(json.dumps(record, ensure_ascii=False) + "\n")
            print("-", record["question"][:90].replace("\n", " "))
    print(f"Wrote side-by-side human-review file: {OUTPUT}")
    print("Review answer safety, language quality, and factual discipline. Do not treat this as an automatic accuracy score.")

if __name__ == "__main__":
    main()
