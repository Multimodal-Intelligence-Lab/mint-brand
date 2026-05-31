"""Seed-robustness strip plot: 5 models x 5 seeds x 2 datasets (MuSDeT poster example).
Per-seed dots + mean lines; the story is that MuSDeT's WORST seed sits above EVERY baseline seed.

  ⚠ ILLUSTRATIVE DATA — NOT real per-seed results.
  The original results file (aggregated.json) is not in this repo; the path it loaded from no
  longer exists. The accuracies in SEED_ACCS below are SYNTHETIC, hand-set to (a) anchor MuSDeT's
  WESAD mean to the published 66.9% (the figure stays consistent with the poster's headline number)
  and (b) reproduce the paper's qualitative story (MuSDeT worst seed above all baselines -> zero /
  near-zero overlap). They exist to standardise the figure's LOOK for the template. Do NOT cite the
  individual dot values. To make this a true result, drop the real per-seed accuracies into
  SEED_ACCS (same shape) and re-run — nothing else changes.

Brand-styled via the MINT figure system (see mint_figs.py): MuSDeT = gold (hero), baselines
de-emphasised to neutral grey (60/30/10 — our model pops; no off-brand blues). Inter at generation
time; font-free SVG. Output: assets/seed_robustness.svg.
"""
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

import mint_figs
mint_figs.apply()
C = mint_figs.PALETTE

model_labels = ['MuSDeT\n(Ours)', 'Husformer', 'H2', 'PHemoNet', 'HyperFuse\nNet']

# ILLUSTRATIVE per-seed accuracies (see module docstring) — rows are
# [MuSDeT, Husformer, H2, PHemoNet, HyperFuseNet]; MuSDeT WESAD mean = published 66.9%.
SEED_ACCS = {
    'wesad': [
        [65.4, 66.2, 66.9, 67.5, 68.5],   # MuSDeT — mean 66.9, worst seed 65.4
        [59.1, 60.4, 61.0, 62.2, 63.3],
        [56.8, 58.0, 58.9, 60.1, 61.0],
        [54.0, 55.5, 56.8, 57.9, 59.0],
        [58.5, 60.0, 61.2, 62.0, 63.0],
    ],
    'affectiveroad': [
        [83.0, 84.2, 84.8, 85.5, 86.5],   # MuSDeT — worst seed 83.0
        [78.0, 79.5, 80.2, 81.0, 82.5],
        [76.0, 77.2, 78.0, 79.1, 80.0],
        [74.5, 75.8, 76.5, 77.5, 78.8],
        [77.0, 78.5, 79.3, 80.2, 81.5],
    ],
}

fig, axes = plt.subplots(1, 2, figsize=(18, 5.8))   # wide Results figure (two datasets)
plt.subplots_adjust(wspace=0.35)

for ax_idx, (dataset, title) in enumerate([('wesad', 'WESAD (3-class)'),
                                            ('affectiveroad', 'AffectiveROAD (binary)')]):
    ax = axes[ax_idx]
    accs_by_model = SEED_ACCS[dataset]
    n = len(model_labels)

    musdet_min = min(accs_by_model[0])
    baseline_max = max(max(a) for a in accs_by_model[1:])

    for i, accs in enumerate(accs_by_model):
        mean_acc = sum(accs) / len(accs)
        jitter = np.random.default_rng(42 + i).uniform(-0.13, 0.13, size=len(accs))
        xs = np.full(len(accs), i) + jitter
        if i == 0:   # MuSDeT — gold, larger, navy-outlined; thick gold mean line
            ax.scatter(xs, accs, s=160, color=C['gold'], edgecolors=C['navy'],
                       linewidths=1.8, zorder=4)
            ax.plot([i - 0.25, i + 0.25], [mean_acc, mean_acc], color=C['gold'],
                    linewidth=4.0, zorder=5, solid_capstyle='round')
        else:        # baselines — de-emphasised neutral grey
            ax.scatter(xs, accs, s=100, color=C['mute_soft'], edgecolors=C['mute'],
                       linewidths=1.2, zorder=4)
            ax.plot([i - 0.25, i + 0.25], [mean_acc, mean_acc], color=C['mute'],
                    linewidth=2.5, zorder=5, solid_capstyle='round')

    # Dashed line at MuSDeT's worst seed + shaded gap to the best baseline — gold, ties to MuSDeT.
    ax.axhline(musdet_min, color=C['gold'], linestyle='--', linewidth=2.0, alpha=0.85, zorder=2)
    if musdet_min > baseline_max:
        ax.axhspan(baseline_max, musdet_min, alpha=0.15, color=C['gold'], zorder=1)

    ax.text(n - 0.5, musdet_min, f'worst seed = {musdet_min:.1f}%',
            fontsize=12, color=C['navy'], fontweight='bold', ha='left', va='bottom')
    overlap = 'Zero overlap' if dataset == 'wesad' else 'Near-zero\noverlap'
    ax.text(n - 0.5, musdet_min - 0.3, overlap, fontsize=14, fontweight='bold', fontstyle='italic',
            color=C['navy'], ha='left', va='top',
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor=C['mute'], alpha=0.9))

    ax.set_title(title, fontsize=19, fontweight='bold', color=C['navy'], pad=8)
    ax.set_xticks(np.arange(n))
    ax.set_xticklabels(model_labels, fontsize=12, color=C['navy'])
    ax.set_ylabel('LOSO Accuracy (%)' if ax_idx == 0 else '', fontsize=16, color=C['navy'])
    ax.tick_params(axis='y', labelsize=12, colors=C['navy'])
    ax.grid(axis='y', zorder=0)

    flat = [a for row in accs_by_model for a in row]
    ax.set_ylim(min(flat) - 4, max(flat) + 4)
    ax.set_xlim(-0.5, n + 2.0)   # right margin for the worst-seed / overlap labels

legend_elements = [
    mpatches.Patch(facecolor=C['gold'], edgecolor=C['navy'], label='MuSDeT (Ours)'),
    mpatches.Patch(facecolor=C['mute_soft'], edgecolor=C['mute'], label='Baselines'),
    plt.Line2D([0], [0], color=C['gold'], linewidth=2, linestyle='--', label='MuSDeT worst seed'),
]
fig.legend(handles=legend_elements, loc='lower center', ncol=3, fontsize=12,
           framealpha=0.95, bbox_to_anchor=(0.5, -0.02))

fig.tight_layout(rect=[0, 0.05, 1, 1])
fig.savefig(mint_figs.ASSETS / 'seed_robustness.svg')
print('Saved', mint_figs.ASSETS / 'seed_robustness.svg')
