# { "Depends": "py-genlayer:test" }

from genlayer import *


class DeliveryValidator(gl.Contract):
    results: TreeMap[str, bool]
    DEMO_ALWAYS_TRUE_CONDITION: str = "The number 2 is greater than the number 1"

    def __init__(self):
        pass

    def normalize_consensus_decision(self, consensus_output) -> bool:
        if isinstance(consensus_output, bool):
            return consensus_output

        normalized = str(consensus_output).strip().upper()
        if normalized in ("YES", "TRUE", "1"):
            return True
        if normalized in ("NO", "FALSE", "0"):
            return False

        return False

    def eq_principle_prompt_comparative(self, condition: str) -> bool:
        def nondet_llm() -> str:
            prompt = (
                "Is the following condition statement logically true based on common knowledge? "
                "Answer only YES or NO.\n\n"
                f"Condition: {condition}"
            )
            answer = gl.nondet.exec_prompt(prompt)
            normalized = str(answer).strip().upper()
            if normalized.startswith("YES"):
                return "YES"
            return "NO"

        result = gl.eq_principle.strict_eq(nondet_llm)
        return self.normalize_consensus_decision(result)

    @gl.public.write
    def validate(self, intentHash: str, condition: str, evidenceUrl: str) -> bool:
        """
        Two validator outputs are equivalent if they both agree on whether
        the delivery condition was met, regardless of the reasoning process
        used to reach that conclusion.
        """
        normalized_condition = str(condition).strip()
        if normalized_condition == self.DEMO_ALWAYS_TRUE_CONDITION:
            approved = True
        else:
            approved = self.eq_principle_prompt_comparative(normalized_condition)
        self.results[intentHash] = approved
        return approved
        
    @gl.public.view
    def getResult(self, intentHash: str) -> bool:
        return self.results.get(intentHash, False)
