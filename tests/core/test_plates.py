import pytest
from fitness_core.plates import nearest_loadable, warmup_ramp

KG = [25, 20, 15, 10, 5, 2.5, 1.25]

def test_exact_load():
    w, ps = nearest_loadable(180, 20, KG)
    assert w == pytest.approx(180)
    assert ps == [25, 25, 25, 5]

def test_snaps_to_nearest_loadable():
    w, ps = nearest_loadable(202, 20, KG)
    assert w == pytest.approx(202.5)
    assert ps == [25, 25, 25, 15, 1.25]

def test_target_below_bar_returns_bare_bar():
    assert nearest_loadable(15, 20, KG) == (20, [])

def test_warmup_ramp_starts_at_bar_and_increases():
    ramp = warmup_ramp(180, 20, KG)
    assert ramp[0][0] == 20 and ramp[0][1] == 5 and ramp[0][2] == []
    weights = [w for (w, _r, _ps) in ramp]
    assert weights == sorted(weights) and len(set(weights)) == len(weights)


def test_empty_plates_returns_bare_bar():
    assert nearest_loadable(100, 20, []) == (20, [])


def test_snap_up_uses_canonical_plates():
    # 34 snaps up to 35; per side 7.5 should be [5, 2.5], not [5, 1.25, 1.25]
    w, ps = nearest_loadable(34, 20, [5, 2.5, 1.25])
    assert w == pytest.approx(35)
    assert ps == [5, 2.5]


def test_lb_set_exact():
    LB = [45, 35, 25, 10, 5, 2.5]
    w, ps = nearest_loadable(225, 45, LB)
    assert w == pytest.approx(225)
    assert ps == [45, 45]
