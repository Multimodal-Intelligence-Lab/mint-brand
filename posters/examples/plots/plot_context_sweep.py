"""Line plot: temporal context length K vs LOSO accuracy on WESAD (MuSDeT poster example).
Monotonic scaling K=1 (57.2%) -> K=30 (66.9%): +9.7pp from temporal context.

Brand-styled via the MINT figure system (see mint_figs.py). Data and layout are unchanged from the
original cvpr-poster-template figure (Table 3, WESAD); only the font (Helvetica->Inter) and
colour-sourcing change. Output: assets/context_sweep.svg (font-free; text as glyph paths).
"""
import numpy as np
import matplotlib.pyplot as plt

import mint_figs
mint_figs.apply()
C = mint_figs.PALETTE

K = [1, 5, 10, 20, 30]
acc = np.array([57.2, 60.2, 61.6, 63.5, 66.9])
std = np.array([21.9, 23.3, 23.7, 23.8, 24.3])

fig, ax = plt.subplots(figsize=(10, 6.0))   # matched aspect to ablation for column-3 alignment
x = np.arange(len(K))                        # categorical, evenly spaced

ax.errorbar(x, acc, yerr=std, fmt='none', ecolor=C['mute'], elinewidth=1.5,
            capsize=6, capthick=1.5, zorder=2)
ax.plot(x, acc, color=C['gold'], linewidth=3.5, zorder=3)
ax.scatter(x, acc, s=200, color=C['gold'], edgecolors=C['navy'], linewidths=2, zorder=4)

for i, a in enumerate(acc):
    ax.annotate(f'{a}%', (x[i], a), textcoords='offset points', xytext=(0, 20),
                ha='center', fontsize=18, fontweight='bold', color=C['navy'])

# Total-gain bracket on the right — navy for distance-readability (the gold line/dots carry the
# MuSDeT colour identity; a gold label here was too low-contrast far away).
ax.annotate('', xy=(x[-1] + 0.35, acc[-1]), xytext=(x[-1] + 0.35, acc[0]),
            arrowprops=dict(arrowstyle='<->', color=C['navy'], lw=3))
ax.text(x[-1] + 0.55, (acc[0] + acc[-1]) / 2, '+9.7pp',
        fontsize=20, fontweight='bold', color=C['navy'], va='center')

ax.set_xlabel('Context length K (1-sec windows)', fontsize=22, color=C['navy'])
ax.set_ylabel('LOSO Accuracy (%)', fontsize=22, color=C['navy'])
ax.set_xticks(x)
ax.set_xticklabels([str(k) for k in K], fontsize=20, color=C['navy'])
ax.tick_params(axis='y', labelsize=17, colors=C['navy'])
ax.set_ylim(42, 82)
ax.set_xlim(-0.5, len(K) - 0.3)
ax.grid(axis='y', zorder=0)   # colour/alpha from mint.mplstyle

ax.text(2, 44, 'Monotonic scaling on WESAD', fontsize=18, fontstyle='italic',
        color=C['mute'], ha='center')

fig.tight_layout()
fig.savefig(mint_figs.ASSETS / 'context_sweep.svg')
print('Saved', mint_figs.ASSETS / 'context_sweep.svg')
