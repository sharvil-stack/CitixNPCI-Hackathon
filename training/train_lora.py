"""Fine-tune CardSaathi's response style with Qwen3-1.7B + QLoRA/LoRA.

Run with a CUDA GPU in Google Colab. The adapter improves response style and
safe educational behaviour; changing card fees and product facts must remain
in the app's retrievable, verified catalogue.
"""
from __future__ import annotations

import os
from pathlib import Path

import torch
from datasets import load_dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import SFTConfig, SFTTrainer

ROOT = Path(__file__).resolve().parent
MODEL_ID = os.getenv("HF_BASE_MODEL", "Qwen/Qwen3-1.7B")
TRAIN_FILE = ROOT / "data" / "cardsaathi_sft.jsonl"
EVAL_FILE = ROOT / "data" / "cardsaathi_eval.jsonl"
OUTPUT_DIR = Path(os.getenv("HF_OUTPUT_DIR", str(ROOT.parent / "models" / "cardsaathi-qwen3-1.7b-lora")))


def main() -> None:
    if not torch.cuda.is_available():
        raise SystemExit(
            "No CUDA GPU detected. In Colab choose Runtime → Change runtime type → T4 GPU."
        )
    if not TRAIN_FILE.exists() or not EVAL_FILE.exists():
        raise FileNotFoundError(f"Training/evaluation data missing: {TRAIN_FILE} / {EVAL_FILE}")

    train_dataset = load_dataset("json", data_files=str(TRAIN_FILE), split="train")
    eval_dataset = load_dataset("json", data_files=str(EVAL_FILE), split="train")
    if len(train_dataset) < 60:
        raise SystemExit("Training dataset is a small starter set. Review/add examples before relying on the adapter.")
    if len(eval_dataset) < 9:
        raise SystemExit("Held-out evaluation dataset looks too small. Review cardsaathi_eval.jsonl.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    use_bf16 = torch.cuda.is_bf16_supported()
    compute_dtype = torch.bfloat16 if use_bf16 else torch.float16
    print("Base model:", MODEL_ID)
    print("Training examples:", len(train_dataset), "| Evaluation examples:", len(eval_dataset))
    print("GPU:", torch.cuda.get_device_name(0))
    print("Training precision:", "BF16" if use_bf16 else "FP16")
    print("Adapter output:", OUTPUT_DIR)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, use_fast=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    quant_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=compute_dtype,
    )
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        quantization_config=quant_config,
        device_map="auto",
        torch_dtype=compute_dtype,
    )
    model.config.use_cache = False
    model.gradient_checkpointing_enable()

    lora = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    config = SFTConfig(
        output_dir=str(OUTPUT_DIR),
        num_train_epochs=3,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=1.5e-4,
        logging_steps=5,
        eval_strategy="epoch",
        save_strategy="epoch",
        save_total_limit=2,
        max_length=1536,
        packing=False,
        fp16=not use_bf16,
        bf16=use_bf16,
        report_to="none",
        seed=42,
        # Qwen's current tokenizer template does not expose TRL's required
        # {% generation %} span, so this starter recipe trains over all tokens.
        # A better future version should use an explicit assistant-only mask.
        assistant_only_loss=False,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
    )
    trainer = SFTTrainer(
        model=model,
        args=config,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        processing_class=tokenizer,
        peft_config=lora,
    )

    # This is a compatibility workaround verified with the project's T4/TRL
    # setup: leave trainable adapter params in FP32 for safe gradient handling.
    for _, param in trainer.model.named_parameters():
        if param.requires_grad and param.dtype in (torch.float16, torch.bfloat16):
            param.data = param.data.float()
    print("Upcast trainable LoRA parameters to FP32")

    trainer.train()
    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))
    if not (OUTPUT_DIR / "adapter_config.json").exists():
        raise RuntimeError(f"Training ran but adapter_config.json was not saved to {OUTPUT_DIR}")
    print(f"\nSUCCESS: saved LoRA adapter to: {OUTPUT_DIR}")
    print("Remember: lower eval loss is not proof of factual correctness; review generated answers.")


if __name__ == "__main__":
    main()
