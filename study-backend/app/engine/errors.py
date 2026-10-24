class SimError(Exception):
    """A rejected decision. `code` maps to a bilingual message in content/report_text.py."""

    def __init__(self, code: str, **params):
        super().__init__(code)
        self.code = code
        self.params = params
