"""
Generate the Study 4c choice design (8 choice sets x 4 flights).

Three two-level benefit attributes (1 = the level a person high on that BTPS factor should prefer):
  STR  Travel Strain                 1 = direct, daytime departure   0 = one stop, long layover, awkward hour
  ENV  Environmental Sustainability  1 = low CO2 (newer aircraft)    0 = high CO2
  LOY  Loyalty Rewards               1 = earns company rewards points (partner airline)   0 = no points
and one cost attribute:
  PRICE  fare level 0-3 relative to the trip's fare cap:
         0 = cap -15%, 1 = cap -5% (both within policy), 2 = cap +5%, 3 = cap +15% (above cap, needs a reason)

Constraints, within every choice set:
  * the four price levels each appear once
  * each benefit attribute is level-balanced (2 options at 1, 2 at 0)
  * no option dominates another (at least as good on every benefit AND cheaper), so taking a
    benefit always costs something: a higher fare, another benefit, or both
Across the design:
  * the 8 sets are distinct; correlations among attributes are minimised by random restarts + local search
    (benefits are necessarily somewhat positively correlated with price, which is the point of the task)

Run: python3 scripts/generate_design.py   (writes src/data/design.json)
"""
import itertools, json, random, pathlib, statistics

BENEFITS = ["STR", "ENV", "LOY"]

def dominates(a, b):
    # a = (benefits tuple, price level); lower price is better
    ba, pa = a
    bb, pb = b
    return all(x >= y for x, y in zip(ba, bb)) and pa <= pb and a != b

def all_valid_sets():
    out = []
    profiles = list(itertools.product([0, 1], repeat=3))
    for combo in itertools.product(profiles, repeat=4):  # combo[i] = benefits of the option at price level i
        if any(sum(c[k] for c in combo) != 2 for k in range(3)):
            continue
        opts = [(combo[i], i) for i in range(4)]
        if any(dominates(a, b) for a, b in itertools.permutations(opts, 2)):
            continue
        out.append(tuple(opts))
    return out

def corr(x, y):
    mx, my = statistics.mean(x), statistics.mean(y)
    sx = sum((a - mx) ** 2 for a in x) ** 0.5
    sy = sum((b - my) ** 2 for b in y) ** 0.5
    return sum((a - mx) * (b - my) for a, b in zip(x, y)) / (sx * sy)

def columns(sets):
    opts = [o for s in sets for o in s]
    cols = {k: [o[0][i] for o in opts] for i, k in enumerate(BENEFITS)}
    cols["PRICE"] = [o[1] for o in opts]
    return cols

def objective(sets):
    cols = columns(sets)
    names = list(cols)
    return sum(corr(cols[a], cols[b]) ** 2 for a, b in itertools.combinations(names, 2))

valid = all_valid_sets()
print("valid choice sets:", len(valid))

rng = random.Random(2026)
best, best_obj = None, float("inf")
for _ in range(400):
    sets = rng.sample(valid, 8)
    obj = objective(sets)
    for _ in range(2000):
        k = rng.randrange(8)
        cand = sets[:]
        cand[k] = rng.choice(valid)
        if len(set(cand)) < 8:
            continue
        o = objective(cand)
        if o <= obj:
            sets, obj = cand, o
    if obj < best_obj:
        best, best_obj = sets, obj

cols = columns(best)
for a, b in itertools.combinations(list(cols), 2):
    print(f"  r({a},{b}) = {corr(cols[a], cols[b]):+.3f}")

out = []
for idx, s in enumerate(best):
    options = [{"STR": o[0][0], "ENV": o[0][1], "LOY": o[0][2], "PRICE": o[1]} for o in s]
    out.append({"set": idx + 1, "options": options})
    print(idx + 1, [f"{''.join(map(str, o[0]))}/p{o[1]}" for o in s])

path = pathlib.Path(__file__).resolve().parent.parent / "src" / "data" / "design.json"
path.write_text(json.dumps({"benefits": BENEFITS, "priceLevels": [-0.15, -0.05, 0.05, 0.15],
                            "objective": best_obj, "sets": out}, indent=2))
print("wrote", path)
