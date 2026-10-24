# CardSaathi LoRA fine-tuning (Colab)

## Use the matching files

- Project bundle: `CardSaathi_v3_training_ready_v2.zip`
- Notebook: `CardSaathi_Finetune_Colab_v2.ipynb`

Upload the notebook to Google Colab, select **Runtime → Change runtime type → T4 GPU** (or another compatible CUDA GPU), then run the cells from top to bottom. The notebook accepts this bundle or an older CardSaathi ZIP, patches the known precision/chat-template settings, trains, packages the adapter without checkpoints, and immediately triggers a download. It does not mount Google Drive.

No Groq key or Hugging Face token is needed for this public base model by default. Never upload `.env`, API keys, Aadhaar/PAN, card numbers, OTPs, or real customer statements.

## What training does

- Base model: `Qwen/Qwen3-1.7B`
- Method: 4-bit QLoRA/LoRA
- Training data: `data/cardsaathi_sft.jsonl`
- Held-out evaluation: `data/cardsaathi_eval.jsonl`
- Adapter output: `models/cardsaathi-qwen3-1.7b-lora/`

The dataset is a small prototype starter dataset. It can teach response style and safer multilingual explanations, but it is not enough to establish reliability for real financial advice. Current product terms must come from the app's verified catalogue/retrieval system, not model memory.

The training recipe uses `assistant_only_loss=False` because the Qwen tokenizer chat template in the tested TRL setup did not supply `{% generation %}` spans needed for assistant-only loss masks. This means loss applies to the full formatted example, including prompt tokens. It is a pragmatic MVP workaround, not the ideal final training objective. For a more rigorous next iteration, use a supported template with assistant masks and expand expert-reviewed examples.

## After downloading the adapter

Extract `cardsaathi-qwen3-1.7b-lora-adapter.zip`. It contains a folder named `cardsaathi-qwen3-1.7b-lora/` with adapter weights/config and tokenizer metadata. Copy that folder into the local project's `models/` directory, then set in local `.env`:

```dotenv
LLM_PROVIDER=local_hf
HF_BASE_MODEL=Qwen/Qwen3-1.7B
HF_ADAPTER_PATH=models/cardsaathi-qwen3-1.7b-lora
```

Install local inference dependencies using `pip install -r requirements-hf.txt`. Local inference can be slow on a Mac. Return to the hosted Groq provider with `LLM_PROVIDER=groq` and a private key in `.env`.

A falling validation loss is not proof of factual correctness. Review English, Hindi, and Marathi outputs, especially credit costs, eligibility, FD-backed cards, UPI restrictions, fraud warnings, and refusal behavior.
