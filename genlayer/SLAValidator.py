# { "Depends": "py-genlayer:test" }
#
# IDE Stub Definitions — overridden at runtime by `from genlayer import *`
# These exist solely to satisfy local linters (Pyre, Pyright, etc.)
# that cannot resolve the GenLayer SDK which only exists inside the VM.

from __future__ import annotations
from typing import Any, Generic, TypeVar

_K = TypeVar("_K")
_V = TypeVar("_V")


class TreeMap(Generic[_K, _V]):
    """Stub for genlayer.TreeMap"""
    def __getitem__(self, key: Any) -> Any: ...  # type: ignore
    def __setitem__(self, key: Any, value: Any) -> None: ...
    def get(self, key: Any, default: Any = None) -> Any: ...


class u256(int):
    """Stub for genlayer.u256"""
    pass


class _Public:
    @staticmethod
    def write(f: Any) -> Any: return f
    @staticmethod
    def view(f: Any) -> Any: return f


class _Web:
    @staticmethod
    def render(url: str, mode: str = "text") -> str: return ""


class _Nondet:
    web = _Web()
    @staticmethod
    def exec_prompt(p: str) -> str: return ""


class _VmReturn:
    calldata: Any = ""


class _Vm:
    Return = _VmReturn
    @staticmethod
    def run_nondet_unsafe(leader: Any, validator: Any) -> Any: return ""


class gl:  # type: ignore[no-redef]
    """Stub for genlayer.gl"""
    class Contract: pass
    public = _Public()
    nondet = _Nondet()
    vm = _Vm()


# At runtime inside the GenLayer VM, this import overwrites all stubs above.
try:
    from genlayer import *  # type: ignore[assignment,no-redef]
except ImportError:
    pass

# ── SLA Validator Contract ──────────────────────────────────────────────────

class SLAValidator(gl.Contract):
    """
    SLA Validation Layer for Apolo.
    
    Architecture:
    - Normalization: Collapse LLM output to strict YES/NO.
    - Consensus: run_nondet_unsafe pattern for Bradbury compliance.
    - Storage: intentHash mapped to result state.
    """

    sla_results: TreeMap[str, bool]
    recordsSeen: TreeMap[str, bool]
    consensusStatus: TreeMap[str, str]
    finalityStatus: TreeMap[str, str]
    observedAt: TreeMap[str, u256]
    finalizedAt: TreeMap[str, u256]
    validationRef: TreeMap[str, str]

    def __init__(self):
        # IMPORTANT: Do NOT initialize TreeMap here on Bradbury Phase 1.
        # The VM handles initialization of class-level TreeMap attributes.
        pass

    # ── Normalization Layer ─────────────────────────────────────────────────

    def _normalize(self, raw: str) -> str:
        raw_norm = str(raw).strip().upper()
        if raw_norm.startswith("YES"):
            return "YES"
        return "NO"

    def _normalize_consensus_status(self, value: str) -> str:
        val = str(value).strip().upper()
        return val if val in ("PENDING", "ACCEPTED", "REJECTED") else "PENDING"

    def _normalize_finality_status(self, value: str) -> str:
        val = str(value).strip().upper()
        return val if val in ("PENDING", "CONFIRMED", "FINALIZED") else "PENDING"

    # ── Evaluation Layer ────────────────────────────────────────────────────

    def _evaluate(self, condition: str, evidenceUrl: str) -> str:
        def leader_fn():
            evidence = gl.nondet.web.render(evidenceUrl, mode="text")
            prompt = (
                f"SLA Verification Task\n"
                f"Endpoint: {evidenceUrl}\n"
                f"Evidence: {evidence}\n"
                f"Condition: {condition}\n"
                f"Was the condition met? Answer YES or NO."
            )
            answer = gl.nondet.exec_prompt(prompt)
            return self._normalize(answer)

        def validator_fn(leader_result):
            # Simplified validator for Bradbury stability
            if not hasattr(leader_result, 'calldata'):
                return False
            val = str(leader_result.calldata).strip().upper()
            return val in ("YES", "NO")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        return str(result).strip().upper()

    # ── Entry Points ────────────────────────────────────────────────────────

    @gl.public.write
    def ping(self) -> bool:
        """Minimal test to verify state mutation works"""
        self.recordsSeen["ping"] = True
        return True

    @gl.public.write
    def validate(self, intentHash: str, condition: str, evidenceUrl: str) -> bool:
        """Main entry point for SLA validation"""
        raw_result = self._evaluate(condition, evidenceUrl)
        approved = (raw_result == "YES")
        
        # Store results
        self.sla_results[intentHash] = approved
        self.recordsSeen[intentHash] = True
        self.consensusStatus[intentHash] = "ACCEPTED"
        self.finalityStatus[intentHash] = "PENDING"
        self.observedAt[intentHash] = u256(0)
        self.finalizedAt[intentHash] = u256(0)
        self.validationRef[intentHash] = "genlayer-v1"
        return approved

    @gl.public.write
    def recordConsensus(self, intentHash: str, approved: bool, consensusStatus: str, 
                        finalityStatus: str, validationRef: str, observedAt: u256) -> bool:
        self.sla_results[intentHash] = bool(approved)
        self.recordsSeen[intentHash] = True
        self.consensusStatus[intentHash] = self._normalize_consensus_status(consensusStatus)
        self.finalityStatus[intentHash] = self._normalize_finality_status(finalityStatus)
        self.validationRef[intentHash] = str(validationRef)
        self.observedAt[intentHash] = u256(observedAt)
        return True

    @gl.public.write
    def recordFinality(self, intentHash: str, finalityStatus: str, finalizedAt: u256) -> str:
        normalized = self._normalize_finality_status(finalityStatus)
        self.recordsSeen[intentHash] = True
        self.finalityStatus[intentHash] = normalized
        if normalized in ("CONFIRMED", "FINALIZED"):
            self.finalizedAt[intentHash] = u256(finalizedAt)
        return normalized

    @gl.public.view
    def getResult(self, intentHash: str) -> bool:
        return self.sla_results.get(intentHash, False)

    @gl.public.view
    def getRecord(self, intentHash: str) -> tuple[bool, bool, str, str, u256, u256, str]:
        return (
            self.recordsSeen.get(intentHash, False),
            self.sla_results.get(intentHash, False),
            self.consensusStatus.get(intentHash, "PENDING"),
            self.finalityStatus.get(intentHash, "PENDING"),
            self.observedAt.get(intentHash, u256(0)),
            self.finalizedAt.get(intentHash, u256(0)),
            self.validationRef.get(intentHash, ""),
        )
