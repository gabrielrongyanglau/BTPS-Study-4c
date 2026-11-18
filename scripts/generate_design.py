"""
Generate the Study 4c choice design (8 choice sets x 4 flights).

Six two-level attributes (1 = the level a person high on that BTPS factor should prefer):
  STR  Travel Strain                 1 = direct, daytime departure   0 = one stop, long layover, awkward hour
  PRD  Work Productivity             1 = Wi-Fi + power + work seat   0 = none of these
  SAF  Travel Safety                 1 = safety rating 7/7           0 = safety rating 4/7
  ENV  Environmental Sustainability  1 = low CO2 (newer aircraft)    0 = high CO2
  LOY  Loyalty Rewards               1 = in participant's alliance   0 = not in alliance
  PRC  Company policy (price)        1 = within fare cap             0 = above fare cap (needs justification)

Constraints, within every choice set:
  * each attribute is level-balanced (2 options at 1, 2 at 0)
  * no option dominates another (no "obvious" answer)
  * goods profile is (4, 3, 3, 2): a unique best option (4 favourable levels) and a unique
    worst option (2 favourable levels), used for the good / poor AI recommendation conditions
Across the design:
  * all 32 profiles distinct, every attribute 16/16 balanced
  * pairwise attribute correlations minimised by random restarts + local search
A strictly orthogonal fraction is impossible here, because any orthogonal fraction contains
extreme profiles (e.g. 111110) that dominate every other option in a balanced set.

Run: python3 scripts/generate_design.py   (writes src/data/design.json)
"""
import itertools, json, random, pathlib

ATTRS = ["STR", "PRD", "SAF", "ENV", "LOY", "PRC"]
POOL = [p for p in itertools.product([0, 1], repeat=6) if 2 <= sum(p) <= 4]

def dominates(a, b):
    return all(x >= y for x, y in zip(a, b)) and a != b

def valid_set(s):
    if sorted(sum(p) for p in s) != [2, 3, 3, 4]:
        return False
    if any(sum(p[k] for p in s) != 2 for k in range(6)):
        return False
    return not any(dominates(a, b) for a, b in itertools.permutations(s, 2))

def random_set(rng, used):
    w2 = [p for p in POOL if sum(p) == 2 and p not in used]
    w3 = [p for p in POOL if sum(p) == 3 and p not in used]
    w4 = [p for p in POOL if sum(p) == 4 and p not in used]
    for _ in range(4000):
        if len(w3) < 2 or not w2 or not w4:
            return None
        s = (rng.choice(w4), *rng.sample(w3, 2), rng.choice(w2))
        if valid_set(s):
            return s
    return None

def objective(sets):
    profs = [p for s in sets for p in s]
    tot = 0.0
    for i, j in itertools.combinations(range(6), 2):
        c = sum((2*p[i]-1)*(2*p[j]-1) for p in profs)
        tot += c * c
    return tot

def build(rng):
    sets, used = [], set()
    for _ in range(8):
        s = random_set(rng, used)
        if s is None:
            return None
        sets.append(s); used.update(s)
    return sets

rng = random.Random(2026)
best, best_obj = None, float("inf")
for restart in range(300):
    sets = build(rng)
    if not sets:
        continue
    obj = objective(sets)
    for _ in range(3000):  # local search: replace one set
        k = rng.randrange(8)
        used = set(p for i, s in enumerate(sets) if i != k for p in s)
        s = random_set(rng, used)
        if s is None:
            continue
        cand = sets[:k] + [s] + sets[k+1:]
        o = objective(cand)
        if o <= obj:
            sets, obj = cand, o
    if obj < best_obj:
        best, best_obj = sets, obj
    if best_obj == 0:
        break

profs = [p for s in best for p in s]
assert len(set(profs)) == 32
print("sum of squared pairwise inner products:", best_obj)
for i, j in itertools.combinations(range(6), 2):
    r = sum((2*p[i]-1)*(2*p[j]-1) for p in profs) / 32
    print(f"  r({ATTRS[i]},{ATTRS[j]}) = {r:+.3f}")

out = []
for idx, s in enumerate(best):
    goods = [sum(p) for p in s]
    out.append({"set": idx + 1,
                "options": [dict(zip(ATTRS, p)) for p in s],
                "best": goods.index(4), "worst": goods.index(2), "goods": goods})
    print(idx + 1, ["".join(map(str, p)) for p in s], goods)

path = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "design.json"
path.write_text(json.dumps({"attributes": ATTRS, "objective": best_obj, "sets": out}, indent=2))
print("wrote", path)
