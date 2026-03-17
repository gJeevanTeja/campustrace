import sys

REWARDS_JSX = """           {/* Rewards Section */}
           <PremiumCard className="p-8 space-y-6" hover={false}>
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                 <Trophy size={18} className="text-amber-500" /> Rewards
              </h3>
              <div className="space-y-4">
                 <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-amber-700">Reward Points</span>
                       <span className="text-2xl font-black text-amber-600">{p.reward_points || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-amber-700">Level</span>
                       <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">{p.level || 'Beginner Helper'}</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2 mt-2">
                       <div className="bg-amber-500 h-2 rounded-full transition-all duration-700" style={{ width: Math.min(100, Math.round(((p.reward_points || 0) % 300) / 3)) + '%' }} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-border">
                       <p className="text-2xl font-black text-primary">{p.successful_returns || 0}</p>
                       <p className="text-[10px] font-black uppercase text-text-secondary mt-1">Items Returned</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 text-center border border-border">
                       <p className="text-2xl font-black text-amber-600">{(p.badges || []).length}</p>
                       <p className="text-[10px] font-black uppercase text-text-secondary mt-1">Badges</p>
                    </div>
                 </div>
                 {(p.badges || []).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {(p.badges || []).map((badge, i) => (
                          <span key={i} className="text-xs font-black bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-xl">{badge}</span>
                       ))}
                    </div>
                 ) : (
                    <p className="text-xs font-bold text-text-secondary text-center py-2">Return items to earn badges!</p>
                 )}
              </div>
           </PremiumCard>
"""

profile_path = r'c:\Users\JEEVAN TEJA\Desktop\campustrace-main\frontend\src\pages\Profile.jsx'

with open(profile_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines before: {len(lines)}")

# Find the line with Popups comment
popups_idx = None
for i, line in enumerate(lines):
    if 'Popups' in line:
        popups_idx = i
        print(f"Found '{{/* Popups */}}' at line index {i} (line {i+1})")
        break

if popups_idx is None:
    print("ERROR: Could not find Popups comment!")
    sys.exit(1)

# Insert the rewards section BEFORE the Popups line (there's a blank line at popups_idx - 1)
insert_at = popups_idx  # Insert BEFORE the Popups comment
lines.insert(insert_at, REWARDS_JSX + '\n')

with open(profile_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f"Total lines after: {len(lines)}")
print("Rewards section inserted successfully!")
