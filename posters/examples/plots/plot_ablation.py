"""Horizontal bar chart: component ablation on WESAD (MuSDeT poster example).
MuSDeT > -M2 Gates > -M3 Temporal > -M1 Encoder — monotonic degradation.

Brand-styled via the MINT figure system: universal conventions from posters/figures/mint.mplstyle,
MuSDeT accents from mint_figs.PALETTE, Inter at generation time. Data and layout are unchanged from
the original cvpr-poster-template figure (Table 2, WESAD accuracy); only the font (Helvetica->Inter)
and colour-sourcing change. Output: assets/ablation_bars.svg (font-free; text as glyph paths).
"""
import numpy as np
import matplotlib.pyplot as plt

import mint_figs
mint_figs.apply()
C = mint_figs.PALETTE

# Data from Table 2 (WESAD accuracy), severity-descending for a monotonic visual story; labels
# carry M-prefixes so the reader links each bar to the architectural module that was removed.
variants = ['MuSDeT', '$-$M2 Gates\n($-$6.1pp)', '$-$M3 Temporal\n($-$9.7pp)', '$-$M1 Encoder\n($-$22.2pp)']
acc = [66.9, 60.8, 57.2, 44.7]
std = [24.3, 24.0, 21.9, 16.8]

# MuSDeT = gold (hero); each ablation bar takes the architecture colour of the module removed.
colors = [C['gold'], C['m2'], C['m3'], C['m1']]

fig, ax = plt.subplots(figsize=(10, 6.0))

y = np.arange(len(variants))
ax.barh(y, acc, xerr=std, height=0.6,
        color=colors, edgecolor=C['navy'], linewidth=1.5,
        capsize=5, error_kw={'linewidth': 1.5, 'color': C['mute']}, zorder=3)

# Value labels inside bars — white on the dark teal/blue bars, navy on the lighter gold/orange.
text_colors = [C['navy'], 'white', C['navy'], 'white']
for i, a in enumerate(acc):
    ax.text(a - 2, y[i], f'{a}%', ha='right', va='center',
            fontsize=20, fontweight='bold', color=text_colors[i],
            bbox=dict(facecolor=colors[i], edgecolor='none', pad=2), zorder=5)

ax.set_xlabel('LOSO Accuracy (%)', fontsize=22, color=C['navy'])
ax.set_xlim(0, 100)
ax.set_yticks(y)
ax.set_yticklabels(variants, fontsize=18, color=C['navy'])
ax.tick_params(axis='x', labelsize=17, colors=C['navy'])
ax.invert_yaxis()
ax.grid(axis='x', zorder=0)   # colour/alpha from mint.mplstyle; spines (top/right off) too

fig.tight_layout()
fig.savefig(mint_figs.ASSETS / 'ablation_bars.svg')
print('Saved', mint_figs.ASSETS / 'ablation_bars.svg')
