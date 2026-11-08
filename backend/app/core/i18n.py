import json
import os


def _load_locale(lang: str) -> dict:
    path = os.path.join(os.path.dirname(__file__), "..", "locales", f"{lang}.json")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {}


TRANSLATIONS = {
    "en": _load_locale("en"),
    "ar": _load_locale("ar"),
}


def translate(lang: str, code: str, **kwargs) -> str:
    lang = lang if lang in TRANSLATIONS else "en"
    template = TRANSLATIONS.get(lang, {}).get(code, code)
    try:
        return template.format(**kwargs)
    except (KeyError, IndexError):
        return template
